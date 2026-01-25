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
- [x] 默认语言：访问 `/`（或 legacy 旧路由无 lang/hl）时按浏览器 `Accept-Language` 自动选择 `/zh` 或 `/en`

## 待办（SEO / GEO 优化 Backlog）

### 1) URL 级多语言（/en /zh）与去重策略

- [x] 将 `?lang=en|zh` 升级为路径型多语言（`/en/...`、`/zh/...`）
  - 现状：语言通过 query 传参；虽然有 hreflang，但 URL 不够“干净”，对收录与分享一致性不友好。
  - 方案建议（Next.js App Router）：
    - 新增 `frontend/src/app/[lang]/...` 路由结构（lang 仅允许 `en`/`zh`）
    - `/` 308 到“默认语言”（按浏览器 `Accept-Language` 自动选择 `/zh` 或 `/en`）
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

- [x] 将单一 `sitemap.xml` 升级为 sitemap index（站点规模化必备）
  - 实现：
    - `https://agentskill.work/sitemap-index.xml`（sitemap index）
    - `https://agentskill.work/sitemap-pages.xml`（静态页面）
    - `https://agentskill.work/sitemap-skills/{n}.xml`（skills 分片，`n` 从 1 开始）
    - `https://agentskill.work/sitemap.xml` 308 重定向到 index
  - 目标：
    - 提供 `sitemap-index.xml`，按分页输出 `sitemap-skills-{n}.xml`
    - 每个 url 写 `lastmod`（优先 `last_pushed_at`，fallback `fetched_at`）
    - robots.txt 指向 sitemap index
  - 实现建议：
    - 使用 Next Route Handlers 输出 XML（避免 Next 单 sitemap 限制）
    - 生成时仅调用自家 API（分页获取 skills）
    - 加缓存（revalidate/Cache-Control），避免每次爬虫请求都打爆 API/DB
    - sitemap 分片的 page-size 需要与后端 `GET /api/skills` 的 max limit 对齐（当前 <= 100），否则会触发 422 并导致
      sitemap-skills 返回 502
    - 注意：`/sitemap-index.xml` 必须是运行时动态（例如 `export const dynamic = "force-dynamic"`），否则 Next 可能在 build
      阶段预渲染该路由并触发对自家 API 的 fetch，导致 Docker build 时超时失败
  - 验收标准：
    - `https://agentskill.work/sitemap-index.xml` 存在且可被 robots 引用
    - index 中列出的 `sitemap-skills-*.xml` 返回 200 且包含有效 URL 集

### 4) 长尾入口页：Topic / Language / Owner 聚合页

- [x] 新增可索引聚合页（提高长尾覆盖 + 内链结构）
  - [x] 4.1 后端支持：`GET /api/skills` 支持按 `topic` / `language` / `owner` 过滤（只查 DB，不触发 GitHub API）
    - `topic`：按 topics（逗号分隔）做整词匹配
    - `language`：大小写不敏感匹配
    - `owner`：匹配 `full_name` 的 `{owner}/...`
    - 说明：后端 list API 仍限制 `limit <= 100`，聚合页与 sitemap 分片要按该上限分页
  - [x] 4.2 前端页面：
    - `/{lang}/topics/{topic}`
    - `/{lang}/languages/{language}`
    - `/{lang}/owners/{owner}`
  - [x] 4.3 SEO 收录：
    - 新增 `https://agentskill.work/sitemap-facets.xml`（按热门 topic/language/owner 输出聚合页）
    - `sitemap-index.xml` 已包含 `sitemap-facets.xml`
    - 首页/详情页增加可爬取内链（详情页已将 topics/owner/language 变为内链）
  - 页面：
    - `/{lang}/topics/{topic}`
    - `/{lang}/languages/{language}`
    - `/{lang}/owners/{owner}`
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

- [x] 在“定时任务”里离线生成内容块，提升详情页信息密度，减少 thin-content
  - [x] 5.1 DB 字段 + 迁移
    - 新增字段（中英文分别存，避免混用导致 SEO 语义不清）：
      - `summary_en` / `summary_zh`（1-2 段，页面主摘要）
      - `key_features_en` / `key_features_zh`（3-6 条 bullet）
      - `use_cases_en` / `use_cases_zh`（3-6 条 bullet）
      - `seo_title_en` / `seo_title_zh`（<= 60 字符左右，避免标题同质化）
      - `seo_description_en` / `seo_description_zh`（<= 160 字符左右，避免描述同质化）
      - `content_updated_at`（内容生成时间，用于判定是否需要重新生成）
  - [x] 5.2 后端：离线生成任务（Celery）
    - 仅在定时任务里调用 DeepSeek（严禁在用户请求链路调用 LLM）
    - 选取策略：优先补齐 `content_updated_at is null` 的技能，其次 `last_pushed_at > content_updated_at`
    - 失败兜底：解析/校验失败或接口错误时只记录日志，不影响 GitHub 同步主任务
    - 限速/并发控制：
      - 单次任务最多处理 `ENRICH_BATCH_SIZE` 条
      - 任务互斥锁（Redis lock）避免 beat 重叠导致重复生成
      - Celery retry/backoff（上游抖动时自动重试）
  - [x] 5.3 前端：详情页内容增厚（HTML 可见，利于收录）
    - 优先展示 `summary_{lang}`，无则 fallback 到 `description_{lang}`
    - 展示 `key_features_{lang}`、`use_cases_{lang}`（缺失则隐藏该区块）
  - [x] 5.4 SEO：metadata 使用 `seo_title_{lang}` / `seo_description_{lang}`（存在时覆盖默认）
  - [x] 5.5 GEO：同步更新 `llms-full.txt`（补充新字段语义与示例）
  - [x] 5.6 运维：`.env.example` + `docs/operations.md` 补充开关与频率说明

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

- [x] 新增 `/llms-full.txt`
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
