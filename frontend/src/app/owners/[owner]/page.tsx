import { headers } from "next/headers";
import { permanentRedirect } from "next/navigation";

import { detectLanguageFromAcceptLanguage, normalizeLanguage } from "@/lib/i18n";

type PageProps = {
  params: Promise<{ owner: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function LegacyOwnerRedirect({
  params,
  searchParams,
}: PageProps) {
  const resolvedParams = await params;
  const resolvedSearch = searchParams ? await searchParams : {};

  const queryLang = first(resolvedSearch.lang) || first(resolvedSearch.hl);
  const acceptLanguage = (await headers()).get("accept-language");
  const detectedLang = detectLanguageFromAcceptLanguage(acceptLanguage);
  const lang = normalizeLanguage(queryLang || detectedLang);

  permanentRedirect(
    `/${lang}/owners/${encodeURIComponent(resolvedParams.owner)}`,
  );
}
