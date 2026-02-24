import "./globals.css";

import { headers } from "next/headers";

import { SiteFooter } from "@/components/SiteFooter";
import { getSiteOrigin } from "@/lib/site";

export const metadata = {
  metadataBase: new URL(getSiteOrigin()),
  title: "agentskill.work",
  description:
    "agentskill.work is a curated directory of trending Claude Skill projects on GitHub.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
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
    languages: {
      "zh-CN": `${getSiteOrigin()}/zh`,
      "en-US": `${getSiteOrigin()}/en`,
      "x-default": `${getSiteOrigin()}/zh`,
    },
  },
  openGraph: {
    title: "agentskill.work",
    description:
      "agentskill.work is a curated directory of trending Claude Skill projects on GitHub.",
    url: `${getSiteOrigin()}/zh`,
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const langHeader = (await headers()).get("x-agentskill-lang");
  const htmlLang = langHeader === "en" ? "en" : "zh-CN";
  const googleSiteVerification = process.env.GOOGLE_SITE_VERIFICATION;
  const bingSiteVerification = process.env.BING_SITE_VERIFICATION;
  const footerLang = langHeader === "en" ? ("en" as const) : ("zh" as const);

  return (
    <html lang={htmlLang}>
      <head>
        <link rel="preconnect" href="https://pagead2.googlesyndication.com" />
        <link rel="preconnect" href="https://umami.agentskill.work" />
        <link rel="dns-prefetch" href="https://github.com" />
        <link
          rel="alternate"
          type="application/rss+xml"
          title="agentskill.work RSS Feed"
          href="/feed.xml"
        />
        <meta name="google-adsense-account" content="ca-pub-6394607607868553" />
        {googleSiteVerification ? (
          <meta name="google-site-verification" content={googleSiteVerification} />
        ) : null}
        {bingSiteVerification ? (
          <meta name="msvalidate.01" content={bingSiteVerification} />
        ) : null}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6394607607868553"
          crossOrigin="anonymous"
        ></script>
      </head>
      <body>
        {children}
        <SiteFooter lang={footerLang} />
        <script
          defer
          src="https://umami.agentskill.work/script.js"
          data-website-id="6b5e7d60-f8b8-4e27-a664-9059b9a3565a"
        ></script>
      </body>
    </html>
  );
}
