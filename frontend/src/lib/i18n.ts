export const messages = {
  zh: {
    title: "AgentSkill Hub",
    subtitle: "自动汇总 GitHub 上热门 Claude Skill 项目，集中展示与搜索。",
    searchPlaceholder: "按名称、仓库、描述搜索...",
    search: "搜索",
    loading: "加载中...",
    empty: "暂无结果",
    error: "加载失败",
    loadMore: "加载更多",
    countLabel: "显示",
    backToList: "返回列表",
    viewOnGitHub: "前往 GitHub",
    pvLabel: "PV",
    uvLabel: "UV",
    languageLabel: "语言",
    english: "English",
    chinese: "中文",
    detailOverview: "概览",
    detailRepoInfo: "仓库信息",
    detailSummary: "项目简介",
    detailOriginal: "英文描述",
    detailTranslated: "中文说明",
    detailStars: "Stars",
    detailForks: "Forks",
    detailLanguage: "语言",
    detailLastPushed: "最后更新",
    detailLastSynced: "最近同步",
    detailRepoId: "Repo ID",
    detailOwner: "拥有者",
    detailRepo: "仓库",
    detailFullName: "完整名称",
    detailGitHub: "GitHub 地址",
    detailTopics: "话题",
    detailNoTopics: "暂无话题",
    detailNoDescription: "暂无描述",
    detailSource: "数据来自 GitHub，同步时间：",
    detailUnknown: "未知"
  },
  en: {
    title: "AgentSkill Hub",
    subtitle: "Discover trending Claude Skill projects on GitHub, curated and searchable.",
    searchPlaceholder: "Search by name, repo, description...",
    search: "Search",
    loading: "Loading...",
    empty: "No skills found yet.",
    error: "Failed to load",
    loadMore: "Load more",
    countLabel: "Showing",
    backToList: "Back to list",
    viewOnGitHub: "View on GitHub",
    pvLabel: "PV",
    uvLabel: "UV",
    languageLabel: "Language",
    english: "English",
    chinese: "中文",
    detailOverview: "Overview",
    detailRepoInfo: "Repository",
    detailSummary: "Summary",
    detailOriginal: "Original description",
    detailTranslated: "Chinese description",
    detailStars: "Stars",
    detailForks: "Forks",
    detailLanguage: "Language",
    detailLastPushed: "Last pushed",
    detailLastSynced: "Last synced",
    detailRepoId: "Repo ID",
    detailOwner: "Owner",
    detailRepo: "Repository",
    detailFullName: "Full name",
    detailGitHub: "GitHub URL",
    detailTopics: "Topics",
    detailNoTopics: "No topics yet.",
    detailNoDescription: "No description yet.",
    detailSource: "Data from GitHub. Synced on ",
    detailUnknown: "Unknown"
  }
} as const;

export type Language = keyof typeof messages;

export const defaultLanguage: Language = "zh";

export function normalizeLanguage(value: string): Language {
  if (value.startsWith("en")) {
    return "en";
  }
  return "zh";
}

export function getStoredLanguage(): Language | null {
  if (typeof window === "undefined") {
    return null;
  }
  const stored = window.localStorage.getItem("agentskill_lang");
  if (!stored) {
    return null;
  }
  if (stored === "en" || stored === "zh") {
    return stored;
  }
  return null;
}

export function setStoredLanguage(lang: Language) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem("agentskill_lang", lang);
}
