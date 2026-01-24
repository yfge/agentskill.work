import "./globals.css";

export const metadata = {
  metadataBase: new URL("https://agentskill.work"),
  title: "AgentSkill Hub",
  description:
    "Discover trending Claude Skill projects on GitHub with search and real-time updates.",
  alternates: {
    canonical: "https://agentskill.work",
    languages: {
      "zh-CN": "https://agentskill.work/?lang=zh",
      "en-US": "https://agentskill.work/?lang=en",
    },
  },
  openGraph: {
    title: "AgentSkill Hub",
    description:
      "Discover trending Claude Skill projects on GitHub with search and real-time updates.",
    url: "https://agentskill.work",
    siteName: "AgentSkill Hub",
    locale: "zh_CN",
    alternateLocale: ["en_US"],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "AgentSkill Hub",
    description:
      "Discover trending Claude Skill projects on GitHub with search and real-time updates.",
  },
  keywords: [
    "AgentSkill",
    "Claude Skill",
    "agentskill.work",
    "GitHub",
    "skills",
    "directory",
    "search",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
