"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { I18nProvider, useTranslation } from "@/lib/i18n/context";
import { LanguageSwitcher } from "./LanguageSwitcher";

function Header() {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-zinc-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition-transform">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
              ScrollWorld <span className="text-cyan-400 font-mono text-xs px-1.5 py-0.2 rounded-md bg-cyan-950/60 border border-cyan-500/30">STUDIO</span>
            </span>
            <span className="text-[10px] text-zinc-400 font-medium tracking-wide">
              {t("nav.engineTag", "60 FPS Frame-Locked Scrub Engine")}
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-zinc-400">
          <Link href="/" className="hover:text-white transition-colors">
            {t("nav.overview", "Overview")}
          </Link>
          <Link href="/studio" className="hover:text-white transition-colors">
            {t("nav.studioIde", "Studio IDE")}
          </Link>
          <Link href="/samsung-s26-ultra" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>Galaxy S26 Ultra (Site Real)</span>
          </Link>
          <a
            href="https://github.com/viniciushzao/scrollworld-studio"
            target="_blank"
            rel="noreferrer"
            className="hover:text-white transition-colors flex items-center gap-1"
          >
            <span>{t("nav.docs", "Docs")}</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />

          <Link href="/studio">
            <Button size="sm" className="gap-2 shadow-cyan-500/20">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{t("nav.launchStudio", "Launch Studio")}</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-white/10 bg-zinc-950/80 py-8 text-center text-xs text-zinc-500">
      <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-zinc-300">ScrollWorld Studio</span>
          <span>•</span>
          <span>{t("footer.tagline", "Next-Gen Video Scrubbing Architecture")}</span>
        </div>
        <div className="flex items-center gap-4 text-zinc-400 text-xs">
          <span>{t("footer.sub", "Google Gemini 3.6 Flash • Nano Banana 2 Lite • Monid Seedance 2.0 • Blob Memory Seeking")}</span>
        </div>
      </div>
    </footer>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <div className="min-h-screen bg-background text-foreground antialiased flex flex-col font-sans">
        <Header />
        <main className="flex-1 flex flex-col">{children}</main>
        <Footer />
      </div>
    </I18nProvider>
  );
}
