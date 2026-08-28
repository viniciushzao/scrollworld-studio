"use client";

import React, { useState } from "react";
import { SceneMedia } from "@/lib/engine/types";
import { ProjectSettings } from "@/lib/types/studio";
import { ScrollWorldPlayer } from "@/components/player/ScrollWorldPlayer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Monitor,
  Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";

interface DualPreviewProps {
  scenes: SceneMedia[];
  settings: ProjectSettings;
  activeSceneIndex: number;
  onProgress?: (progress: number, sceneIndex: number) => void;
  onSceneChange?: (sceneIndex: number, scene: SceneMedia) => void;
}

export function DualPreview({
  scenes,
  settings,
  activeSceneIndex,
  onProgress,
  onSceneChange,
}: DualPreviewProps) {
  const [viewportMode, setViewportMode] = useState<"desktop" | "mobile">(
    settings.aspectRatio === "9:16" ? "mobile" : "desktop"
  );
  const [showDebugHud, setShowDebugHud] = useState(false);
  const { t } = useTranslation();

  return (
    <div className="flex flex-col h-full bg-zinc-950/40 relative overflow-hidden">
      <div className="p-3 border-b border-white/10 flex items-center justify-between bg-zinc-950/80 backdrop-blur-xl z-20">
        <div className="flex items-center gap-1 rounded-xl bg-zinc-900/90 p-1 border border-white/10">
          <button
            onClick={() => setViewportMode("desktop")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium transition-all",
              viewportMode === "desktop"
                ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/25"
                : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            <Monitor className="h-3.5 w-3.5" />
            <span>{t("studio.desktopView", "Desktop 16:9")}</span>
          </button>

          <button
            onClick={() => setViewportMode("mobile")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium transition-all",
              viewportMode === "mobile"
                ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/25"
                : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>{t("studio.mobileView", "Mobile 9:16")}</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="hidden sm:inline">{t("studio.telemetryHud", "Telemetry HUD")}</span>
            <Switch
              checked={showDebugHud}
              onCheckedChange={setShowDebugHud}
            />
          </div>

          <Badge variant="emerald" className="hidden sm:inline-flex">
            {t("studio.blobCacheReady", "Blob Cache Ready")}
          </Badge>
          <Badge variant="outline" className="hidden md:inline-flex font-mono text-[10px]">
            {t("studio.dynamicPool", "Dynamic Pool Max 2")}
          </Badge>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 md:p-8 overflow-hidden relative">
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div
          className={cn(
            "transition-all duration-500 ease-out flex items-center justify-center relative",
            viewportMode === "desktop"
              ? "w-full max-w-5xl aspect-video h-auto max-h-[78vh]"
              : "w-[360px] h-[640px] max-h-[82vh]"
          )}
        >
          <ScrollWorldPlayer
            scenes={scenes}
            mode={viewportMode}
            dampingFactor={settings.dampingFactor}
            lingerEasePower={3.0}
            showControls={true}
            showDebugHud={showDebugHud}
            showSceneOverlay={settings.showOverlayText}
            showProgressDots={settings.showProgressDots}
            onProgress={onProgress}
            onSceneChange={onSceneChange}
            className="w-full h-full"
          />
        </div>
      </div>
    </div>
  );
}
