"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { ScrubEngine } from "@/lib/engine/scrub-engine";
import { SceneMedia, ScrubState } from "@/lib/engine/types";
import { Badge } from "@/components/ui/badge";
import {
  RotateCcw,
  Sparkles,
  Layers,
  Activity,
  ArrowDown,
  Compass,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ScrollWorldPlayerProps {
  scenes: SceneMedia[];
  mode?: "desktop" | "mobile";
  dampingFactor?: number;
  lingerEasePower?: number;
  showControls?: boolean;
  showDebugHud?: boolean;
  showSceneOverlay?: boolean;
  showProgressDots?: boolean;
  className?: string;
  onProgress?: (progress: number, activeSceneIndex: number) => void;
  onSceneChange?: (sceneIndex: number, scene: SceneMedia) => void;
}

export function ScrollWorldPlayer({
  scenes,
  mode = "desktop",
  dampingFactor = 0.18,
  lingerEasePower = 3.0,
  showControls = true,
  showDebugHud = false,
  showSceneOverlay = true,
  showProgressDots = true,
  className,
  onProgress,
  onSceneChange,
}: ScrollWorldPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<ScrubEngine | null>(null);

  const [globalProgress, setGlobalProgress] = useState(0);
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [engineState, setEngineState] = useState<ScrubState | null>(null);

  useEffect(() => {
    if (!containerRef.current || !scenes.length) return;

    const engine = new ScrubEngine({
      container: containerRef.current,
      scenes: scenes,
      mode: mode,
      dampingFactor: dampingFactor,
      lingerEasePower: lingerEasePower,
      debug: showDebugHud,
      onProgress: (p, sIdx) => {
        setGlobalProgress(p);
        setActiveSceneIndex(sIdx);
        onProgress?.(p, sIdx);
      },
      onSceneChange: (sIdx) => {
        setActiveSceneIndex(sIdx);
        if (scenes[sIdx]) onSceneChange?.(sIdx, scenes[sIdx]);
      },
    });

    engineRef.current = engine;

    const hudInterval = setInterval(() => {
      if (engineRef.current) {
        setEngineState(engineRef.current.getState());
      }
    }, 150);

    return () => {
      clearInterval(hudInterval);
      engine.destroy();
      engineRef.current = null;
    };
  }, [scenes, mode, dampingFactor, lingerEasePower, showDebugHud, onProgress, onSceneChange]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!engineRef.current) return;
    const delta = e.deltaY * 0.00085;
    engineRef.current.scrollBy(delta);
  }, []);

  const isDraggingRef = useRef(false);
  const dragStartY = useRef(0);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    dragStartY.current = e.clientY;
    if (engineRef.current) engineRef.current.prime();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !engineRef.current) return;
    const deltaY = e.clientY - dragStartY.current;
    dragStartY.current = e.clientY;
    engineRef.current.scrollBy(-deltaY * 0.002);
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  const activeScene = scenes[activeSceneIndex] || scenes[0];

  return (
    <div
      className={cn(
        "relative w-full h-full select-none overflow-hidden bg-black flex items-center justify-center group",
        className
      )}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{ cursor: "grab" }}
    >
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {showSceneOverlay && activeScene && (
        <div className="pointer-events-none absolute inset-0 z-30 flex flex-col justify-between p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 rounded-full bg-black/60 backdrop-blur-xl border border-white/15 px-3.5 py-1.5 text-xs text-white">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="font-semibold tracking-wide">
                SCENE {activeSceneIndex + 1} OF {scenes.length}
              </span>
            </div>

            <div className="rounded-full bg-black/60 backdrop-blur-xl border border-white/15 px-3 py-1 font-mono text-[11px] text-cyan-300">
              {Math.round(globalProgress * 100)}% SCROLL
            </div>
          </div>

          <div className="max-w-lg bg-black/80 backdrop-blur-2xl border border-white/15 rounded-3xl p-6 shadow-2xl space-y-2.5 transition-all duration-300">
            {activeScene.subtitle && (
              <p className="text-cyan-400 text-xs font-mono uppercase tracking-wider font-bold">
                {activeScene.subtitle}
              </p>
            )}
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {activeScene.title}
            </h2>
            {activeScene.description && (
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                {activeScene.description}
              </p>
            )}

            {activeScene.tags && activeScene.tags.length > 0 && (
              <div className="pt-2 flex flex-wrap gap-1.5">
                {activeScene.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="glass"
                    className="text-[10px] bg-white/10 text-zinc-200 border-white/10"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showDebugHud && engineState && (
        <div className="pointer-events-none absolute top-4 left-4 z-40 bg-black/85 backdrop-blur-xl border border-cyan-500/30 p-3 rounded-2xl font-mono text-[10px] text-zinc-300 space-y-1">
          <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
            <Activity className="h-3.5 w-3.5" />
            <span>PLAYER ENGINE TELEMETRY</span>
          </div>
          <div>FPS: <strong className="text-emerald-400">{engineState.fps}</strong></div>
          <div>Progress: <strong className="text-white">{(globalProgress * 100).toFixed(1)}%</strong></div>
          <div>Decoder Busy: <strong className={engineState.isSeeking ? "text-amber-400" : "text-emerald-400"}>{engineState.isSeeking ? "TRUE" : "FALSE"}</strong></div>
          <div>Active Video Nodes: <strong className="text-white">{engineState.activeVideosInPool} / 2</strong></div>
        </div>
      )}
    </div>
  );
}
