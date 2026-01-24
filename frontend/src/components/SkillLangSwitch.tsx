"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { LanguageToggle } from "@/components/LanguageToggle";
import { setStoredLanguage, type Language } from "@/lib/i18n";

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
    const params = new URLSearchParams(searchParams.toString());
    params.set("lang", next);
    router.replace(`/skills/${owner}/${repo}?${params.toString()}`);
  };

  return <LanguageToggle lang={lang} onChange={handleChange} />;
}
