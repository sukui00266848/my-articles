#!/usr/bin/env node
// scripts/sentence-checker.js
// Usage: node scripts/sentence-checker.js content/ 30

const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const root = process.argv[2] || process.cwd();
const maxLen = parseInt(process.argv[3] || "30", 10);

function walk(dir) {
  const files = fs.readdirSync(dir);
  let md = [];
  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) md = md.concat(walk(full));
    else if (f.endsWith(".md")) md.push(full);
  }
  return md;
}

function splitSentencesChinese(text) {
  const re = /[^。！？；\n]+[。！？；]?/g;
  const matches = text.match(re) || [];
  return matches.map(s => s.trim()).filter(Boolean);
}

function countChineseChars(s) {
  const m = s.match(/[一-鿿㐀-䶿＀-￯]/g);
  return m ? m.length : 0;
}

const files = walk(root);
let totalChars = 0, totalSentences = 0;
let over = [];

for (const file of files) {
  const raw = fs.readFileSync(file, "utf8");
  const { content } = matter(raw);
  const sents = splitSentencesChinese(content);
  sents.forEach((sent, idx) => {
    const len = countChineseChars(sent);
    totalChars += len;
    totalSentences++;
    if (len > maxLen) {
      const p = sent.search(/[，,；;：:]/);
      let suggestion = "建议人工断句。";
      if (p !== -1 && countChineseChars(sent.slice(0, p + 1)) > Math.floor(maxLen / 2)) {
        suggestion = "建议在标点处拆分（例如在第 " + (p + 1) + " 字后）。";
      } else {
        let cnt = 0;
        for (let i = 0; i < sent.length; i++) {
          if (/[一-鿿㐀-䶿＀-￯]/.test(sent[i])) cnt++;
          if (cnt >= maxLen) {
            suggestion = "建议在第 " + (i + 1) + " 个字符附近拆分。";
            break;
          }
        }
      }
      over.push({ file, index: idx + 1, length: len, snippet: sent.slice(0, 200), suggestion });
    }
  });
}

const avg = totalSentences ? (totalChars / totalSentences).toFixed(1) : 0;
console.log("句长检查：文件数=" + files.length + " 句子数=" + totalSentences + " 平均句长（中文字符）=" + avg + "，阈值=" + maxLen);
if (over.length) {
  console.log("超长句清单：");
  over.forEach((o, i) => {
    console.log("\n" + (i + 1) + ") " + o.file + " (句 #" + o.index + ") len=" + o.length);
    console.log("    " + o.snippet);
    console.log("    " + o.suggestion);
  });
  process.exitCode = 2;
} else {
  console.log("全部句子长度合规。");
}
