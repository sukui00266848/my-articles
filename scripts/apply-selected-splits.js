#!/usr/bin/env node
// scripts/apply-selected-splits.js
// Usage: node scripts/apply-selected-splits.js
// Selectively applies approved sentence splits using raw text replacement.
const fs = require("fs");
const path = require("path");

// ----- Approved sentences (index = 0-based sentence number within file) -----
const accepted = [
  // file, 0-based sentence index, expected sentence text (for verification)
  ["content/article-template.md", 1,
    "2–3 句（不超过 200 字），直接提出读者痛点或悬念，用简洁明了的语言引导阅读。"],
  ["content/citation-guidelines.md", 21,
    "- 格式：书名. 卷/篇/条（若有）. 译本/校注（若用）. 出版社, 年份（如使用现代影印/译注则注明版本）"],
  ["content/citation-guidelines.md", 33,
    "2. 对古籍引用，需上传该古籍的权威版本信息（出版社/卷页/译注），若为二手引文需标注\"转引自 X\"。"],
  ["content/citation-guidelines.md", 46,
    "- 纠正：古籍引文应标注出处并注明\"为古代文献记载/历史资料\"，不可直接用于现代用药建议。"],
  ["content/media-guidelines.md", 33,
    "- 对于复杂背景（需要纸纹/书法），出于兼容性建议预合成一张背景图并使用 WebP。"],
  ["content/media-guidelines.md", 37,
    "- 若图片包含医疗操作演示或人体图像，必须标注适用人群限制与免责声明。"],
  ["content/media-guidelines.md", 39,
    "- 所有非原创图片必须附带授权凭证（采购单/授权邮件/购买记录），并在 meta.yml 的 source 或 purchase_id 字段标注。"],
  ["content/media-guidelines.md", 48,
    "- 在构建时检测图片尺寸与文件大小，不合格给出错误或警告（可用 sharp 脚本）。"],
];

const MAX_LEN = 30;

function countChineseChars(s) {
  const m = s.match(/[一-鿿㐀-䶿＀-￯]/g);
  return m ? m.length : 0;
}

function splitAtBestPos(sent, maxLen) {
  const punctuation = /[，,；;：:、]/g;
  let lastPunc = -1, count = 0;
  for (let i = 0; i < sent.length; i++) {
    if (/[一-鿿㐀-䶿＀-￯]/.test(sent[i])) count++;
    if (count <= maxLen && punctuation.test(sent[i])) lastPunc = i;
  }
  if (lastPunc > Math.floor(maxLen / 2)) {
    return [sent.slice(0, lastPunc + 1).trim(), sent.slice(lastPunc + 1).trim()];
  }
  count = 0;
  for (let i = 0; i < sent.length; i++) {
    if (/[一-鿿㐀-䶿＀-￯]/.test(sent[i])) count++;
    if (count >= maxLen) return [sent.slice(0, i + 1).trim(), sent.slice(i + 1).trim()];
  }
  return [sent, ""];
}

// ----- Group by file -----
const byFile = {};
accepted.forEach(([file, idx, text]) => {
  byFile[file] = byFile[file] || [];
  byFile[file].push({ idx, text });
});

let totalApplied = 0;

Object.keys(byFile).forEach(relFile => {
  const filePath = path.resolve(relFile);
  let raw = fs.readFileSync(filePath, "utf8");

  // Re-extract sentences from raw content (after frontmatter)
  const fmMatch = raw.match(/^---[\s\S]*?---\r?\n/);
  const fm = fmMatch ? fmMatch[0] : "";
  let body = fmMatch ? raw.slice(fm.length) : raw;

  const re = /[^。！？；\n]+[。！？；]?/g;
  const sents = [];
  let m;
  while ((m = re.exec(body)) !== null) sents.push({ text: m[0], start: m.index, end: m.index + m[0].length });

  // Apply splits from last to first (preserve indices)
  const entries = byFile[relFile].sort((a, b) => b.idx - a.idx);
  entries.forEach(({ idx, text }) => {
    if (idx >= sents.length) { console.error("Bad index " + idx + " in " + relFile); return; }
    const sent = sents[idx];
    if (sent.text.trim() !== text.trim()) {
      console.warn("Text mismatch in " + relFile + " #" + (idx + 1) + ". Skipping.");
      console.warn("  Expected: " + text.slice(0, 80));
      console.warn("  Found:    " + sent.text.slice(0, 80));
      return;
    }
    const [a, b] = splitAtBestPos(sent.text, MAX_LEN);
    const replacement = a + "\n\n" + b;
    body = body.slice(0, sent.start) + replacement + body.slice(sent.end);
    console.log("Split: " + relFile + " #" + (idx + 1) + " (" + countChineseChars(sent.text) + " chars)");
    totalApplied++;
  });

  fs.writeFileSync(filePath, fm + body, "utf8");
});

console.log("\nApplied " + totalApplied + " splits across " + Object.keys(byFile).length + " files.");
