"use client";

import { useCallback, useState } from "react";
import type { Language } from "@/lib/i18n";

export function InstallCTA({
  fullName,
  htmlUrl,
  lang,
  installMethods,
}: {
  fullName: string;
  htmlUrl: string;
  lang: Language;
  installMethods?: string[] | null;
}) {
  const command = installMethods?.[0] || `git clone https://github.com/${fullName}.git`;
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(command).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [command]);

  return (
    <section className="install-cta">
      <h2>{lang === "zh" ? "安装这个 Skill" : "Install this Skill"}</h2>
      <div className="install-command">
        <code>{command}</code>
        <button
          type="button"
          className="install-copy-btn"
          onClick={handleCopy}
          aria-label="Copy install command"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="install-actions">
        <a className="button primary" href={htmlUrl} target="_blank" rel="noreferrer">
          GitHub
        </a>
      </div>
    </section>
  );
}
