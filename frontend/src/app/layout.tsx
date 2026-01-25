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
