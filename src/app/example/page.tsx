"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { ScrubEngine } from "@/lib/engine/scrub-engine";
import { SceneMedia, ScrubState } from "@/lib/engine/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Play,
  Pause,
  RotateCcw,
  Smartphone,
  Monitor,
  Cpu,
  Activity,
  Layers,
  Sparkles,
  Sliders,
  Code2,
  Share2,
  Check,
  Eye,
  Wand2,
  Compass,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const SAMSUNG_SCENES: SceneMedia[] = [
  {
    id: "scene_titanium_core",
    index: 0,
    title: "Titanium Armor & Monolithic Chassis",
    subtitle: "Aerospace-grade satin finish with light-scattering nano crystal coating",
    description: "Camera executes an elegant orbital pan around the device, revealing precision micro-beveled edges and seamless glass transitions.",
    tags: ["Grade 5 Titanium", "Nano-Matte Studio", "Orbital Arc"],
    stillPosterUrl: "/generated/stills/samsung_s26_scene1_start.png",
    videoDesktopUrl: "/generated/videos/samsung_s26_desktop_gop8.mp4",
    videoMobileUrl: "/generated/videos/samsung_s26_mobile_gop4.mp4",
    duration: 4.04,
    diveScrollPx: 800,
    lingerFactor: 0.35,
  },
  {
    id: "scene_quad_optics",
    index: 1,
    title: "Quad-Optics Optical Matrix",
    subtitle: "Variable aperture periscope array with laser-guided autofocus",
    description: "Smooth camera deceleration gliding directly toward the sapphire lens housings, highlighting anti-reflective multicoatings.",
    tags: ["200MP ISOCELL", "Sapphire Glass", "Micro-Macro Zoom"],
    stillPosterUrl: "/generated/stills/samsung_s26_scene1_mid.png",
    videoDesktopUrl: "/generated/videos/samsung_s26_desktop_gop8.mp4",
    videoMobileUrl: "/generated/videos/samsung_s26_mobile_gop4.mp4",
    duration: 4.04,
    diveScrollPx: 800,
    lingerFactor: 0.35,
  },
  {
    id: "scene_impulse_drift",
    index: 2,
    title: "Kinetic Impulse & Forward Flight",
    subtitle: "One continuous connected flight with zero cuts or camera jumps",
    description: "Settling into a slow, steady forward drift as optical flares bounce off the titanium frame at 60 FPS frame-locked scrubbing.",
    tags: ["GOP 8 Seekable", "60 FPS Scrub", "Seedance 2.0"],
    stillPosterUrl: "/generated/stills/samsung_s26_scene1_end.png",
    videoDesktopUrl: "/generated/videos/samsung_s26_desktop_gop8.mp4",
    videoMobileUrl: "/generated/videos/samsung_s26_mobile_gop4.mp4",
    duration: 4.04,
    diveScrollPx: 800,
    lingerFactor: 0.35,
  },
];

export default function ExampleShowcasePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<ScrubEngine | null>(null);

  const [mode, setMode] = useState<"desktop" | "mobile">("desktop");
  const [globalProgress, setGlobalProgress] = useState(0);
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [dampingFactor, setDampingFactor] = useState(0.18);
  const [showOverlays, setShowOverlays] = useState(true);
  const [activeTab, setActiveTab] = useState<"preview" | "telemetry" | "code">("preview");
  const [engineState, setEngineState] = useState<ScrubState | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new ScrubEngine({
      container: containerRef.current,
      scenes: SAMSUNG_SCENES,
      mode: mode,
      dampingFactor: dampingFactor,
      lingerEasePower: 3.0,
      debug: false,
      onProgress: (p, sIdx) => {
        setGlobalProgress(p);
        setActiveSceneIndex(sIdx);
      },
      onSceneChange: (sIdx) => {
        setActiveSceneIndex(sIdx);
      },
    });

    engineRef.current = engine;

    const interval = setInterval(() => {
      if (engineRef.current) {
        setEngineState(engineRef.current.getState());
      }
    }, 200);

    return () => {
      clearInterval(interval);
      engine.destroy();
      engineRef.current = null;
    };
  }, [mode, dampingFactor]);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      if (engineRef.current) {
        if (globalProgress >= 0.99) {
          engineRef.current.scrollToProgress(0);
        } else {
          engineRef.current.scrollBy(0.0025);
        }
      }
    }, 16);
    return () => clearInterval(interval);
  }, [isAutoPlaying, globalProgress]);

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

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentScene = SAMSUNG_SCENES[activeSceneIndex] || SAMSUNG_SCENES[0];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-cyan-500/30 flex flex-col">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl px-4 py-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 p-[1px]">
                <div className="h-full w-full rounded-[11px] bg-black flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <span className="font-bold text-sm tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                ScrollWorld <span className="text-cyan-400 text-xs font-mono">Live Showcase</span>
              </span>
            </Link>

            <Badge variant="cyan" className="hidden md:inline-flex text-[10px] font-mono">
              ByteDance Seedance 2.0 (1080p GOP 8)
            </Badge>
          </div>

          <div className="flex items-center rounded-xl bg-zinc-900/90 p-1 border border-white/10">
            <button
              onClick={() => setActiveTab("preview")}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5",
                activeTab === "preview" ? "bg-cyan-500 text-white shadow-sm" : "text-zinc-400 hover:text-white"
              )}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Experiência Web</span>
            </button>
            <button
              onClick={() => setActiveTab("telemetry")}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5",
                activeTab === "telemetry" ? "bg-cyan-500 text-white shadow-sm" : "text-zinc-400 hover:text-white"
              )}
            >
              <Activity className="h-3.5 w-3.5" />
              <span>Telemetria Real</span>
            </button>
            <button
              onClick={() => setActiveTab("code")}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5",
                activeTab === "code" ? "bg-cyan-500 text-white shadow-sm" : "text-zinc-400 hover:text-white"
              )}
            >
              <Code2 className="h-3.5 w-3.5" />
              <span>Código & Embed</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/studio">
              <Button size="sm" variant="glass" className="gap-2 text-xs rounded-xl border border-white/10">
                <Wand2 className="h-3.5 w-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Criar Seu Próprio Mundo</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-zinc-900/60 border border-white/10 backdrop-blur-md">
            <div className="flex items-center gap-1 rounded-xl bg-black/50 p-1 border border-white/5">
              <button
                onClick={() => setMode("desktop")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  mode === "desktop" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-zinc-400 hover:text-white"
                )}
              >
                <Monitor className="h-3.5 w-3.5" />
                <span>Desktop (16:9)</span>
              </button>
              <button
                onClick={() => setMode("mobile")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  mode === "mobile" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-zinc-400 hover:text-white"
                )}
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>Mobile (9:16)</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="glass"
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                className="gap-1.5 text-xs rounded-xl border border-white/10"
              >
                {isAutoPlaying ? <Pause className="h-3.5 w-3.5 text-amber-400" /> : <Play className="h-3.5 w-3.5 text-cyan-400" />}
                <span>{isAutoPlaying ? "Pausar Voo" : "Simular Scroll Contínuo"}</span>
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => engineRef.current?.scrollToProgress(0)}
                className="h-8 w-8 p-0 rounded-xl text-zinc-400 hover:text-white"
                title="Reiniciar para o início"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowOverlays(!showOverlays)}
                className={cn("text-xs rounded-xl gap-1", showOverlays ? "text-cyan-400" : "text-zinc-500")}
              >
                <Layers className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Cards de Texto</span>
              </Button>
            </div>
          </div>

          <div
            className={cn(
              "relative mx-auto w-full transition-all duration-300 bg-zinc-950 rounded-3xl border border-white/10 overflow-hidden shadow-2xl shadow-cyan-950/20 group",
              mode === "desktop" ? "aspect-video" : "max-w-[380px] aspect-[9/16]"
            )}
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            style={{ cursor: "grab" }}
          >
            <div ref={containerRef} className="absolute inset-0 w-full h-full" />

            {showOverlays && (
              <div className="pointer-events-none absolute inset-0 z-30 flex flex-col justify-between p-6 md:p-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 px-3.5 py-1.5 text-xs text-white">
                    <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="font-semibold tracking-wide">SAMSUNG S26 ULTRA</span>
                  </div>

                  <div className="rounded-full bg-black/60 backdrop-blur-xl border border-white/10 px-3 py-1 font-mono text-[11px] text-cyan-300">
                    {Math.round(globalProgress * 100)}% SCROLL
                  </div>
                </div>

                <div className="max-w-md bg-black/75 backdrop-blur-2xl border border-white/15 rounded-2xl p-5 shadow-2xl transition-all duration-300">
                  <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono uppercase tracking-wider mb-1">
                    <span>Scene {activeSceneIndex + 1} of {SAMSUNG_SCENES.length}</span>
                    <span>•</span>
                    <span>60 FPS GOP 8</span>
                  </div>
                  <h2 className="text-xl font-bold text-white tracking-tight">{currentScene.title}</h2>
                  <p className="text-xs text-zinc-300 mt-1 leading-relaxed">{currentScene.subtitle}</p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {currentScene.tags?.map((tag) => (
                      <Badge key={tag} variant="glass" className="text-[10px] bg-white/10 text-zinc-200 border-white/10">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="pointer-events-none absolute bottom-3 right-4 z-30 opacity-60 group-hover:opacity-100 transition-opacity">
              <span className="text-[11px] font-mono text-zinc-400 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
                Gire o scroll do mouse ou arraste
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
              <span>Linha do Tempo Espacial (0s → 4.04s)</span>
              <span className="text-cyan-400 font-semibold">{((globalProgress * 4.04)).toFixed(2)}s / 4.04s</span>
            </div>

            <input
              type="range"
              min="0"
              max="1"
              step="0.001"
              value={globalProgress}
              onChange={(e) => engineRef.current?.scrollToProgress(parseFloat(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-4">
          {activeTab === "preview" && (
            <div className="space-y-4 animate-in fade-in">
              <Card className="p-5 rounded-2xl bg-zinc-900/70 border-white/10 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Sliders className="h-4 w-4 text-cyan-400" />
                  <span>Física do Scroll & Interpolação</span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">Amortecimento Lerp (Damping):</span>
                    <span className="font-mono text-cyan-300">{dampingFactor}</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="0.40"
                    step="0.01"
                    value={dampingFactor}
                    onChange={(e) => setDampingFactor(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500">
                    <span>Sedoso / Cinematográfico (0.05)</span>
                    <span>Instantâneo (0.40)</span>
                  </div>
                </div>
              </Card>

              <Card className="p-5 rounded-2xl bg-zinc-900/70 border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Compass className="h-4 w-4 text-cyan-400" />
                  <span>Cenas da Viagem Contínua</span>
                </div>

                <div className="space-y-2">
                  {SAMSUNG_SCENES.map((scene, idx) => (
                    <button
                      key={scene.id}
                      onClick={() => {
                        const target = idx / (SAMSUNG_SCENES.length - 1);
                        engineRef.current?.scrollToProgress(target);
                      }}
                      className={cn(
                        "w-full text-left p-3 rounded-xl border transition-all text-xs flex items-center justify-between",
                        activeSceneIndex === idx
                          ? "bg-cyan-950/40 border-cyan-500/40 text-white"
                          : "bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200"
                      )}
                    >
                      <div className="space-y-0.5">
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          <span className={cn("h-1.5 w-1.5 rounded-full", activeSceneIndex === idx ? "bg-cyan-400" : "bg-zinc-600")} />
                          <span>{scene.title}</span>
                        </div>
                        <div className="text-[10px] text-zinc-400 truncate max-w-[200px]">{scene.subtitle}</div>
                      </div>
                      <Badge variant="glass" className="text-[9px] font-mono">
                        {idx === 0 ? "0%" : idx === 1 ? "50%" : "100%"}
                      </Badge>
                    </button>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {activeTab === "telemetry" && (
            <Card className="p-5 rounded-2xl bg-zinc-900/70 border-white/10 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Activity className="h-4 w-4 text-emerald-400" />
                  <span>Telemetria do Motor Gráfico</span>
                </div>
                <Badge variant="emerald" className="text-[10px] font-mono">60 FPS Hardware</Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-black/50 border border-white/5">
                  <div className="text-zinc-400 text-[10px]">FPS em Tempo Real:</div>
                  <strong className="text-emerald-400 font-mono text-base">{engineState?.fps || 60} FPS</strong>
                </div>
                <div className="p-3 rounded-xl bg-black/50 border border-white/5">
                  <div className="text-zinc-400 text-[10px]">Estado do Decodificador:</div>
                  <strong className="text-cyan-400 font-mono text-xs">{engineState?.isSeeking ? "BUSY (SEEKING)" : "READY (COALESCED)"}</strong>
                </div>
                <div className="p-3 rounded-xl bg-black/50 border border-white/5">
                  <div className="text-zinc-400 text-[10px]">Active DOM Video Nodes:</div>
                  <strong className="text-white font-mono">{engineState?.activeVideosInPool || 1} / 2</strong>
                </div>
                <div className="p-3 rounded-xl bg-black/50 border border-white/5">
                  <div className="text-zinc-400 text-[10px]">Cache In-Memory:</div>
                  <strong className="text-white font-mono">2.10 MB Blob</strong>
                </div>
              </div>
            </Card>
          )}

          {activeTab === "code" && (
            <Card className="p-5 rounded-2xl bg-zinc-900/70 border-white/10 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Code2 className="h-4 w-4 text-cyan-400" />
                  <span>Código de Incorporação (Embed)</span>
                </div>
                <Button
                  size="sm"
                  variant="glass"
                  onClick={() =>
                    handleCopyCode(
                      `<script src="http://localhost:3000/embed/scroll-world.js"></script>\n<scroll-world\n  src="/generated/videos/samsung_s26_desktop_gop8.mp4"\n  poster="/generated/stills/samsung_s26_scene1_start.png"\n  damping="0.18"\n></scroll-world>`
                    )
                  }
                  className="gap-1 text-[11px] h-7 px-2.5 rounded-lg"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Share2 className="h-3 w-3" />}
                  <span>{copied ? "Copiado!" : "Copiar"}</span>
                </Button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="text-zinc-400 font-mono text-[10px] mb-1">1. Web Component Universal (Qualquer HTML / CMS):</div>
                  <pre className="p-3 rounded-xl bg-black/80 border border-white/10 font-mono text-[10px] text-cyan-300 overflow-x-auto">
{`<script src="http://localhost:3000/embed/scroll-world.js"></script>

<scroll-world 
  src="/generated/videos/samsung_s26_desktop_gop8.mp4"
  poster="/generated/stills/samsung_s26_scene1_start.png"
  damping="0.18">
</scroll-world>`}
                  </pre>
                </div>

                <div>
                  <div className="text-zinc-400 font-mono text-[10px] mb-1">2. Componente React / Next.js:</div>
                  <pre className="p-3 rounded-xl bg-black/80 border border-white/10 font-mono text-[10px] text-zinc-300 overflow-x-auto">
{`import { ScrollWorldPlayer } from "@/components/player/ScrollWorldPlayer";

export default function MyPage() {
  return (
    <ScrollWorldPlayer
      scenes={SAMSUNG_SCENES}
      mode="desktop"
      dampingFactor={0.18}
    />
  );
}`}
                  </pre>
                </div>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
