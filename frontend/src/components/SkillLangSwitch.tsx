"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { LanguageToggle } from "@/components/LanguageToggle";
import { setStoredLanguage, type Language } from "@/lib/i18n";

function withoutLangParams(params: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(params.toString());
  next.delete("lang");
  next.delete("hl");
  return next;
}

export function SkillLangSwitch({
  owner,
  repo,
  initialLang,
}: {
  owner: string;
  repo: string;
  initialLang: Language;
}) {
  const [lang, setLang] = useState<Language>(initialLang);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    setStoredLanguage(lang);
    document.documentElement.lang = lang === "en" ? "en" : "zh-CN";
  }, [lang]);

  const handleChange = (next: Language) => {
    setLang(next);
    const params = withoutLangParams(new URLSearchParams(searchParams.toString()));
    const qs = params.toString();
    router.replace(`/${next}/skills/${owner}/${repo}${qs ? `?${qs}` : ""}`);
  };

  return <LanguageToggle lang={lang} onChange={handleChange} />;
}
