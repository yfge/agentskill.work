import "./globals.css";

export const metadata = {
  metadataBase: new URL("https://agentskill.work"),
  title: "AgentSkill Hub",
  description:
    "Discover trending Claude Skill projects on GitHub with curated search and real-time updates.",
  applicationName: "AgentSkill Hub",
  category: "technology",
  creator: "AgentSkill Hub",
  publisher: "AgentSkill Hub",
  robots: {
    index: true,
    follow: true,
    "max-snippet": -1,
    "max-image-preview": "large",
    "max-video-preview": -1,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: "https://agentskill.work/zh",
    languages: {
      "zh-CN": "https://agentskill.work/zh",
      "en-US": "https://agentskill.work/en",
      "x-default": "https://agentskill.work/zh",
    },
  },
  openGraph: {
    title: "AgentSkill Hub",
    description:
      "Discover trending Claude Skill projects on GitHub with curated search and real-time updates.",
    url: "https://agentskill.work/zh",
    siteName: "AgentSkill Hub",
    locale: "zh_CN",
    alternateLocale: ["en_US"],
    images: [{ url: "/opengraph-image" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AgentSkill Hub",
    description:
      "Discover trending Claude Skill projects on GitHub with curated search and real-time updates.",
    images: ["/opengraph-image"],
  },
  keywords: [
    "AgentSkill",
    "Claude Skill",
    "Claude Skill 项目",
    "Claude Skill 列表",
    "agentskill.work",
    "GitHub",
    "GitHub Claude Skill",
    "skills",
    "directory",
    "search",
    "AI agent",
    "AI tool directory",
    "AI skill",
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        {children}
        <script
          defer
          src="https://umami.agentskill.work/script.js"
          data-website-id="6b5e7d60-f8b8-4e27-a664-9059b9a3565a"
        ></script>
      </body>
    </html>
  );
}
