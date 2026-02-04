import { useCallback } from "react";
import type { Language } from "@/lib/i18n";

/**
 * Custom hook for handling language toggle with optimized callback
 */
export function useLanguageToggle(currentLang: Language) {
  return useCallback(
    (newLang: Language) => {
      if (newLang === currentLang) return;

      const newPath = window.location.pathname.replace(
        `/${currentLang}/`,
        `/${newLang}/`,
      );
      window.location.href = newPath;
    },
    [currentLang],
  );
}
