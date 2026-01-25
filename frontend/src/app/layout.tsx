import "./globals.css";

export const metadata = {
  metadataBase: new URL("https://agentskill.work"),
  title: "agentskill.work",
  description:
    "agentskill.work is a curated directory of trending Claude Skill projects on GitHub.",
  applicationName: "agentskill.work",
  category: "technology",
  creator: "agentskill.work",
  publisher: "agentskill.work",
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
    title: "agentskill.work",
    description:
      "agentskill.work is a curated directory of trending Claude Skill projects on GitHub.",
    url: "https://agentskill.work/zh",
    siteName: "agentskill.work",
    locale: "zh_CN",
    alternateLocale: ["en_US"],
    images: [{ url: "/opengraph-image" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "agentskill.work",
    description:
      "agentskill.work is a curated directory of trending Claude Skill projects on GitHub.",
    images: ["/opengraph-image"],
  },
  keywords: [
    "agentskill.work",
    "Claude Skill",
    "Claude Skill 项目",
    "Claude Skill 列表",
    "AgentSkill",
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
  const googleSiteVerification = process.env.GOOGLE_SITE_VERIFICATION;
  const bingSiteVerification = process.env.BING_SITE_VERIFICATION;

  return (
    <html lang="zh-CN">
      <head>
        {googleSiteVerification ? (
          <meta name="google-site-verification" content={googleSiteVerification} />
        ) : null}
        {bingSiteVerification ? (
          <meta name="msvalidate.01" content={bingSiteVerification} />
        ) : null}
      </head>
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
