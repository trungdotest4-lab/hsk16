// Sinh dữ liệu từ vựng HSK1-6 cho app từ danh sách chính thức 2012
// Nguồn: scripts/source/hskN.txt (tab-separated: giản thể, phồn thể, pinyin số, pinyin, nghĩa Anh)
// Nghĩa Việt: HSK1 lấy từ src/data/hsk1.ts, HSK2-3 từ scripts/vi-hskN.json
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "src/data/hsk");
mkdirSync(OUT, { recursive: true });

// Nghĩa Việt HSK1 trích từ file hsk1.ts hiện có
const hsk1ts = readFileSync(join(ROOT, "src/data/hsk1.ts"), "utf8");
const vi1 = {};
for (const m of hsk1ts.matchAll(/h:\s*"([^"]+)",\s*p:\s*"[^"]*",\s*vi:\s*"([^"]+)"/g)) {
  vi1[m[1]] = m[2];
}

const viMaps = {
  1: vi1,
  2: JSON.parse(readFileSync(join(ROOT, "scripts/vi-hsk2.json"), "utf8")),
  3: JSON.parse(readFileSync(join(ROOT, "scripts/vi-hsk3.json"), "utf8")),
  4: {},
  5: {},
  6: {},
};

for (let n = 1; n <= 6; n++) {
  const txt = readFileSync(join(ROOT, `scripts/source/hsk${n}.txt`), "utf8")
    .replace(/^\uFEFF/, "")
    .trim();
  const words = [];
  const seen = new Set();
  for (const line of txt.split("\n")) {
    const [simp, , , pinyin, en] = line.split("\t");
    if (!simp || seen.has(simp)) continue;
    seen.add(simp);
    const w = { h: simp.trim(), p: (pinyin ?? "").trim(), en: (en ?? "").trim() };
    const vi = viMaps[n][w.h];
    if (vi) w.vi = vi;
    words.push(w);
  }
  writeFileSync(join(OUT, `level${n}.json`), JSON.stringify(words));
  const translated = words.filter((w) => w.vi).length;
  console.log(`HSK${n}: ${words.length} từ (${translated} có nghĩa Việt)`);
}
