# 配图规范（Image & Illustration Guidelines）

目的
- 统一文章配图的命名、尺寸、元数据、版权与可访问性要求，降低上线风险并提升展示一致性与检索性。
- 适用于所有文章的封面、缩略图、正文插图、图表与作者/版权图片。

适用范围
- 所有发布渠道（网站、微信公众号、APP）相关的图片素材及其元数据管理流程。
- 不包含视频/音频的详细规范（另行制定）。

一、命名与存放（必须遵守）
- 存放目录建议： `images/<article-slug>/`（每篇文章单独目录），或统一 `images/`（按团队约定）。
- 文件命名约定（必需）： `<article-slug>_<role>_<idx>.<ext>`
  - role 示例：cover, thumb, fig, diagram, author, chart
  - 示例：sleep-tips_cover.webp、sleep-tips_fig1.webp、sleep-tips_author.jpg
- 不允许空格或大写字母；使用小写字母、连字符或下划线；避免特殊字符。

二、文件格式与质量
- 优���格式：WebP（有损/无损视素材），次选 JPEG（照片类），PNG 仅用于透明或矢量图/图表。
- 尺寸建议：
  - 封面（hero/feature）：宽度 1200–2000 px（根据页面设计），高度按比例裁切。
  - 正文插图（inline）：宽度 700–1200 px。
  - 缩略图（thumb）：宽度 400–800 px。
  - 作者头像：正方形，建议 400x400 px。
- 文件大小指导：
  - 封面 ≤ 300 KB（尽量），正文图 ≤ 200 KB，缩略图 ≤ 100 KB（可根据品质灵活）。
- 压缩与优化：
  - 使用工具：sharp、imagemin、cwebp（CI 中自动化压缩），保留合理质量（照片质量 70–85%）。
  - 保留色彩准确性与可读性，避免过度压缩造成文字模糊。

三、图片元数据（每张图必须有同名 meta 文件）
- 位置：与图片同目录，命名为 `<filename> .meta.yml`（例如 `sleep-tips_cover.webp.meta.yml`）。
- 必填字段（meta 模板）：
```yaml
filename: ""            # e.g., sleeping_tips_cover.webp
title: ""               # 短标题，供 ALT 或图注自动生成
alt: ""                 # 必填：图片替代文本（accessibility）
photographer: ""        # 摄影/绘图者（internal 表示公司素材）
source: ""              # 素材来源（URL / 采购单号 / 作者）
license: ""             # 许可类型（e.g., CC-BY-4.0 / Licensed / Purchased）
purchase_id: ""         # 若为购买素材，写入采购单号或授权凭证 id
usage_rights_until: ""  # YYYY-MM-DD（若有时限）
caption: ""             # 可选：短说明或图注（显示在文章下方）
notes: ""               # 额外说明（如裁剪要求/作者备注）
```
- meta 文件必须被 CI 检查并且 `alt`、`source` / `license` 至少填写一项非空。

四、可访问性（必须）
- 所有正文图片必须有 `alt` 文本，含义明确、简洁（50 字以内），避免写“图片”或“图1”作为 alt。
- 对于信息性图表，alt 应包括图表要点与数据来源；并提供图表数据文件或表格（可作为附件）。
- 图片上若含有文字（截图/海报），在 meta 的 `alt` 中重复该文字摘要，并在 caption 中写出完整文本（以便屏幕阅读器和 SEO）。
- 文本覆盖图片时，确保对比度满足 WCAG 2.1（正文文字与背景对比度 ≥ 4.5:1；大标题 ≥ 3:1）。可用 contrast-check 脚本进行验证。

五、版权与合规（严格执行）
- 非原创图片必须附带授权凭证（采购单、授权邮件、协议），并在 meta 的 `purchase_id` 或 `source` ���段标注凭证信息。  
- 作者原创图片需在 meta 中声明 `photographer: <author-name>` 并注明授权范围（如“作者原创，授权用于本平台长期使用”）。
- 若图片来源于 CC 或可复用授权，请在 `license` 中注明并保留原始来源链接。
- 若素材存在使用时限，meta 中务必填写 `usage_rights_until`，CI 在到期前会发出警告。

六、图注与引用（编辑责任）
- 所有图表/速查表须有 caption（含数据来源、说明）。Caption 可简短但需包含“来源：xxx”。
- 若图片来自第三方报道或论文，请在 caption 或注释中写清出处并链回原文（可选 DOI）。

七、响应式与多分辨率（前端协同）
- 对于关键展示图片（封面/hero），建议提供多分辨率版本或使用 srcset：`<img src="cover-800.webp" srcset="cover-1200.webp 1200w, cover-800.webp 800w" sizes="(min-width: 800px) 1200px, 800px">`
- 前端可基于 DPR 进一步提供 2x、3x 版本（如 retina），但源文件应先保证清晰度与小体积折衷。

八、替换与回滚策略
- 如因版权问题需下线图片：在 PR 中提交替换图片并保留原 meta 文件（在 meta notes 中注明下线原因与时间），并在文章末尾注释说明变更与声明。
- CI 检测到 license/usage 到期或 meta 缺失时，应阻断发布并发出通知。

九、CI 与自动化建议（具体实现）
- 必要 CI 检查（在 PR 阶段）：
  - 所有 images/* 下图片都存在对应 `.meta.yml` 文件；`alt` 不为空。
  - 检查 meta 中 `license` 或 `source` 至少一项非空；若 `license` 为“Purchased”则 `purchase_id` 必填。
  - 图片文件名命名规范检查（正则校验）。
  - 图片尺寸/体积阈值检测（可用 sharp），不合格给出警告或阻断（按照规则）。
  - contrast-check（对有文字覆盖或图像设计样式）— 如适用。
- 自动生成：当 PR 中新增图片且缺少 meta，CI 可自动生成 meta 模板文件供提交者补全（image-meta-gen.js 已实现类似逻辑）。

十、编辑流程与责任分配（建议）
- 作者：提供原始图片与最低信息（摄影/来源/授权凭证）；填写 meta 模板。
- 运营/编辑：校验图片质量、alt、caption；确保版权凭证上传至附件库并填写 `purchase_id`。
- 技术（CI/前端）：提供压缩脚本、对接 contrast-check、在 PR 中显示检查结果与 artifact。

十一、示例（一则封面图片的 meta）  
```yaml
filename: sleep-tips_cover.webp
title: 失眠居家改善方法封面
alt: 年轻女性夜间难以入睡，坐在床边深呼吸示意图
photographer: internal
source: "internal/assets/2026-06-01-shoot"
license: "Internal"
purchase_id: ""
usage_rights_until: ""
caption: "失眠非小事：5 个实用的居家改善方法。图片为示意。"
notes: "裁剪为 1600x900，主视觉靠左留白用于标题叠加"
```

十二、常见问题与判例
- 若作者上传了截图含第三方版权，请务必上传授权或改用自制/免费素材。  
- 不要把完整论文截图作为正文图片；优先截取必要图表并注明来源与许可。  
- 对医学/操作性图片（如操作步骤、医疗演示），在 meta 中注明适用人群限制和免责声明。

十三、检查清单（发布前快速核对）
- [ ] 图片存在对应 `.meta.yml` 并填写 `alt`、`source`/`license`。  
- [ ] 文件名符合命名规范（slug_role_idx.ext）。
- [ ] 尺寸与体积在允许范围内，视觉质量良好。
- [ ] 图表/数据有 caption 与来源。
- [ ] 医学/人体图像含免责声明与适用人群说明。
- [ ] 授权文件已上传附件库且 `purchase_id` 已填写（如适用）。

结束语
- 请按本规范将图片与 meta 一并提交到 PR。遇到边界场景（例如“二次引用”“老图难以追溯授权”）请先联系法务/版权负责人处理。  
- 若你愿意，我可以：
  - 把该文件加入仓库并为你发起 PR；或  
  - 把 meta 校验脚本增强为 stricter 模式并在 CI 中启用（我会给出 patch）。
