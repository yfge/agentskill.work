/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  trailingSlash: false,
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
      {
        source: "/(.*)\\.(js|css|woff2?|png|jpg|svg|ico|webp)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/((?!_next/static|_next/image|favicon).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, s-maxage=600, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },

  async redirects() {
    // Slug redirects for repos that were renamed on GitHub.
    // Each entry covers both /en/ and /zh/ variants.
    // Add new entries here whenever a tracked repo is renamed.
    const renamedRepos = [
      // BytePioneer-AI/moltbot-china → openclaw-china
      {
        old: "BytePioneer-AI/moltbot-china",
        new: "BytePioneer-AI/openclaw-china",
      },
      // DingTalk-Real-AI: connector renamed
      {
        old: "DingTalk-Real-AI/dingtalk-moltbot-connector",
        new: "DingTalk-Real-AI/dingtalk-openclaw-connector",
      },
      // miaoxworld: installer renamed
      {
        old: "miaoxworld/ClawdBotInstaller",
        new: "miaoxworld/OpenClawInstaller",
      },
      // openclaw: ansible repo renamed
      {
        old: "openclaw/clawdbot-ansible",
        new: "openclaw/openclaw-ansible",
      },
      // VoltAgent: awesome-claude-skills → awesome-openclaw-skills
      {
        old: "VoltAgent/awesome-claude-skills",
        new: "VoltAgent/awesome-openclaw-skills",
      },
      // gavrielc/nanoclaw repo transferred to qwibitai
      {
        old: "gavrielc/nanoclaw",
        new: "qwibitai/nanoclaw",
      },
    ];

    const skillRedirects = renamedRepos.flatMap(({ old: oldSlug, new: newSlug }) => {
      const [oldOwner, oldRepo] = oldSlug.split("/");
      const [newOwner, newRepo] = newSlug.split("/");
      return ["en", "zh"].map((lang) => ({
        source: `/${lang}/skills/${oldOwner}/${oldRepo}`,
        destination: `/${lang}/skills/${newOwner}/${newRepo}`,
        permanent: true,
      }));
    });

    return [
      {
        source: "/:path+/",
        destination: "/:path+",
        permanent: true,
      },
      ...skillRedirects,
    ];
  },
};

export default nextConfig;
