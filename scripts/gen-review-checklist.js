#!/usr/bin/env node
// scripts/gen-review-checklist.js
// Usage: node scripts/gen-review-checklist.js
// Outputs: reports/split-review-checklist.md
const fs = require("fs");
const report = JSON.parse(fs.readFileSync("./reports/sentence-report.json", "utf8"));
const maxLen = report.meta.maxLen;

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

let md = "# 拆句审阅清单\n\n";
md += "> 自动生成 | 阈值: " + maxLen + " 字 | 超长句: " + report.overlong.length + " 条\n\n";
md += "请逐条确认拆分是否语义正确。\n\n";
md += "| 标记 | 含义 |\n|---|---|\n| ✅ | 通过，可直接应用 |\n| ❌ | 需人工改 |\n| ⚠️ | 存疑，需讨论 |\n\n---\n\n";

const byFile = {};
report.overlong.forEach(o => {
  byFile[o.file] = byFile[o.file] || [];
  byFile[o.file].push(o);
});

let num = 0;
Object.keys(byFile).forEach(file => {
  md += "## " + file + "（" + byFile[file].length + " 条）\n\n";
  byFile[file].forEach(o => {
    num++;
    const [a, b] = splitAtBestPos(o.text, maxLen);
    md += "### " + num + ". 句 #" + o.sentenceIndex + " — " + o.length + " 字\n\n";
    md += "| | 内容 |\n|---|---|\n";
    md += "| **原文** | " + o.text + " |\n";
    md += "| **拆为 A** | " + a + " |\n";
    md += "| **拆为 B** | " + b + " |\n\n";
    md += "**审阅：** `[ ]` ✅ 通过  `[ ]` ❌ 需改  `[ ]` ⚠️ 存疑\n\n";
    md += "---\n\n";
  });
});

md += "\n## 汇总\n\n";
md += "| 文件 | 超长句数 | 通过 | 需改 | 存疑 |\n|---|---|---|---|---|\n";
Object.keys(byFile).forEach(f => md += "| " + f + " | " + byFile[f].length + " |  |  |  |\n");
md += "| **合计** | **" + report.overlong.length + "** |  |  |  |\n";

fs.writeFileSync("./reports/split-review-checklist.md", md, "utf8");
console.log("审阅清单已生成: ./reports/split-review-checklist.md");
console.log("共 " + report.overlong.length + " 条待审阅");
