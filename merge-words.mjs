// Gộp public/words-extra.json vào public/words.json (khớp cấp độ theo thứ tự, bỏ qua từ trùng).
// Cách dùng: npm run merge-words
import fs from "node:fs";
const [, , basePath = "public/words.json", extraPath = "public/words-extra.json"] = process.argv;
const base = JSON.parse(fs.readFileSync(basePath, "utf8"));
const extra = JSON.parse(fs.readFileSync(extraPath, "utf8"));
fs.copyFileSync(basePath, basePath + ".bak");
extra.levels.forEach((lv, i) => {
  base.levels[i] ??= { level: lv.level, range: lv.range, words: [] };
  const t = base.levels[i];
  t.words ??= [];
  const seen = new Set(t.words.map(w => w.word.toLowerCase()));
  let n = 0;
  for (const w of lv.words) if (!seen.has(w.word.toLowerCase())) { t.words.push(w); n++; }
  console.log(`${t.level}: +${n} từ`);
});
fs.writeFileSync(basePath, JSON.stringify(base, null, 2) + "\n");
console.log("Xong. Bản sao lưu: " + basePath + ".bak");
