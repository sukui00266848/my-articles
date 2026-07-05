# 图片与多媒体管理规范（Image & Media SOP）

目的
- 统一图片命名、元数据与版权流转；保证上线素材合规且便于追踪。适用于封面图、正文图、插图、图表、作者提供图片。

一、命名与存放（必须）
- 存放路径：`/images/<article-slug>/` 或 `images/`（项目按团队习惯）
- 文件命名约定（必需）：`<article-slug>_<role>.<ext>`
  - role 示例：cover, thumb, fig1, fig2, author, diagram
  - 示例：sleeping_tips_cover.webp；sleeping_tips_fig1.webp
- 不允许在文件名中包含空格或特殊字符；使用连字符或下划线。

二、meta 文件（每张图必须有同名 .meta.yml）
- 放置位置：与图片同目录，文件名为 `xxx.webp.meta.yml`（或 `.jpg.meta.yml`）
- 模板（image.meta.yml.template，必须生成并补全）：

```yaml
# image.meta.yml.template
filename: sleeping_tips_cover.webp
title: ""            # 简短描述（供 ALT 使用）
alt: ""              # 必填：图片替代文本
photographer: ""     # 摄影/绘图者（若公司素材请写 internal）
source: ""           # 素材来源（URL 或采购单号）
license: ""          # 许可类型（e.g., CC-BY-4.0 / Licensed / Purchased）
purchase_id: ""      # 若为购买素材，写入采购单号或授权凭证id
usage_rights_until: "" # YYYY-MM-DD（若有时限）
notes: ""            # 额外说明（如裁剪要求/作者备注）
```

三、格式与压缩建议
- 优先使用 WebP（质优体积小）；次选 JPEG（质量 75–85%），PNG 仅用于透明或图表。
- 封面尺寸建议：1200–2000 px 宽（按展示终端），正文图 700–1100 px 宽。
- 文件大小控制：封面尽量 < 300 KB，正文图 < 200 KB（视内容略微放宽）。
- 对于复杂背景（需要纸纹/书法），

出于兼容性建议预合成一张背景图并使用 WebP。

四、图片用途与可读性
- 所有正文图片必须带 alt（取自 meta.yml 的 title/alt 字段）。
- 图表/速查表须有 caption（来源 + 简短说明）。
- 若图片包含医疗操作演示或人体图像，

必须标注适用人群限制与免责声明。

五、版权与证据保全（必须）
- 所有非原创图片必须附带授权凭证（采购单/授权邮件/购买记录），

并在 meta.yml 的 source 或 purchase_id 字段标注。
- 若为作者原创，填写 photographer: <author-name> 并在 notes 中说明"作者原创，授权无期限"。
- CMS 上传/审核时必须上传授权文件到附件库并在稿件内填写授权凭证 ID（CI 可校验该字段是否为空）。

六、替换与回滚策略
- 若图片因版权问题需下线：运营在 PR 中添加替换图片并保留原 meta 文件（注明下线原因），并在文章末尾注释说明变更。
- 对外要在 24 小时内发布更正或说明。

七、最小自动化建议（可以立刻实现）
- 使用 image-meta-gen.js 在 PR 时自动生成缺失的 .meta.yml 模板文件；CI 检查 meta.yml 是否已补全（必填字段 non-empty）。
- 在构建时检测图片尺寸与文件大小，

不合格给出错误或警告（可用 sharp 脚本）。
