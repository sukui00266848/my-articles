#!/usr/bin/env node
// apply-rewrites.js — apply manual sentence rewrites
const fs = require("fs");

const rewrites = [
  { file: "content/citation-guidelines.md",
    marker: "为每条声明找出",
    find: "1. 为每条声明找出 1 个以上权威来源（期刊/教材/古籍）或明确标注为“经验描述/个案/观点”。",
    repl: "1. 为每条声明找到至少一个权威来源（期刊、教材或古籍），或在文中明确标注为“经验描述”“个案”或“观点”。" },
  { file: "content/citation-guidelines.md",
    marker: "二次核验必需",
    find: "对于“古籍”关键词（如《素问》《本草》）自动提示上传权威版本信息或标注“二次核验必需”。",
    repl: "对于“古籍”关键词（如《素问》《本草》），应自动提示上传权威版本信息，或标注“须二次核验”。" },
];

let applied = 0;
for (const r of rewrites) {
  const raw = fs.readFileSync(r.file, "utf8");
  if (raw.includes(r.find)) {
    const updated = raw.replace(r.find, r.repl);
    fs.writeFileSync(r.file, updated, "utf8");
    console.log("OK: " + r.file.split("/").pop() + " (marker: " + r.marker + ")");
    applied++;
  } else {
    console.log("NOT FOUND: " + r.file.split("/").pop() + " (marker: " + r.marker + ")");
    // Debug: find the line containing the marker
    const lines = raw.split("\n");
    for (const line of lines) {
      if (line.includes(r.marker)) {
        console.log("  Found line: " + line.slice(0, 120));
        break;
      }
    }
  }
}
console.log("\nApplied: " + applied + "/" + rewrites.length);
