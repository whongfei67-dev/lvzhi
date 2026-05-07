import fs from "node:fs";

import { CRIMINAL_CAUSE_LIBRARY } from "../apps/web/lib/recommendation/config/criminal-cause-library";

const sourcePath = "/Users/jinbaowang/Desktop/律植项目/标签库/刑法标签库.txt";
const raw = fs.readFileSync(sourcePath, "utf8");
const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

let currentChapter = "";
const sourcePairs: string[] = [];
for (const line of lines) {
  const chapterMatch = line.match(/^第([一二三四五六七八九十百零〇两]+)章\s*(.+?)(?:（\d+）|\(\d+\))?$/);
  if (chapterMatch) {
    currentChapter = chapterMatch[2].trim();
    continue;
  }
  const sectionMatch = line.match(/^第([一二三四五六七八九十百零〇两]+)节\s*(.+?)(?:（\d+）|\(\d+\))?$/);
  if (sectionMatch) {
    sourcePairs.push(`${currentChapter}||${sectionMatch[2].trim()}`);
  }
}

const sourceSet = [...new Set(sourcePairs)];
const generatedSet = [
  ...new Set(CRIMINAL_CAUSE_LIBRARY.filter((item) => item.level === 2).map((item) => `${item.path[1]}||${item.label}`)),
];

const missing = sourceSet.filter((item) => !generatedSet.includes(item));
const extra = generatedSet.filter((item) => !sourceSet.includes(item));

const sourceChapterMap = new Map<string, number>();
for (const pair of sourceSet) {
  const [chapter] = pair.split("||");
  sourceChapterMap.set(chapter, (sourceChapterMap.get(chapter) ?? 0) + 1);
}

const generatedChapterMap = new Map<string, number>();
for (const pair of generatedSet) {
  const [chapter] = pair.split("||");
  generatedChapterMap.set(chapter, (generatedChapterMap.get(chapter) ?? 0) + 1);
}

console.log(
  JSON.stringify(
    {
      sourceL2Count: sourceSet.length,
      generatedL2Count: generatedSet.length,
      missing,
      extra,
      byChapter: [...sourceChapterMap.keys()].map((chapter) => ({
        chapter,
        source: sourceChapterMap.get(chapter) ?? 0,
        generated: generatedChapterMap.get(chapter) ?? 0,
      })),
    },
    null,
    2,
  ),
);
