import { headers } from "next/headers";
import { permanentRedirect } from "next/navigation";

import { detectLanguageFromAcceptLanguage, normalizeLanguage } from "@/lib/i18n";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function RootPage({ searchParams }: PageProps) {
  const resolvedSearch = searchParams ? await searchParams : {};
  const queryLang = first(resolvedSearch.lang) || first(resolvedSearch.hl);
  const acceptLanguage = (await headers()).get("accept-language");
  const detectedLang = detectLanguageFromAcceptLanguage(acceptLanguage);
  const langRaw = queryLang || detectedLang;
  const lang = normalizeLanguage(langRaw);

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(resolvedSearch)) {
    if (key === "lang" || key === "hl") {
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item) {
          params.append(key, item);
        }
      }
      continue;
    }
    if (value) {
      params.set(key, value);
    }
  }

  const qs = params.toString();
  permanentRedirect(`/${lang}${qs ? `?${qs}` : ""}`);
}
