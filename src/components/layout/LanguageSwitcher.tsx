"use client";

import React from "react";
import { useTranslation } from "@/lib/i18n/context";
import { SupportedLocale } from "@/lib/i18n/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe, Check } from "lucide-react";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useTranslation();

  const languages: { code: SupportedLocale; label: string; flag: string }[] = [
    { code: "en", label: "English", flag: "🇺🇸" },
    { code: "pt-BR", label: "Português (Brasil)", flag: "🇧🇷" },
    { code: "zh-CN", label: "简体中文", flag: "🇨🇳" },
  ];

  const currentLang = languages.find((l) => l.code === locale) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-1.5 rounded-xl bg-zinc-900/90 border border-white/10 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
          title={t("nav.language", "Language")}
        >
          <span className="text-sm">{currentLang.flag}</span>
          <span className="hidden sm:inline font-mono uppercase text-[11px]">{locale}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLocale(lang.code)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span>{lang.flag}</span>
              <span className="text-xs">{lang.label}</span>
            </div>
            {locale === lang.code && <Check className="h-3.5 w-3.5 text-cyan-400" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
