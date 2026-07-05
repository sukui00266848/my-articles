#!/usr/bin/env node
// scripts/contrast-check.js
// Usage: node scripts/contrast-check.js jiangshan-palettes.json [familyId] [variantId]

const fs = require("fs");
const chroma = require("chroma-js");

const themeFile = process.argv[2];
if (!themeFile || !fs.existsSync(themeFile)) {
  console.error("请提供 theme JSON 文件路径，例如 jiangshan-palettes.json");
  process.exit(2);
}
const familyId = process.argv[3];
const variantId = process.argv[4];

const data = JSON.parse(fs.readFileSync(themeFile, "utf8"));
const families = data.families || data;
const familiesToCheck = familyId ? families.filter(f => f.id === familyId) : families;

let failed = [];

familiesToCheck.forEach(f => {
  const variants = f.variants || [];
  const vs = variantId ? variants.filter(v => v.id === variantId) : variants;
  vs.forEach(v => {
    const p = v.palette;
    const text = p.text || p["--theme-text"] || "#000";
    const title = p.title || p["--theme-title"] || text;
    const bg = p.paper || p["--theme-paper"] || "#fff";
    const textContrast = chroma.contrast(text, bg);
    const titleContrast = chroma.contrast(title, bg);
    console.log(f.id + "/" + v.id + ": text/bg=" + textContrast.toFixed(2) + ", title/bg=" + titleContrast.toFixed(2));
    if (textContrast < 4.5) failed.push({ family: f.id, variant: v.id, type: "text-bg", value: textContrast });
    if (titleContrast < 3.0) failed.push({ family: f.id, variant: v.id, type: "title-bg", value: titleContrast });
  });
});

if (failed.length) {
  console.error("对比度检测未通过：");
  failed.forEach(f => console.error("  " + f.family + "/" + f.variant + " " + f.type + "=" + f.value.toFixed(2)));
  process.exitCode = 3;
} else {
  console.log("所有检查通过（text/bg >=4.5, title/bg >=3.0）。");
}
