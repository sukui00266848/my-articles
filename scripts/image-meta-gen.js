#!/usr/bin/env node
// scripts/image-meta-gen.js
// Usage: node scripts/image-meta-gen.js content/

const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const yaml = require("js-yaml");

const root = process.argv[2] || process.cwd();

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

const mdFiles = walk(root);
const imgRegex = /!\[[^\]]*\]\((images\/[^)]+)\)/g;
let created = [];

mdFiles.forEach(file => {
  const raw = fs.readFileSync(file, "utf8");
  let m;
  while ((m = imgRegex.exec(raw)) !== null) {
    const rel = m[1];
    const imgPath = path.join(process.cwd(), rel);
    if (fs.existsSync(imgPath)) {
      const metaPath = imgPath + ".meta.yml";
      if (!fs.existsSync(metaPath)) {
        const meta = {
          filename: path.basename(imgPath),
          title: "",
          alt: "",
          photographer: "",
          source: "",
          license: "",
          purchase_id: "",
          usage_rights_until: "",
          notes: ""
        };
        fs.writeFileSync(metaPath, yaml.dump(meta), "utf8");
        created.push(metaPath);
      }
    }
  }
});

if (created.length) {
  console.log("生成 meta 文件：");
  created.forEach(c => console.log("  " + c));
} else {
  console.log("没有发现需要新建的图片 meta 文件。");
}
