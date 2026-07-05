# README — 公众号文章模板包

## 包含文件
- citation-guidelines.md
- media-guidelines.md
- article-template.md
- selection-confirmation.md
- publish-checklist.md
- image.meta.yml.template
- scripts/
  - sentence-checker.js
  - image-meta-gen.js
  - contrast-check.js
- package.json
- .github/workflows/content-checks.yml

## Usage
1. Unzip and inspect files.
2. Place markdown templates into your `docs/` or `.editor/` directory.
3. Put scripts into your repository and run `npm ci` then the scripts (or let CI run them).
4. Customize content directory path in scripts if needed.

## Dependencies (for scripts)
Run `npm ci` in the package root to install devDependencies.
