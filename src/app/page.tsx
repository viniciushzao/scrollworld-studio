"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/context";
import { StudioClient } from "@/lib/api/studio-client";
import { StudioProject } from "@/lib/types/studio";
import { ScrollWorldPlayer } from "@/components/player/ScrollWorldPlayer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Sparkles,
  ArrowRight,
  Zap,
  Cpu,
  Layers,
  Smartphone,
  CheckCircle2,
  Code2,
  Globe,
  Sliders,
  ShieldCheck,
  Video,
  Monitor,
  Plus,
} from "lucide-react";

export default function LandingPage() {
  const [userProjects, setUserProjects] = useState<StudioProject[]>([]);
  const [selectedProjectIndex, setSelectedProjectIndex] = useState(0);
  const { t } = useTranslation();

  useEffect(() => {
    const loaded = StudioClient.getProjects().filter(
      (p) =>
        p.id !== "demo-cyberpunk-dive" &&
        p.id !== "porsche-gt3-aero" &&
        p.id !== "vision-pro-odyssey" &&
        p.id !== "soneva-jani-lagoon" &&
        !p.title.toLowerCase().includes("porsche") &&
        !p.title.toLowerCase().includes("vision pro") &&
        !p.title.toLowerCase().includes("soneva")
    );
    setUserProjects(loaded);
  }, []);

  const activeProject = userProjects[selectedProjectIndex] || null;

  return (
    <div className="flex flex-col min-h-screen">
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-32 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-cyan-500/20 via-blue-500/15 to-purple-500/10 blur-[130px] pointer-events-none rounded-full" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-mono text-cyan-300 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{t("hero.tag", "ScrollWorld Studio v2.0 • Zero-Code Web Architect")}</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08]">
              {t("hero.headlineStart", "Turn Any Brand Into An")}{" "}
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                {t("hero.headlineHighlight", "Infinite 60 FPS")}
              </span>{" "}
              {t("hero.headlineEnd", "Scrubbable World.")}
            </h1>

            <p className="text-base sm:text-lg text-zinc-300 max-w-2xl mx-auto leading-relaxed">
              {t("hero.subtitle", "No code required. Google Gemini 3.6 Flash structures the narrative while Nano Banana 2 Lite synthesizes 2K boundary stills in 5 seconds, and Monid Seedance 2.0 chains seamless, frame-locked video dives with hardware-accelerated Blob seeking.")}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/studio">
                <Button size="lg" className="w-full sm:w-auto gap-2 text-base px-8 h-13 shadow-xl shadow-cyan-500/25">
                  <Sparkles className="h-5 w-5" />
                  <span>{activeProject ? "Abrir Studio IDE" : "Criar Meu Primeiro Mundo do Zero"}</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>

              <Link href="/example">
                <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2 text-base h-13 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10">
                  <Video className="h-4 w-4 text-cyan-400" />
                  <span>Ver Exemplo Real (Seedance 2.0)</span>
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-14 md:mt-20 max-w-5xl mx-auto">
            {activeProject ? (
              <div>
                {userProjects.length > 1 && (
                  <div className="flex items-center justify-between mb-4 px-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-zinc-400">MEUS PROJETOS:</span>
                      <div className="flex items-center gap-1.5">
                        {userProjects.map((world, idx) => (
                          <button
                            key={world.id}
                            onClick={() => setSelectedProjectIndex(idx)}
                            className={`px-3 py-1 rounded-xl text-xs font-medium transition-all ${
                              selectedProjectIndex === idx
                                ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/20"
                                : "bg-zinc-900/80 text-zinc-400 hover:text-white border border-white/5"
                            }`}
                          >
                            {world.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="relative rounded-3xl overflow-hidden border border-white/15 bg-zinc-950/80 shadow-2xl aspect-video max-h-[640px]">
                  <ScrollWorldPlayer
                    key={activeProject.id}
                    scenes={activeProject.scenes}
                    mode="desktop"
                    dampingFactor={0.18}
                    lingerEasePower={3.0}
                    showControls={true}
                    showDebugHud={false}
                    className="w-full h-full"
                  />
                </div>
              </div>
            ) : (
              <div className="relative rounded-3xl border border-dashed border-white/20 bg-zinc-950/60 p-12 text-center backdrop-blur-xl space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto text-cyan-400">
                  <Sparkles className="h-8 w-8" />
                </div>
                <div className="max-w-md mx-auto space-y-2">
                  <h3 className="text-xl font-bold text-white">Nenhum mundo pré-configurado</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Você está iniciando 100% do zero. Clique abaixo para abrir o Studio e gerar sua primeira experiência espacial com o pipeline real de IA.
                  </p>
                </div>
                <Link href="/studio">
                  <Button size="lg" className="gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 px-6">
                    <Plus className="h-4 w-4" />
                    <span>Iniciar Criação no Studio</span>
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-20 bg-zinc-950/60 border-t border-white/10 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <Badge variant="cyan">ENGINE ARCHITECTURE</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              {t("hero.architectureTitle", "Built on Industrial Spatial Computing Standards")}
            </h2>
            <p className="text-zinc-400 text-sm max-w-xl mx-auto">
              {t("hero.architectureSubtitle", "Every component is tuned for zero-latency seeking, extreme frame consistency, and Apple-grade smoothness.")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 bg-zinc-900/50 border-white/10 hover:border-cyan-500/30 transition-colors">
              <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 w-fit mb-4">
                <Cpu className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-white text-base mb-2">Google Gemini 3.6 Flash</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Intake inteligente de marca que estrutura narrativas imersivas e contratos de movimento em milissegundos.
              </p>
            </Card>

            <Card className="p-6 bg-zinc-900/50 border-white/10 hover:border-blue-500/30 transition-colors">
              <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400 w-fit mb-4">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-white text-base mb-2">Nano Banana 2 Lite 2K</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Sintetização paralela de quadros-chave 2K com isolamento de fundo sólido e iluminação física coerente.
              </p>
            </Card>

            <Card className="p-6 bg-zinc-900/50 border-white/10 hover:border-purple-500/30 transition-colors">
              <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 w-fit mb-4">
                <Video className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-white text-base mb-2">Monid Seedance 2.0</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Renderização de trajetórias contínuas de câmera com costura de quadros de fronteira sem cortes perceptíveis.
              </p>
            </Card>

            <Card className="p-6 bg-zinc-900/50 border-white/10 hover:border-emerald-500/30 transition-colors">
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 w-fit mb-4">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-white text-base mb-2">Transcodificação GOP 8 / GOP 4</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Compressão frame-accurate via FFmpeg com filtros de nitidez e desaceleração cúbica para leitura fluida.
              </p>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
