import { permanentRedirect } from "next/navigation";

import { normalizeLanguage } from "@/lib/i18n";

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
  const langRaw = first(resolvedSearch.lang) || first(resolvedSearch.hl) || "zh";
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
