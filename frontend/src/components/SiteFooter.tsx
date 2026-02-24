import Link from "next/link";

import {
  fetchFacetsCached,
  type FacetItem,
} from "@/lib/apiServer";
import { messages, type Language } from "@/lib/i18n";

async function getFooterFacets(): Promise<{
  topics: FacetItem[];
  languages: FacetItem[];
}> {
  try {
    const [topicsData, languagesData] = await Promise.all([
      fetchFacetsCached("topics", 5),
      fetchFacetsCached("languages", 5),
    ]);
    return { topics: topicsData.items, languages: languagesData.items };
  } catch {
    return { topics: [], languages: [] };
  }
}

export async function SiteFooter({ lang = "zh" }: { lang?: Language }) {
  const { topics, languages } = await getFooterFacets();
  const copy = messages[lang];
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer-grid">
        <div className="footer-col">
          <h4>{copy.footerBrowse}</h4>
          <ul>
            <li>
              <Link href={`/${lang}`}>{copy.footerTrending}</Link>
            </li>
            <li>
              <Link href={`/${lang}/latest`}>{copy.footerLatest}</Link>
            </li>
            <li>
              <Link href={`/${lang}/openclaw`}>{copy.footerOpenClaw}</Link>
            </li>
          </ul>
        </div>

        {topics.length > 0 && (
          <div className="footer-col">
            <h4>{copy.footerTopics}</h4>
            <ul>
              {topics.map((t) => (
                <li key={t.value}>
                  <Link href={`/${lang}/topics/${encodeURIComponent(t.value)}`}>
                    {t.value}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {languages.length > 0 && (
          <div className="footer-col">
            <h4>{copy.footerLanguages}</h4>
            <ul>
              {languages.map((l) => (
                <li key={l.value}>
                  <Link href={`/${lang}/languages/${encodeURIComponent(l.value)}`}>
                    {l.value}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="footer-col">
          <h4>{copy.footerResources}</h4>
          <ul>
            <li>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a href="/api/docs">{copy.footerApi}</a>
            </li>
            <li>
              <a href="/llms.txt">llms.txt</a>
            </li>
            <li>
              <Link href={`/${lang}/privacy`}>{copy.footerPrivacy}</Link>
            </li>
            <li>
              <a
                href="https://github.com/yfge/agentskill.work"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="site-footer-inner">
        <span className="site-footer-copyright">
          © {year} geyunfei <span aria-hidden="true">·</span>{" "}
          <a
            className="site-footer-link"
            href="https://github.com/yfge/agentskill.work"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>{" "}
          <span aria-hidden="true">·</span>{" "}
          <a
            className="site-footer-link"
            href="https://github.com/yfge/agentskill.work/blob/main/LICENSE"
            target="_blank"
            rel="noreferrer"
          >
            MIT License
          </a>{" "}
          <span aria-hidden="true">·</span>{" "}
          <Link className="site-footer-link" href="/zh/privacy">
            Privacy
          </Link>
        </span>
      </div>
    </footer>
  );
}
