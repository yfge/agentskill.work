import { Language, messages } from "@/lib/i18n";

export function LanguageToggle({
  lang,
  onChange,
}: {
  lang: Language;
  onChange: (lang: Language) => void;
}) {
  return (
    <label className="lang-toggle">
      <span>{messages[lang].languageLabel}</span>
      <select
        value={lang}
        onChange={(event) => onChange(event.target.value as Language)}
        aria-label={messages[lang].languageLabel}
      >
        <option value="zh">{messages[lang].chinese}</option>
        <option value="en">{messages[lang].english}</option>
      </select>
    </label>
  );
}
