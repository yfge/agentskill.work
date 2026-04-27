# Google Search Console 索引问题修复指南

## 2026-04-27 恢复执行记录

### 已完成

- 修复已下架/找不到的 skill 详情页：不再返回 404，改为 `308` 到对应语言首页搜索结果页。
  - commit: `49d9989 fix: redirect missing skill pages to search`
- 修复 GitHub 仓库改名/迁移导致的旧详情页失效：旧 `owner/repo` URL 会先解析 GitHub redirect，再 `308` 到新的 canonical skill 详情页。
  - commit: `826d239 fix: resolve renamed skill repositories`
- 扩大 GitHub sync 覆盖面：线上 skill 数从 `438` 增加到 `916`。
- Sitemap 扩容：`sitemap.xml` 当前包含 `12` 个 sitemap，合计 `2,192` 个 URL；线上批量回测全部 `200`。
- GSC 站点地图页面确认：`https://agentskill.work/sitemap.xml` 状态为“成功”，上次读取 `2026年4月27日`，已发现网页 `1,218`。
- GSC 验证已启动：`未找到 (404)`、`软 404`、`已抓取 - 尚未编入索引`、`网页会自动重定向`、`备用网页（有适当的规范标记）` 等可处理项均已开始验证。

### 已验证的旧 URL 跳转

```text
https://agentskill.work/en/skills/EverMind-AI/EverMemOS
  -> 308 /en/skills/EverMind-AI/EverOS -> 200
https://agentskill.work/en/skills/sseanliu/VisionClaw
  -> 308 /en/skills/Intent-Lab/VisionClaw -> 200
https://agentskill.work/en/skills/win4r/memory-lancedb-pro
  -> 308 /en/skills/CortexReach/memory-lancedb-pro -> 200
https://agentskill.work/en/skills/zhayujie/chatgpt-on-wechat
  -> 308 /en/skills/zhayujie/CowAgent -> 200
https://agentskill.work/zh/skills/higress-group/hiclaw
  -> 308 /zh/skills/agentscope-ai/HiClaw -> 200
https://agentskill.work/en/skills/justlovemaki/OpenClaw-Docker-CN-IM
  -> 308 /en/skills/justlovemaki/openclaw-china-docker -> 200
```

### 3/15 前后 Performance 对比

已通过 GSC 页面拉取两段数据：

| 时间段 | 点击 | 曝光 | CTR | 平均排名 |
| --- | ---: | ---: | ---: | ---: |
| 2026-03-01 ~ 2026-03-15 | 461 | 约数万（图表峰值 4,500/日） | — | — |
| 2026-03-16 ~ 2026-04-23 | 16 | 2,052 | 0.8% | 7.6 |

结论：下滑不是单页 404 导致的小问题，而是多个已获得点击的页面/查询在 3/15 后集体失速。

#### 3/1~3/15 Top queries

```text
memory-lancedb-pro                         13 clicks / 1,182 impressions
tenacitos github                           12 / 198
tenacitos openclaw                          7 / 258
openclaw zero token                         7 / 61
openclaw live2d                             4 / 21
tenacitos                                   3 / 111
aaron-he-zhu/seo-geo-claude-skills          3 / 28
nanobot skill                               3 / 27
visual explainer claude skill               3 / 17
memory lancedb pro                          2 / 246
```

#### 3/16~4/23 Top queries

```text
memory-lancedb-pro                          1 / 36
openviking claude code                      1 / 3
claude code wordpress skill                 1 / 1
visual explainer skill claude               1 / 1
aionui                                      1 / 1
blader humanizer claude                     0 / 134
carlosazaustre/tenacitos github             0 / 14
tenacitos github                            0 / 11
lossless claw                               0 / 10
carlosazaustre tenacitos github             0 / 9
```

#### 3/1~3/15 Top pages and current status

```text
/en/skills/win4r/memory-lancedb-pro                 40 clicks / 9,058 impressions -> 308 /en/skills/CortexReach/memory-lancedb-pro -> 200
/en/skills/carlosazaustre/tenacitOS                 38 / 2,320 -> 200
/zh/skills/linuxhsj/openclaw-zero-token             14 / 214 -> 200
/en/skills/abhi1693/openclaw-mission-control        13 / 1,803 -> 200
/en/skills/vuejs-ai/skills                           9 / 146 -> 200
/en/skills/crshdn/mission-control                    8 / 628 -> 200
/zh/skills/rookiestar28/ComfyUI-OpenClaw             8 / 83 -> 200
/en/skills/nicobailon/visual-explainer               7 / 174 -> 200
/zh/skills/AlexsJones/llmfit                         7 / 136 -> 200
/zh/skills/bubbuild/bub                              7 / 27 -> 200
```

#### 3/16~4/23 Top pages

```text
/en/skills/volcengine/OpenViking                     2 / 29
/en/skills/FreedomIntelligence/OpenClaw-Medical-Skills 1 / 50
/en/skills/BlockRunAI/ClawRouter                     1 / 17
/zh/skills/win4r/memory-lancedb-pro                  1 / 12
/en/skills/trailofbits/skills                        1 / 9
/en                                                   1 / 8
/en/skills/rookiestar28/ComfyUI-OpenClaw              1 / 6
/en/skills/nicobailon/visual-explainer                1 / 5
/zh/skills/quoroom-ai/room                            1 / 4
/zh/skills/bubbuild/bub                               1 / 4
```

### 下一步

1. 优先在 GSC URL Inspection 对上述 3/1~3/15 Top pages 请求重新编入索引，尤其是：
   - `/en/skills/CortexReach/memory-lancedb-pro`
   - `/en/skills/carlosazaustre/tenacitOS`
   - `/zh/skills/linuxhsj/openclaw-zero-token`
   - `/en/skills/abhi1693/openclaw-mission-control`
   - `/en/skills/crshdn/mission-control`
2. 针对高点击查询补强页面内容和内链：`memory-lancedb-pro`、`tenacitos`、`openclaw zero token`、`openclaw mission control`。
3. 为被 308 的旧 GitHub URL 保持长期 redirect；不要短期移除。
4. 继续观察 GSC 验证结果，重点看 `未找到 (404)`、`软 404` 和 `已抓取 - 尚未编入索引` 是否在 1~2 周内下降。

## 当前状态

所有技术配置都正确：
- ✅ 页面无 noindex 标签
- ✅ robots.txt 正确配置
- ✅ Sitemap 包含所有语言/主题/作者页面
- ✅ 页面正常可访问

## 需要在 Google Search Console 中执行的操作

### 1. 重新提交 Sitemap

进入 Google Search Console：
1. 选择 agentskill.work 资源
2. 点击左侧菜单 "索引" → "站点地图"
3. 确认以下 sitemap 已提交：
   - `https://agentskill.work/sitemap-index.xml`（主 sitemap）
   - `https://agentskill.work/sitemap-facets.xml`（facet 页面，包含语言/主题/作者）

4. 如果未提交，添加这些 URL 并点击"提交"

### 2. 请求重新抓取示例 URL

对以下几个代表性的 URL 请求重新抓取：

```
https://agentskill.work/en/languages/Python
https://agentskill.work/en/languages/TypeScript
https://agentskill.work/en/languages/Astro
https://agentskill.work/zh/languages/Python
https://agentskill.work/en/topics/claude
https://agentskill.work/en/owners/anthropics
```

操作步骤：
1. 在 Google Search Console 顶部的搜索框中输入完整 URL
2. 点击 "请求编入索引"
3. 等待 Google 重新抓取（可能需要几天时间）

### 3. 批量验证修复

1. 进入 "索引" → "网页"
2. 找到 "已发现 - 尚未编入索引" 分类
3. 点击该分类查看详情
4. 点击右上角的 "验证修复" 按钮
5. Google 会开始重新抓取这些页面

### 4. 监控索引状态

- 预计 1-2 周内，Google 会重新抓取并索引这些页面
- 定期检查 "索引" → "网页" 中的统计数据
- 已索引页面数量应该逐渐增加到 ~900 页（当前约 230 页）

## 预期结果

完成上述操作后：
- 语言页面（~150 个）应该被索引
- 主题页面（~100 个）应该被索引
- 作者页面（~50 个）应该被索引
- 技能详情页面（~200 个）应该被索引

总计约 700-900 个页面应该被 Google 索引。

## 注意事项

1. **不要删除 noindex 逻辑**：当前代码对带 `?q=` 参数的搜索结果页面添加 noindex 是正确的做法
2. **保持 sitemap 动态更新**：当前 sitemap 配置为每小时重新验证，这是合理的
3. **耐心等待**：Google 重新索引可能需要 1-4 周时间

## 技术说明

### 为什么会出现这个问题？

可能的原因：
1. 网站最近上线，Google 还在逐步发现和索引页面
2. Google 初次抓取时可能遇到临时问题
3. Sitemap 提交时机问题

### 当前的 SEO 配置

所有 facet 页面都包含：
- 完整的 meta 标签（title, description）
- Open Graph 标签
- Twitter Card 标签
- 结构化数据（Schema.org）
- 规范链接（canonical）
- 多语言替代链接（hreflang）

配置都是最佳实践，不需要修改。
