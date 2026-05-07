import fs from "node:fs";
import path from "node:path";

type CivilCauseNode = {
  id: string;
  level: 1 | 2 | 3 | 4;
  partIndex?: number;
  chapterIndex?: number;
  itemIndex?: number;
  subItemIndex?: number;
  label: string;
  parentId: string | null;
  path: string[];
};

const SOURCE_TXT_PATH = "/Users/jinbaowang/Desktop/律植项目/标签库/民事标签库.txt";
const OUTPUT_TS_PATH =
  "/Users/jinbaowang/Desktop/律植项目/律植（新）代码/apps/web/lib/recommendation/config/civil-cause-library.ts";
const ROOT_LABEL = "民事案由";

function normalizeLine(input: string): string {
  return input
    .replace(/\u200f/g, "")
    .replace(/\t+\d+\s*$/g, "")
    .replace(/\s+$/g, "")
    .trim();
}

function escapeTsString(input: string): string {
  return input.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function parseCivilCauseNodes(rawText: string): CivilCauseNode[] {
  const nodes: CivilCauseNode[] = [];
  const lines = rawText.split(/\r?\n/).map(normalizeLine).filter(Boolean);

  let currentPart: { id: string; index: number; label: string } | null = null;
  let currentChapter: { id: string; index: number; label: string } | null = null;
  let currentItem: { id: string; index: number; label: string } | null = null;

  for (const line of lines) {
    if (line === "民事标签库") continue;

    const partMatch = line.match(/^第([一二三四五六七八九十百零〇两]+)部分\s+(.+)$/);
    if (partMatch) {
      const partIndex = nodes.filter((n) => n.level === 1).length + 1;
      const label = partMatch[2].trim();
      const id = `civil-l1-${partIndex}`;
      nodes.push({
        id,
        level: 1,
        partIndex,
        label,
        parentId: null,
        path: [ROOT_LABEL, label],
      });
      currentPart = { id, index: partIndex, label };
      currentChapter = null;
      currentItem = null;
      continue;
    }

    const chapterMatch = line.match(/^([一二三四五六七八九十百零〇两]+)、(.+)$/);
    if (chapterMatch && currentPart) {
      const chapterIndex = nodes.filter((n) => n.level === 2 && n.partIndex === currentPart?.index).length + 1;
      const label = chapterMatch[2].trim();
      const id = `civil-l2-${currentPart.index}-${chapterIndex}`;
      nodes.push({
        id,
        level: 2,
        partIndex: currentPart.index,
        chapterIndex,
        label,
        parentId: currentPart.id,
        path: [ROOT_LABEL, currentPart.label, label],
      });
      currentChapter = { id, index: chapterIndex, label };
      currentItem = null;
      continue;
    }

    const itemMatch = line.match(/^(\d+)\.(.+)$/);
    if (itemMatch && currentPart && currentChapter) {
      const itemIndex = Number(itemMatch[1]);
      const label = itemMatch[2].trim();
      const id = `civil-l3-${currentPart.index}-${currentChapter.index}-${itemIndex}`;
      nodes.push({
        id,
        level: 3,
        partIndex: currentPart.index,
        chapterIndex: currentChapter.index,
        itemIndex,
        label,
        parentId: currentChapter.id,
        path: [ROOT_LABEL, currentPart.label, currentChapter.label, label],
      });
      currentItem = { id, index: itemIndex, label };
      continue;
    }

    const subItemMatch = line.match(/^（(\d+)）(.+)$/);
    if (subItemMatch && currentPart && currentChapter && currentItem) {
      const subItemIndex = Number(subItemMatch[1]);
      const label = subItemMatch[2].trim();
      const id = `civil-l4-${currentPart.index}-${currentChapter.index}-${currentItem.index}-${subItemIndex}`;
      nodes.push({
        id,
        level: 4,
        partIndex: currentPart.index,
        chapterIndex: currentChapter.index,
        itemIndex: currentItem.index,
        subItemIndex,
        label,
        parentId: currentItem.id,
        path: [ROOT_LABEL, currentPart.label, currentChapter.label, currentItem.label, label],
      });
      continue;
    }
  }

  const deduped: CivilCauseNode[] = [];
  const seen = new Set<string>();
  for (const node of nodes) {
    const key = `${node.level}|${node.path.join(">")}|${node.parentId ?? "root"}|${node.itemIndex ?? ""}|${node.subItemIndex ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(node);
  }

  return deduped;
}

function renderOutput(nodes: CivilCauseNode[]): string {
  const rows = nodes
    .map((node) => {
      const pathLiteral = `[${node.path.map((p) => `"${escapeTsString(p)}"`).join(", ")}]`;
      const fields = [
        `id: "${node.id}"`,
        `level: ${node.level}`,
        `label: "${escapeTsString(node.label)}"`,
        `parentId: ${node.parentId ? `"${node.parentId}"` : "null"}`,
        `path: ${pathLiteral}`,
      ];
      if (typeof node.partIndex === "number") fields.push(`partIndex: ${node.partIndex}`);
      if (typeof node.chapterIndex === "number") fields.push(`chapterIndex: ${node.chapterIndex}`);
      if (typeof node.itemIndex === "number") fields.push(`itemIndex: ${node.itemIndex}`);
      if (typeof node.subItemIndex === "number") fields.push(`subItemIndex: ${node.subItemIndex}`);
      return `  { ${fields.join(", ")} }`;
    })
    .join(",\n");

  return `/**
 * Auto-generated from 标签库/民事标签库.txt.
 * Level mapping:
 * - L1: 第X部分
 * - L2: 一、
 * - L3: 1.
 * - L4: （1）
 * Root label is "${ROOT_LABEL}" to satisfy 5-level path requirements.
 */
export type CivilCauseNode = {
  id: string;
  level: 1 | 2 | 3 | 4;
  label: string;
  parentId: string | null;
  path: string[];
  partIndex?: number;
  chapterIndex?: number;
  itemIndex?: number;
  subItemIndex?: number;
};

export const CIVIL_CAUSE_ROOT_LABEL = "${ROOT_LABEL}";

export const CIVIL_CAUSE_LIBRARY: CivilCauseNode[] = [
${rows}
];

export const CIVIL_CAUSE_LABEL_SET = new Set(CIVIL_CAUSE_LIBRARY.map((item) => item.label));

export const CIVIL_CAUSE_LEAF_LABEL_SET = new Set(
  CIVIL_CAUSE_LIBRARY.filter((item) => item.level === 4).map((item) => item.label),
);
`;
}

function main(): void {
  const sourceText = fs.readFileSync(SOURCE_TXT_PATH, "utf8");
  const nodes = parseCivilCauseNodes(sourceText);
  const output = renderOutput(nodes);
  fs.mkdirSync(path.dirname(OUTPUT_TS_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_TS_PATH, output, "utf8");
  console.log(`Generated ${nodes.length} civil cause nodes -> ${OUTPUT_TS_PATH}`);
}

main();
