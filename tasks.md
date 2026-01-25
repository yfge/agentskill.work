# Tasks (SEO + GEO)

> Last updated: 2026-01-25

目标：把 agentskill.work 做成“可持续增长”的流量站，重点提升收录质量、长尾覆盖、分享转化（微信/社交卡片）和 LLM 可理解性。

## 约束 / 重要原则

- GitHub API 调用只允许在“定时任务”（Celery）里进行：前端分页/搜索只打自家 API，不准让用户端触发 GitHub API（避免把 GitHub 拉爆）。
- 术语约束：`Claude Skill` 保持原文，不要翻译成“claude 技能”。
- SEO 目标：每个可索引页面必须有稳定的 canonical、可读的 title/description、可用的 OG/Twitter 卡片、合理的结构化数据。
- GEO 目标：提供清晰、可引用、可机读的站点说明与 API 语义（llms.txt/llms-full.txt/openapi）。

## 已完成（基线能力，已上线）

- [x] 全站基础 SEO：`robots.txt`、`sitemap.xml`、canonical + hreflang（当前基于 `/zh` / `/en`）
- [x] 首页/详情页结构化数据：WebSite/FAQ/ItemList + SoftwareSourceCode/BreadcrumbList
- [x] 全站 OG/Twitter 基础卡片：`/opengraph-image`（默认分享图）
- [x] 微信校验文件：`/e5e588a3b46a049f7e2354fa3ba02fde.txt`（可公网访问）
- [x] GEO 基础文件：`/llms.txt`（已补充 usage/attribution）
- [x] Analytics：Umami script 已全站注入

## 待办（SEO / GEO 优化 Backlog）

### 1) URL 级多语言（/en /zh）与去重策略

- [x] 将 `?lang=en|zh` 升级为路径型多语言（`/en/...`、`/zh/...`）
  - 现状：语言通过 query 传参；虽然有 hreflang，但 URL 不够“干净”，对收录与分享一致性不友好。
  - 方案建议（Next.js App Router）：
    - 新增 `frontend/src/app/[lang]/...` 路由结构（lang 仅允许 `en`/`zh`）
    - `/` 308 到默认语言（例如 `/zh`），或保留 `/` 作为默认语言静态页
    - 旧链接兼容：`/?lang=en`、`/skills/x/y?lang=en` 统一重定向到 `/en/...`
  - Canonical/hreflang 规则（必须明确）：
    - 每个语言页面 canonical 指向自己（/en 指向 /en，/zh 指向 /zh）
    - 必须输出 `hreflang`：`zh-CN`、`en-US`、`x-default`
  - 验收标准：
    - 旧链接访问会被 301/308 到新链接（避免重复收录）
    - 两种语言页面均可被 sitemap 收录（或至少收录 canonical 页并通过 hreflang 互链）

### 2) 详情页分享卡片（OG image）按项目动态生成

- [x] 为每个 repo 生成动态 OG 图（微信/社交传播更强）
  - 目标：分享出去的卡片包含：`owner/repo`、stars、forks、language、top topics（以及“Claude Skill”标识）
  - 实现建议：
    - 增加 route：`frontend/src/app/[lang]/skills/[owner]/[repo]/opengraph-image.tsx`
    - OG 图生成时从自家 API 拉取 skill（绝不直连 GitHub）
    - metadata 的 openGraph.images 改为该动态图片的绝对 URL（包含 `metadataBase`）
  - 注意：
    - Edge runtime 下取数要稳定（必要时走公网 `https://agentskill.work/api`）
    - 失败兜底：拉不到 skill 时 fallback 到全站默认 `/opengraph-image`
  - 验收标准：
    - 分享任意详情页时，社交预览图能正确显示 repo 信息（至少 title 正确，图片不 404）

### 3) Sitemap 扩展（sitemap-index + 分片）与 lastmod

- [ ] 将单一 `sitemap.xml` 升级为 sitemap index（站点规模化必备）
  - 现状：单文件且有 `MAX_SITEMAP_ITEMS=500` 上限，未来会限制收录增长。
  - 目标：
    - 提供 `sitemap-index.xml`，按分页输出 `sitemap-skills-{n}.xml`
    - 每个 url 写 `lastmod`（优先 `last_pushed_at`，fallback `fetched_at`）
    - robots.txt 指向 sitemap index
  - 实现建议：
    - 使用 Next Route Handlers 输出 XML（避免 Next 单 sitemap 限制）
    - 生成时仅调用自家 API（分页获取 skills）
    - 加缓存（revalidate/Cache-Control），避免每次爬虫请求都打爆 API/DB
  - 验收标准：
    - `https://agentskill.work/sitemap-index.xml` 存在且可被 robots 引用
    - 任意 `sitemap-skills-*.xml` 返回 200 且包含有效 URL 集

### 4) 长尾入口页：Topic / Language / Owner 聚合页

- [ ] 新增可索引聚合页（提高长尾覆盖 + 内链结构）
  - 页面：
    - `/topics/{topic}`
    - `/languages/{lang}`
    - `/owners/{owner}`
  - 页面内容（必须“够厚”）：
    - 顶部 intro（解释该聚合页的含义，保持“Claude Skill”术语）
    - 可分页列表（仅打自家 API）
    - 结构化数据 ItemList + BreadcrumbList
    - OG/Twitter + canonical/hreflang
  - 后端支持（可能需要 DB/迁移）：
    - topics 如果现在是逗号字符串，建议迁移为 JSON 数组字段（查询更稳、更快）
    - 新增筛选 API：`GET /skills?topic=...&language=...&owner=...`
  - 验收标准：
    - 聚合页被 sitemap 收录（或从首页/详情页内链可达且可索引）
    - 聚合页翻页只走 DB，不走 GitHub API

### 5) 内容增厚（离线生成）：LLM 友好摘要 / 要点 / 使用场景

- [ ] 在“定时任务”里离线生成内容块，提升详情页信息密度，减少 thin-content
  - 目标内容（建议存 DB）：
    - `summary_en` / `summary_zh`（1-2 段）
    - `key_features`（3-6 条 bullet）
    - `use_cases`（3-6 条 bullet）
    - 可选：`seo_title` / `seo_description`（避免所有页 title/description 太像）
  - 实现要点：
    - 严格禁止在用户请求链路里调用 LLM（避免延迟/成本/不稳定）
    - DeepSeek prompt 里强制保留 “Claude Skill” 原词
    - 为 LLM 任务加 rate limit / 重试 / 失败兜底（不影响主同步）
  - 验收标准：
    - 有内容的详情页明显更“厚”，并能在 HTML 中直接看到（爬虫可读）

### 6) 结构化数据增强（提高富摘要概率）

- [ ] 在现有 JSON-LD 基础上补强
  - 详情页（SoftwareSourceCode）：
    - 增加 `interactionStatistic`（stars/forks）
    - 增加 `mainEntityOfPage` 指向 canonical
  - 聚合页（ItemList）：
    - 增加 `numberOfItems`、分页语义（如可用）
  - 验收标准：
    - 页面 JSON-LD 可通过常见验证器解析（无明显 schema 错误）

### 7) 站长平台接入（GSC/Bing）与验证

- [ ] 增加可配置的站长验证（文件 or meta）并写入运维文档
  - 支持：
    - Google Search Console（`google-site-verification`）
    - Bing Webmaster
  - 验收标准：
    - 通过配置即可完成验证（无需改代码/重新构建，或至少流程明确）

### 8) 性能与缓存（TTFB/LCP）优化

- [ ] 调整 Next fetch 缓存策略，降低 `no-store` 覆盖面
  - 目标：
    - 首页列表、详情页采用 `revalidate`（例如 5-10 分钟）
    - sitemap/robots 输出可缓存（例如 1 小时）
  - 注意：
    - 仍需保证“更新及时”：数据同步后不要长时间缓存旧页
    - 避免缓存导致 PV/UV 埋点失效（埋点是 POST，不受缓存影响）
  - 验收标准：
    - 线上可观察到 TTFB 下降（或至少不比现在差）

### 9) GEO：补充 llms-full.txt（更完整机器可读说明）

- [ ] 新增 `/llms-full.txt`
  - 建议包含：
    - 数据结构完整 schema（字段解释、类型、取值范围）
    - API 分页/排序语义（limit/offset、默认排序）
    - 示例请求/响应 JSON（列表 + 详情）
    - 术语与翻译约束（Claude Skill 不翻译）
    - 许可/归因与抓取建议（延续 llms.txt）
  - 验收标准：
    - 文件可访问、内容稳定、对 LLM/agent 足够明确

### 10) 对外 API 可读性：OpenAPI 链接与最小开发者文档

- [ ] 在文档与 GEO 文件中明确 OpenAPI 入口与常用端点语义
  - 现状：FastAPI OpenAPI 已可访问（`/api/openapi.json`）
  - 目标：
    - 在 README / docs/operations.md / llms-full.txt 明确写出 API base、鉴权策略（如有）、分页与限速建议
  - 验收标准：
    - 外部开发者/agent 只看文档即可正确调用（不猜测参数）
