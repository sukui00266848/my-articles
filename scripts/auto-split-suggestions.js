#!/usr/bin/env node
// auto-split-suggestions.js
// Usage: node scripts/auto-split-suggestions.js <reports/sentence-report.json> <content_root> <maxLen>
// Outputs: suggestions/<relative-path>.suggest.md with suggested in-place splits
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const reportPath = process.argv[2] || './reports/sentence-report.json';
const contentRoot = process.argv[3] || './content';
const maxLen = parseInt(process.argv[4] || '30', 10);
if (!fs.existsSync(reportPath)) {
  console.error('report not found:', reportPath);
  process.exit(2);
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
const suggestionsDir = './suggestions';
if (!fs.existsSync(suggestionsDir)) fs.mkdirSync(suggestionsDir, { recursive: true });

function splitAtBestPos(sent, maxLen) {
  // prefer last punctuation before maxLen, else split near maxLen
  const punctuation = /[，,；;：:、]/g;
  let lastPunc = -1, count = 0;
  for (let i = 0; i < sent.length; i++) {
    if (/[一-鿿㐀-䶿＀-￯]/.test(sent[i])) count++;
    if (count <= maxLen && punctuation.test(sent[i])) lastPunc = i;
  }
  if (lastPunc > Math.floor(maxLen / 2)) {
    return [sent.slice(0, lastPunc + 1).trim(), sent.slice(lastPunc + 1).trim()];
  }
  // fallback: split roughly at character position
  count = 0;
  for (let i = 0; i < sent.length; i++) {
    if (/[一-鿿㐀-䶿＀-￯]/.test(sent[i])) count++;
    if (count >= maxLen) return [sent.slice(0, i + 1).trim(), sent.slice(i + 1).trim()];
  }
  return [sent, ''];
}

const groups = {};
report.overlong.forEach(o => {
  groups[o.file] = groups[o.file] || [];
  groups[o.file].push(o);
});

Object.keys(groups).forEach(relFile => {
  const filePath = path.resolve(relFile);
  if (!fs.existsSync(filePath)) {
    console.error('文件缺失，跳过:', relFile);
    return;
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = matter(raw);
  const content = parsed.content;

  // split content into sentences while preserving delimiters
  const re = /[^。！？；\n]+[。！？；]?/g;
  const sents = [];
  let m;
  while ((m = re.exec(content)) !== null) {
    sents.push(m[0]);
  }

  // apply suggestions for specific sentence indices
  const modifiedParts = sents.map((s, idx) => {
    const found = groups[relFile].find(x => x.sentenceIndex === idx + 1);
    if (found) {
      const [a, b] = splitAtBestPos(found.text, maxLen);
      return a + '\n\n' + b;
    }
    return s;
  });

  const modified = modifiedParts.join('');

  // write suggested file to suggestions/
  const targetPath = path.join(suggestionsDir, relFile + '.suggest.md');
  const targetDir = path.dirname(targetPath);
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
  const out = matter.stringify(modified, parsed.data || {});
  fs.writeFileSync(targetPath, out, 'utf8');
  console.log('Suggestion written to', targetPath);
});

console.log('All suggestions generated in ./suggestions. Review before applying.');
