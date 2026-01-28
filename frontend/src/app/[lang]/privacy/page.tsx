import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { type Language } from "@/lib/i18n";
import { getSiteOrigin } from "@/lib/site";

type PageProps = {
  params: Promise<{ lang: string }>;
};

function resolveLanguage(value: string): Language | null {
  if (value === "en") {
    return "en";
  }
  if (value === "zh") {
    return "zh";
  }
  return null;
}

const content = {
  zh: {
    title: "隐私政策",
    lastUpdated: "最后更新：2025 年 1 月",
    sections: [
      {
        heading: "概述",
        body: "agentskill.work（以下简称「本站」）尊重并保护用户隐私。本隐私政策说明我们如何收集、使用和保护您的信息。",
      },
      {
        heading: "我们收集的信息",
        body: "本站收集以下类型的信息：",
        list: [
          "访问数据：页面浏览、访问时间、引荐来源等匿名统计信息",
          "设备信息：浏览器类型、操作系统、屏幕分辨率等",
          "Cookie 数据：用于广告个性化和网站功能的 Cookie",
        ],
      },
      {
        heading: "分析服务",
        body: "本站使用 Umami 进行网站分析。Umami 是一个隐私友好的分析工具，不使用 Cookie，不收集个人身份信息，所有数据匿名处理。",
      },
      {
        heading: "广告服务",
        body: "本站使用 Google AdSense 展示广告。Google 及其合作伙伴可能使用 Cookie 根据您的浏览历史展示个性化广告。您可以通过以下方式管理广告偏好：",
        list: [
          "访问 Google 广告设置：https://adssettings.google.com",
          "访问 Network Advertising Initiative 退出页面：https://optout.networkadvertising.org",
        ],
      },
      {
        heading: "Cookie 使用",
        body: "本站使用以下类型的 Cookie：",
        list: [
          "必要 Cookie：用于网站基本功能，如语言偏好设置",
          "广告 Cookie：由 Google AdSense 设置，用于展示相关广告",
        ],
      },
      {
        heading: "数据安全",
        body: "我们采取合理的技术和组织措施保护您的数据安全。本站通过 HTTPS 加密所有数据传输。",
      },
      {
        heading: "第三方链接",
        body: "本站包含指向 GitHub 等第三方网站的链接。我们不对这些网站的隐私政策负责，建议您查阅相关网站的隐私政策。",
      },
      {
        heading: "您的权利",
        body: "根据适用的数据保护法律，您可能享有以下权利：",
        list: [
          "访问我们持有的关于您的数据",
          "要求更正或删除您的数据",
          "反对或限制数据处理",
          "数据可携带性",
        ],
      },
      {
        heading: "政策更新",
        body: "我们可能会不时更新本隐私政策。更新后的政策将在本页面发布，并更新「最后更新」日期。",
      },
      {
        heading: "联系我们",
        body: "如有任何隐私相关问题，请通过 GitHub Issues 联系我们：https://github.com/yfge/agentskill.work/issues",
      },
    ],
    backToHome: "返回首页",
  },
  en: {
    title: "Privacy Policy",
    lastUpdated: "Last updated: January 2025",
    sections: [
      {
        heading: "Overview",
        body: 'agentskill.work ("this site") respects and protects user privacy. This privacy policy explains how we collect, use, and protect your information.',
      },
      {
        heading: "Information We Collect",
        body: "This site collects the following types of information:",
        list: [
          "Visit data: Anonymous statistics such as page views, visit times, and referral sources",
          "Device information: Browser type, operating system, screen resolution, etc.",
          "Cookie data: Cookies used for ad personalization and site functionality",
        ],
      },
      {
        heading: "Analytics",
        body: "This site uses Umami for website analytics. Umami is a privacy-friendly analytics tool that does not use cookies, does not collect personally identifiable information, and processes all data anonymously.",
      },
      {
        heading: "Advertising",
        body: "This site uses Google AdSense to display advertisements. Google and its partners may use cookies to show personalized ads based on your browsing history. You can manage your ad preferences by:",
        list: [
          "Visiting Google Ad Settings: https://adssettings.google.com",
          "Visiting the Network Advertising Initiative opt-out page: https://optout.networkadvertising.org",
        ],
      },
      {
        heading: "Cookie Usage",
        body: "This site uses the following types of cookies:",
        list: [
          "Essential cookies: Used for basic site functionality, such as language preferences",
          "Advertising cookies: Set by Google AdSense to display relevant ads",
        ],
      },
      {
        heading: "Data Security",
        body: "We take reasonable technical and organizational measures to protect your data. This site encrypts all data transmission via HTTPS.",
      },
      {
        heading: "Third-Party Links",
        body: "This site contains links to third-party websites such as GitHub. We are not responsible for the privacy policies of these sites. We recommend reviewing their privacy policies.",
      },
      {
        heading: "Your Rights",
        body: "Under applicable data protection laws, you may have the following rights:",
        list: [
          "Access the data we hold about you",
          "Request correction or deletion of your data",
          "Object to or restrict data processing",
          "Data portability",
        ],
      },
      {
        heading: "Policy Updates",
        body: 'We may update this privacy policy from time to time. Updated policies will be posted on this page with an updated "Last updated" date.',
      },
      {
        heading: "Contact Us",
        body: "For any privacy-related questions, please contact us via GitHub Issues: https://github.com/yfge/agentskill.work/issues",
      },
    ],
    backToHome: "Back to Home",
  },
} as const;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const lang = resolveLanguage(resolvedParams.lang);
  if (!lang) {
    return {};
  }

  const siteOrigin = getSiteOrigin();
  const canonical = `${siteOrigin}/${lang}/privacy`;
  const copy = content[lang];

  return {
    title: `${copy.title} - agentskill.work`,
    description:
      lang === "zh"
        ? "了解 agentskill.work 如何收集、使用和保护您的信息。"
        : "Learn how agentskill.work collects, uses, and protects your information.",
    alternates: {
      canonical,
      languages: {
        "zh-CN": `${siteOrigin}/zh/privacy`,
        "en-US": `${siteOrigin}/en/privacy`,
        "x-default": `${siteOrigin}/zh/privacy`,
      },
    },
    openGraph: {
      title: `${copy.title} - agentskill.work`,
      url: canonical,
      siteName: "agentskill.work",
      locale: lang === "en" ? "en_US" : "zh_CN",
      type: "website",
    },
  };
}

export default async function PrivacyPage({ params }: PageProps) {
  const resolvedParams = await params;
  const lang = resolveLanguage(resolvedParams.lang);
  if (!lang) {
    notFound();
  }

  const copy = content[lang];

  return (
    <main className="container legal">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href={`/${lang}`}>{copy.backToHome}</Link>
        <span>/</span>
        <span>{copy.title}</span>
      </nav>

      <article className="legal-content">
        <h1>{copy.title}</h1>
        <p className="legal-updated">{copy.lastUpdated}</p>

        {copy.sections.map((section) => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            <p>{section.body}</p>
            {"list" in section && section.list && (
              <ul>
                {section.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </article>

      <div className="legal-back">
        <Link href={`/${lang}`} className="button">
          {copy.backToHome}
        </Link>
      </div>
    </main>
  );
}
