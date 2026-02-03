# Google Search Console 索引问题修复指南

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
