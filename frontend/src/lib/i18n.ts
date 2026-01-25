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
    homeLabel: "首页",
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
    detailExplore: "探索更多",
    detailNoTopics: "暂无话题",
    detailNoDescription: "暂无描述",
    detailSource: "数据来自 GitHub，同步时间：",
    detailUnknown: "未知",
    infoTitle: "为什么选择 AgentSkill Hub",
    infoSubtitle: "把热门 Claude Skill 项目集中成可搜索的清单。",
    infoCards: [
      {
        title: "自动抓取与更新",
        body: "定时同步 GitHub 热门 Claude Skill 项目，更新 Stars、Forks、语言和话题。",
      },
      {
        title: "搜索与详情页",
        body: "支持按名称、仓库、描述检索，详情页展示仓库元信息与更新时间。",
      },
      {
        title: "中英文访问",
        body: "提供中文与英文界面，Claude Skill 保持原文表述。",
      },
      {
        title: "透明数据来源",
        body: "数据来自 GitHub Search API，可一键跳转至原仓库。",
      },
    ],
    faqTitle: "常见问题",
    faqItems: [
      {
        question: "Claude Skill 是什么？",
        answer:
          "社区在 GitHub 上发布的 Claude Skill 项目（原文 Claude Skill），用于扩展或示例化 Claude 的能力。",
      },
      {
        question: "数据多久更新一次？",
        answer: "系统按定时任务自动同步，默认每小时更新一次。",
      },
      {
        question: "如何让项目出现在列表中？",
        answer: "仓库名称、描述或话题包含 “Claude Skill” 会被自动收录与更新。",
      },
      {
        question: "是否提供直达 GitHub？",
        answer: "每个项目详情页都包含 GitHub 地址，可直接访问源仓库。",
      },
    ],
  },
  en: {
    title: "AgentSkill Hub",
    subtitle:
      "Discover trending Claude Skill projects on GitHub, curated and searchable.",
    searchPlaceholder: "Search by name, repo, description...",
    search: "Search",
    loading: "Loading...",
    empty: "No skills found yet.",
    error: "Failed to load",
    loadMore: "Load more",
    countLabel: "Showing",
    homeLabel: "Home",
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
    detailExplore: "Explore more",
    detailNoTopics: "No topics yet.",
    detailNoDescription: "No description yet.",
    detailSource: "Data from GitHub. Synced on ",
    detailUnknown: "Unknown",
    infoTitle: "Why AgentSkill Hub",
    infoSubtitle: "A searchable index of trending Claude Skill projects.",
    infoCards: [
      {
        title: "Automated discovery",
        body: "Scheduled sync pulls trending Claude Skill repos and refreshes Stars, Forks, language, and topics.",
      },
      {
        title: "Search & detail pages",
        body: "Search by name, repo, or description. Detail pages show metadata and update times.",
      },
      {
        title: "Bilingual access",
        body: "Chinese and English UI with the term Claude Skill kept in its original wording.",
      },
      {
        title: "Transparent sources",
        body: "Data comes from the GitHub Search API with one-click access to each repo.",
      },
    ],
    faqTitle: "FAQ",
    faqItems: [
      {
        question: "What is a Claude Skill?",
        answer:
          "Claude Skill projects published on GitHub by the community (term kept as Claude Skill), showcasing or extending Claude capabilities.",
      },
      {
        question: "How often is the data updated?",
        answer: "Synced automatically on a schedule, typically every hour by default.",
      },
      {
        question: "How does a repo get listed?",
        answer:
          "Repos whose name, description, or topics include “Claude Skill” are automatically indexed and refreshed.",
      },
      {
        question: "Can I jump to GitHub?",
        answer: "Every detail page includes a direct link to the source repository.",
      },
    ],
  },
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
