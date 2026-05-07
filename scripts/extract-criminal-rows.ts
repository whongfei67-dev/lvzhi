import fs from "node:fs";

const html = fs.readFileSync(
  "/Users/jinbaowang/Desktop/律植项目/律植（新）代码/apps/web/public/criminal-cause-mapping-scenarios-v1.html",
  "utf8",
);

const targetRows = [63, 64, 66, 67, 68, 69];

for (const n of targetRows) {
  const marker = `<td>${n}</td>`;
  const idx = html.indexOf(marker);
  if (idx === -1) {
    console.log(JSON.stringify({ row: n, error: "ROW_NOT_FOUND" }));
    continue;
  }
  const start = html.lastIndexOf("<tr>", idx);
  const end = html.indexOf("</tr>", idx);
  const chunk = html.slice(start, end + 5);
  const cells = [...chunk.matchAll(/<td>([\s\S]*?)<\/td>/g)].map((m) =>
    m[1].replace(/<[^>]+>/g, "").trim(),
  );
  console.log(
    JSON.stringify(
      {
        row: n,
        l1: cells[1],
        l2: cells[2],
        l3: cells[3],
        split: cells[4],
      },
      null,
      2,
    ),
  );
}
