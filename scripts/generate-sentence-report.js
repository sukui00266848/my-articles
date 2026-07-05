#!/usr/bin/env node
// generate-sentence-report.js
// Usage: node scripts/generate-sentence-report.js <content_dir> <maxLen>
// Outputs: sentence-report.json and sentence-report.md in ./reports/
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const contentRoot = process.argv[2] || './content';
const maxLen = parseInt(process.argv[3] || '30', 10);
const outDir = './reports';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

function walk(dir) {
  const files = fs.readdirSync(dir);
  let md = [];
  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) md = md.concat(walk(full));
    else if (f.endsWith('.md')) md.push(full);
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

const files = walk(contentRoot);
let totalChars = 0, totalSentences = 0;
let report = { meta: { scannedFiles: files.length, maxLen }, overlong: [] };

files.forEach(file => {
  const raw = fs.readFileSync(file, 'utf8');
  const { content } = matter(raw);
  const sents = splitSentencesChinese(content);
  sents.forEach((sent, idx) => {
    const len = countChineseChars(sent);
    totalChars += len;
    totalSentences++;
    if (len > maxLen) {
      report.overlong.push({
        file: path.relative(process.cwd(), file),
        sentenceIndex: idx + 1,
        length: len,
        text: sent
      });
    }
  });
});

report.meta.totalSentences = totalSentences;
report.meta.totalChars = totalChars;
report.meta.avgLen = totalSentences ? (totalChars / totalSentences) : 0;

fs.writeFileSync(path.join(outDir, 'sentence-report.json'), JSON.stringify(report, null, 2), 'utf8');

// Markdown summary
let md = '# 句长检查报告\n\n';
md += '- 扫描文件数: ' + report.meta.scannedFiles + '\n';
md += '- 总句数: ' + report.meta.totalSentences + '\n';
md += '- 平均句长: ' + report.meta.avgLen.toFixed(1) + '\n';
md += '- 超长句阈值: ' + report.meta.maxLen + '\n';
md += '- 超长句数量: ' + report.overlong.length + '\n\n';
md += '---\n\n';

report.overlong.forEach((o, i) => {
  md += '## ' + (i + 1) + '. ' + o.file + ' (句 #' + o.sentenceIndex + ') — ' + o.length + ' 字\n\n';
  md += '> ' + o.text + '\n\n';
  md += '---\n\n';
});
fs.writeFileSync(path.join(outDir, 'sentence-report.md'), md, 'utf8');

console.log('报告生成：' + outDir + '/sentence-report.json 以及 ' + outDir + '/sentence-report.md');
process.exit(0);
