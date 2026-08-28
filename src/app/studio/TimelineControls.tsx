"use client";

import React, { useState, useEffect } from "react";
import { SceneMedia } from "@/lib/engine/types";
import { ProjectSettings } from "@/lib/types/studio";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Play,
  Pause,
  RotateCcw,
  Zap,
  Clock,
  FastForward,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";

interface TimelineControlsProps {
  scenes: SceneMedia[];
  activeProgress: number;
  activeSceneIndex: number;
  settings: ProjectSettings;
  onProgressChange: (progress: number) => void;
  onSettingsChange: (settings: ProjectSettings) => void;
}

export function TimelineControls({
  scenes,
  activeProgress,
  activeSceneIndex,
  settings,
  onProgressChange,
  onSettingsChange,
}: TimelineControlsProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      const next = activeProgress + 0.004;
      if (next >= 1) {
        setIsPlaying(false);
        onProgressChange(1);
      } else {
        onProgressChange(next);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [isPlaying, activeProgress, onProgressChange]);

  const handleUpdateSetting = <K extends keyof ProjectSettings>(
    key: K,
    val: ProjectSettings[K]
  ) => {
    onSettingsChange({
      ...settings,
      [key]: val,
    });
  };

  return (
    <div className="border-t border-white/10 bg-zinc-950/90 backdrop-blur-2xl p-4 md:px-6 space-y-4">
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsPlaying(!isPlaying)}
            className="h-9 w-9 p-0 rounded-xl bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
            title={isPlaying ? "Pause auto scrub" : "Simulate scroll play"}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setIsPlaying(false);
              onProgressChange(0);
            }}
            className="h-9 w-9 p-0 rounded-xl text-zinc-400 hover:text-white"
            title="Reset to beginning"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>

          <div className="font-mono text-xs text-cyan-400 font-semibold px-2 py-1 rounded bg-zinc-900 border border-white/5">
            {(activeProgress * 100).toFixed(1)}%
          </div>
        </div>

        <div className="flex-1 w-full relative">
          <div className="relative flex items-center">
            <Slider
              value={[activeProgress]}
              min={0}
              max={1}
              step={0.001}
              onValueChange={([val]) => {
                setIsPlaying(false);
                onProgressChange(val);
              }}
              className="py-2"
            />
          </div>

          <div className="absolute top-7 left-0 right-0 flex justify-between pointer-events-none px-1">
            {scenes.map((scene, idx) => {
              const positionPercent = (idx / Math.max(1, scenes.length - 1)) * 100;
              const isActive = idx === activeSceneIndex;
              return (
                <div
                  key={scene.id || idx}
                  className="flex flex-col items-center -translate-x-1/2"
                  style={{ left: `${positionPercent}%`, position: "absolute" }}
                >
                  <div
                    className={cn(
                      "h-1.5 w-0.5 rounded",
                      isActive ? "bg-cyan-400" : "bg-zinc-700"
                    )}
                  />
                  <span
                    className={cn(
                      "text-[9px] font-mono mt-0.5 truncate max-w-[70px] text-center",
                      isActive ? "text-cyan-400 font-bold" : "text-zinc-500"
                    )}
                  >
                    Sc {idx + 1}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-3 border-t border-white/5 text-xs">
        <div className="space-y-1.5 bg-zinc-900/50 p-2.5 rounded-xl border border-white/5">
          <div className="flex items-center justify-between text-zinc-300">
            <span className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-cyan-400" />
              <span>Lerp Damping</span>
            </span>
            <span className="font-mono text-cyan-400 font-bold">
              {settings.dampingFactor.toFixed(2)}
            </span>
          </div>
          <Slider
            value={[settings.dampingFactor]}
            min={0.05}
            max={0.4}
            step={0.01}
            onValueChange={([val]) => handleUpdateSetting("dampingFactor", val)}
          />
          <p className="text-[10px] text-zinc-400">
            0.08 (liquid inertia) to 0.35 (snappy response)
          </p>
        </div>

        <div className="space-y-1.5 bg-zinc-900/50 p-2.5 rounded-xl border border-white/5">
          <div className="flex items-center justify-between text-zinc-300">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-cyan-400" />
              <span>Global Linger Dwell</span>
            </span>
            <span className="font-mono text-cyan-400 font-bold">
              {Math.round(settings.lingerFactor * 100)}%
            </span>
          </div>
          <Slider
            value={[settings.lingerFactor]}
            min={0}
            max={0.9}
            step={0.05}
            onValueChange={([val]) => handleUpdateSetting("lingerFactor", val)}
          />
          <p className="text-[10px] text-zinc-400">
            Holds central scene reading plateau
          </p>
        </div>

        <div className="space-y-1.5 bg-zinc-900/50 p-2.5 rounded-xl border border-white/5">
          <div className="flex items-center justify-between text-zinc-300">
            <span className="flex items-center gap-1.5">
              <FastForward className="h-3.5 w-3.5 text-cyan-400" />
              <span>Scroll Distance (Dive)</span>
            </span>
            <span className="font-mono text-cyan-400 font-bold">
              {settings.scrollSensitivity.toFixed(1)}x
            </span>
          </div>
          <Slider
            value={[settings.scrollSensitivity]}
            min={0.5}
            max={2.5}
            step={0.1}
            onValueChange={([val]) => handleUpdateSetting("scrollSensitivity", val)}
          />
          <p className="text-[10px] text-zinc-400">
            Scroll pixels needed per scene traverse
          </p>
        </div>

        <div className="flex flex-col justify-center space-y-2 bg-zinc-900/50 p-2.5 rounded-xl border border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-zinc-300">Text Overlays</span>
            <Switch
              checked={settings.showOverlayText}
              onCheckedChange={(c) => handleUpdateSetting("showOverlayText", c)}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-300">Scene Dots</span>
            <Switch
              checked={settings.showProgressDots}
              onCheckedChange={(c) => handleUpdateSetting("showProgressDots", c)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
