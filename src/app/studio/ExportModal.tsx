"use client";

import React, { useState } from "react";
import { StudioProject } from "@/lib/types/studio";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Code,
  Copy,
  Check,
  Download,
  Share2,
  ExternalLink,
  Layers,
  Sparkles,
  Globe,
  FileCode,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";

interface ExportModalProps {
  project: StudioProject;
  isOpen: boolean;
  onClose: () => void;
}

export function ExportModal({ project, isOpen, onClose }: ExportModalProps) {
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const { t } = useTranslation();

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(key);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  const previewUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/preview/${project.id}`
      : `https://scrollworld.studio/preview/${project.id}`;

  const jsonScenes = JSON.stringify(project.scenes, null, 2);

  const embedCode = `<!-- ScrollWorld Studio Universal Embed (<12KB) -->
<div id="scrollworld-${project.id}" style="width: 100%; height: 100vh; position: relative;"></div>
<script src="https://cdn.scrollworld.studio/embed/scroll-world.js" async></script>
<script>
  window.addEventListener('load', function() {
    if (window.ScrollWorld) {
      ScrollWorld.mount('#scrollworld-${project.id}', {
        projectId: '${project.id}',
        dampingFactor: ${project.settings.dampingFactor},
        lingerFactor: ${project.settings.lingerFactor},
        mode: 'desktop',
        scenes: ${jsonScenes}
      });
    }
  });
</script>`;

  const webComponentCode = `<!-- ScrollWorld Native Web Component -->
<script type="module" src="https://cdn.scrollworld.studio/embed/scroll-world.js"></script>

<scroll-world
  project-id="${project.id}"
  damping="${project.settings.dampingFactor}"
  linger="${project.settings.lingerFactor}"
  style="width: 100%; height: 100vh; display: block;"
>
  <script type="application/json">
    ${jsonScenes}
  </script>
</scroll-world>`;

  const reactCode = `import React from 'react';
import { ScrollWorldPlayer } from '@scrollworld/react';

const scenes = ${jsonScenes};

export default function ExperiencePage() {
  return (
    <main className="w-full h-screen bg-black">
      <ScrollWorldPlayer
        scenes={scenes}
        dampingFactor={${project.settings.dampingFactor}}
        lingerEasePower={3.0}
        showControls={true}
        showProgressDots={true}
      />
    </main>
  );
}`;

  const handleDownloadStandaloneHTML = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>${project.title} | ScrollWorld Experience</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body, html { width: 100%; height: 100%; overflow: hidden; background: #000; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    #player-root { width: 100vw; height: 100vh; position: relative; }
  </style>
</head>
<body>
  <div id="player-root"></div>
  <script src="https://cdn.scrollworld.studio/embed/scroll-world.js"></script>
  <script>
    window.addEventListener('DOMContentLoaded', () => {
      ScrollWorld.mount('#player-root', {
        projectId: '${project.id}',
        dampingFactor: ${project.settings.dampingFactor},
        lingerFactor: ${project.settings.lingerFactor},
        scenes: ${jsonScenes}
      });
    });
  </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${project.id}-standalone-world.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
            <Sparkles className="h-4 w-4" />
            <span>{t("exportModal.tag", "UNIVERSAL DEPLOYMENT & EMBED ENGINE")}</span>
          </div>
          <DialogTitle className="text-xl text-white">
            {t("exportModal.title", "Export")} {project.title}
          </DialogTitle>
          <DialogDescription>
            {t("exportModal.subtitle", "Seamless zero-dependency integration across Webflow, Shopify, Framer, React, Next.js, or raw HTML.")}
          </DialogDescription>
        </DialogHeader>

        <div className="p-3 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-mono text-cyan-300 block uppercase">
              {t("exportModal.previewUrlLabel", "PUBLIC IMMERSIVE PREVIEW URL")}
            </span>
            <p className="text-xs text-zinc-300 font-mono truncate">{previewUrl}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleCopy("share_url", previewUrl)}
              className="gap-1.5 h-8 text-xs"
            >
              {copiedTab === "share_url" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedTab === "share_url" ? t("exportModal.copied", "Copied") : t("exportModal.copyLink", "Copy Link")}</span>
            </Button>
            <a
              href={`/preview/${project.id}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 p-2 rounded-lg hover:bg-white/5"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>

        <Tabs defaultValue="embed" className="w-full mt-2">
          <TabsList className="grid grid-cols-4 w-full h-11">
            <TabsTrigger value="embed" className="gap-1.5 text-xs">
              <Globe className="h-3.5 w-3.5" />
              <span>{t("exportModal.tabUniversalJs", "Universal JS")}</span>
            </TabsTrigger>
            <TabsTrigger value="webcomponent" className="gap-1.5 text-xs">
              <Layers className="h-3.5 w-3.5" />
              <span>{t("exportModal.tabWebComponent", "Web Component")}</span>
            </TabsTrigger>
            <TabsTrigger value="react" className="gap-1.5 text-xs">
              <Code className="h-3.5 w-3.5" />
              <span>{t("exportModal.tabReact", "React / Next.js")}</span>
            </TabsTrigger>
            <TabsTrigger value="html" className="gap-1.5 text-xs">
              <FileCode className="h-3.5 w-3.5" />
              <span>{t("exportModal.tabStandalone", "Standalone HTML")}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="embed" className="space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>{t("exportModal.tabUniversalJsDesc", "Paste into Webflow, Shopify, WordPress, or HTML header:")}</span>
              <Badge variant="cyan">&lt; 12KB GZIP</Badge>
            </div>
            <div className="relative rounded-2xl bg-zinc-950 p-4 border border-white/10 font-mono text-xs text-zinc-300 overflow-x-auto max-h-56">
              <pre>{embedCode}</pre>
            </div>
            <Button
              className="w-full gap-2"
              onClick={() => handleCopy("embed", embedCode)}
            >
              {copiedTab === "embed" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{copiedTab === "embed" ? t("exportModal.copied", "Copied") : t("exportModal.copyLink", "Copy Universal JS Script")}</span>
            </Button>
          </TabsContent>

          <TabsContent value="webcomponent" className="space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Native Custom Element isolated with Shadow DOM:</span>
              <Badge variant="emerald">Zero Framework Dependency</Badge>
            </div>
            <div className="relative rounded-2xl bg-zinc-950 p-4 border border-white/10 font-mono text-xs text-zinc-300 overflow-x-auto max-h-56">
              <pre>{webComponentCode}</pre>
            </div>
            <Button
              className="w-full gap-2"
              onClick={() => handleCopy("webcomp", webComponentCode)}
            >
              {copiedTab === "webcomp" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{copiedTab === "webcomp" ? "Copied Web Component!" : "Copy Web Component Code"}</span>
            </Button>
          </TabsContent>

          <TabsContent value="react" className="space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>React 19 & Next.js 15 App Router component:</span>
              <Badge variant="purple">Full TypeScript Support</Badge>
            </div>
            <div className="relative rounded-2xl bg-zinc-950 p-4 border border-white/10 font-mono text-xs text-zinc-300 overflow-x-auto max-h-56">
              <pre>{reactCode}</pre>
            </div>
            <Button
              className="w-full gap-2"
              onClick={() => handleCopy("react", reactCode)}
            >
              {copiedTab === "react" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{copiedTab === "react" ? "Copied React Code!" : "Copy React Component Code"}</span>
            </Button>
          </TabsContent>

          <TabsContent value="html" className="space-y-4">
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/10 space-y-2">
              <h4 className="text-sm font-semibold text-white">Standalone Self-Contained Bundle</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Download a fully functional standalone HTML file that can be opened directly in any browser offline or deployed to Netlify, Vercel, or AWS S3 without any build step.
              </p>
            </div>

            <Button
              className="w-full gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-lg shadow-emerald-500/20"
              onClick={handleDownloadStandaloneHTML}
            >
              <Download className="h-4 w-4" />
              <span>Download Standalone .html World</span>
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
