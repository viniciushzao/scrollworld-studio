"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { SupportedLocale, TranslationDictionary, SUPPORTED_LANGUAGES } from "./types";
import { en } from "./locales/en";

interface I18nContextType {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: (path: string, fallback?: string) => string;
  dict: TranslationDictionary;
}

const I18nContext = createContext<I18nContextType>({
  locale: "en",
  setLocale: () => {},
  t: (path: string, fallback?: string) => fallback || path,
  dict: en,
});

const STORAGE_KEY = "scrollworld_locale";

function getNestedTranslation(obj: any, path: string): string | undefined {
  if (!obj || !path) return undefined;
  const parts = path.split(".");
  let current = obj;
  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = current[part];
  }
  return typeof current === "string" ? current : undefined;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>("en");
  const [dict, setDict] = useState<TranslationDictionary>(en);
  const [loadedDicts, setLoadedDicts] = useState<Record<string, TranslationDictionary>>({ en });

  useEffect(() => {
    try {
      const savedLocale = localStorage.getItem(STORAGE_KEY) as SupportedLocale;
      if (savedLocale && SUPPORTED_LANGUAGES.some(l => l.code === savedLocale)) {
        changeLocale(savedLocale);
      } else {
        const browserLang = navigator.language;
        if (browserLang.startsWith("pt")) {
          changeLocale("pt-BR");
        } else if (browserLang.startsWith("zh")) {
          changeLocale("zh-CN");
        }
      }
    } catch {}
  }, []);

  const changeLocale = useCallback(async (newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
      if (typeof document !== "undefined") {
        document.documentElement.lang = newLocale;
      }
    } catch {}

    if (newLocale === "en") {
      setDict(en);
      return;
    }

    if (loadedDicts[newLocale]) {
      setDict(loadedDicts[newLocale]);
      return;
    }

    try {
      let loaded: TranslationDictionary | undefined;
      if (newLocale === "pt-BR") {
        const mod = await import("./locales/pt-BR");
        loaded = (mod as any).ptBR || mod.default;
      } else if (newLocale === "zh-CN") {
        const mod = await import("./locales/zh-CN");
        loaded = (mod as any).zhCN || mod.default;
      }

      if (loaded) {
        setDict(loaded);
        setLoadedDicts(prev => ({ ...prev, [newLocale]: loaded! }));
      }
    } catch (err) {
      console.warn(`[i18n] Failed to load dictionary for ${newLocale}, falling back to en:`, err);
      setDict(en);
    }
  }, [loadedDicts]);

  const t = useCallback(
    (path: string, fallback?: string): string => {
      const val = getNestedTranslation(dict, path);
      if (val !== undefined) return val;
      const enVal = getNestedTranslation(en, path);
      if (enVal !== undefined) return enVal;
      return fallback || path;
    },
    [dict]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale: changeLocale, t, dict }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  return useContext(I18nContext);
}

export const useI18n = useTranslation;
