import { headers } from "next/headers";
import { permanentRedirect } from "next/navigation";

import { detectLanguageFromAcceptLanguage, normalizeLanguage } from "@/lib/i18n";

type PageProps = {
  params: Promise<{ owner: string; repo: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function LegacySkillDetailRedirect({
  params,
  searchParams,
}: PageProps) {
  const resolvedParams = await params;
  const resolvedSearch = searchParams ? await searchParams : {};

  const queryLang = first(resolvedSearch.lang) || first(resolvedSearch.hl);
  const detectedLang = detectLanguageFromAcceptLanguage(
    headers().get("accept-language"),
  );
  const langRaw = queryLang || detectedLang;
  const lang = normalizeLanguage(langRaw);

  const nextParams = new URLSearchParams();
  for (const [key, value] of Object.entries(resolvedSearch)) {
    if (key === "lang" || key === "hl") {
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item) {
          nextParams.append(key, item);
        }
      }
      continue;
    }
    if (value) {
      nextParams.set(key, value);
    }
  }
  const qs = nextParams.toString();

  permanentRedirect(
    `/${lang}/skills/${encodeURIComponent(resolvedParams.owner)}/${encodeURIComponent(
      resolvedParams.repo,
    )}${qs ? `?${qs}` : ""}`,
  );
}
