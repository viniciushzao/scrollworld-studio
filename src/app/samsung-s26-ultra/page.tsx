"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Sparkles,
  Zap,
  Cpu,
  Camera,
  Layers,
  ArrowRight,
  Check,
  Copy,
  Code2,
  Globe,
  Award,
  Smartphone,
  Box,
  FileCode,
  Gauge,
  Monitor,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const VIDEO_SRC = "/generated/videos/samsung_s26_desktop_gop8.mp4";
const POSTER_SRC = "/generated/stills/samsung_s26_scene1_start.png";

export default function ScrollWorldCaseStudyPage() {
  const scrollSectionRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [scrollProgress, setScrollProgress] = useState(0);
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const [activeCodeTab, setActiveCodeTab] = useState("web-component");

  useEffect(() => {
    let animationFrameId: number;
    let targetProgress = 0;
    let currentProgress = 0;

    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.playsInline = true;
    video.autoplay = false;
    video.pause();

    const unlockAudioVideo = () => {
      const p = video.play();
      if (p !== undefined) {
        p.then(() => video.pause()).catch(() => {});
      }
      window.removeEventListener("pointerdown", unlockAudioVideo);
      window.removeEventListener("wheel", unlockAudioVideo);
      window.removeEventListener("touchstart", unlockAudioVideo);
    };
    window.addEventListener("pointerdown", unlockAudioVideo, { passive: true });
    window.addEventListener("wheel", unlockAudioVideo, { passive: true });
    window.addEventListener("touchstart", unlockAudioVideo, { passive: true });

    const smoothFactor = 0.18;

    const tick = () => {
      if (!scrollSectionRef.current) return;
      const section = scrollSectionRef.current;
      const sectionTop = section.offsetTop || 56;
      const maxScroll = section.offsetHeight - window.innerHeight;
      if (maxScroll <= 0) return;

      const currentY = window.scrollY - sectionTop;
      targetProgress = Math.max(0, Math.min(1, currentY / maxScroll));

      const delta = targetProgress - currentProgress;

      if (Math.abs(delta) > 0.0001) {
        currentProgress += delta * smoothFactor;

        if (delta > 0 && currentProgress > targetProgress) currentProgress = targetProgress;
        if (delta < 0 && currentProgress < targetProgress) currentProgress = targetProgress;

        setScrollProgress(currentProgress);

        if (video && video.duration) {
          const targetTime = currentProgress * video.duration;
          if (Math.abs(video.currentTime - targetTime) > 0.005) {
            video.currentTime = targetTime;
          }
        }
      }
    };

    window.addEventListener("scroll", tick, { passive: true });
    tick();

    const renderLoop = () => {
      tick();
      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);

    return () => {
      window.removeEventListener("scroll", tick);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleCopyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(id);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  const codeSnippets = {
    webComponent: `<!-- 1. Adicione o player universal no <head> ou antes de </body> -->
<script src="https://cdn.scrollworld.studio/v1/scroll-world.min.js"></script>

<!-- 2. Cole a tag personalizada do seu mundo onde desejar na página -->
<scroll-world
  src="https://cdn.scrollworld.studio/worlds/galaxy-s26-ultra/manifest.json"
  damping="0.18"
  theme="dark"
  autoplay-drift="false"
></scroll-world>`,

    reactNext: `import { ScrollWorldPlayer } from "@scrollworld/react";
import "@scrollworld/react/styles.css";

export default function ProductLandingPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Hero Interativo Dirigido por Scroll */}
      <ScrollWorldPlayer
        worldId="galaxy-s26-ultra"
        damping={0.18}
        mode="desktop"
        showProgressPill={true}
        onSceneChange={(sceneIndex) => {
          console.log("Cena ativa:", sceneIndex);
        }}
      />

      {/* Continuação do seu site ou e-commerce */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <h2 className="text-4xl font-bold">Compre o Produto</h2>
        {/* Seus componentes comerciais aqui... */}
      </section>
    </main>
  );
}`,

    shopifyWebflow: `<!-- Integração para Shopify (Custom Liquid) ou Webflow (Embed Element) -->
<div style="position: relative; width: 100%; height: 350vh; background: #000;">
  <div style="position: sticky; top: 0; width: 100%; height: 100vh; overflow: hidden;">
    <video
      id="scroll-world-video"
      src="https://cdn.scrollworld.studio/videos/galaxy-s26-gop8.mp4"
      poster="https://cdn.scrollworld.studio/stills/galaxy-s26-start.png"
      muted
      playsinline
      preload="auto"
      style="width: 100%; height: 100%; object-fit: cover;"
    ></video>
  </div>
</div>

<script src="https://cdn.scrollworld.studio/v1/scroll-world.min.js"></script>
<script>
  ScrollWorld.mount("#scroll-world-video", { damping: 0.18 });
</script>`,

    apiIntegration: `// Geração programática de novos mundos via API REST
const response = await fetch("https://api.scrollworld.studio/v1/render", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({\n    brandUrl: "https://seusite.com/produto-exemplo",\n    artStyle: "photoreal-walkthrough",\n    cameraPacing: "cinematic-slow",\n    webhookUrl: "https://seusite.com/api/webhook/world-ready"\n  })\n});\n\nconst { jobId, manifestUrl } = await response.json();\nconsole.log("Mundo em renderização:", jobId, manifestUrl);`,
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-cyan-500/30 font-sans">
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/85 backdrop-blur-xl transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-zinc-400 hover:text-white transition-colors text-xs font-medium">
              ScrollWorld
            </Link>
            <span className="text-zinc-600">/</span>
            <span className="font-bold text-sm tracking-tight text-white flex items-center gap-2">
              Demonstração Real: Galaxy S26 Ultra
              <Badge variant="cyan" className="text-[9px] px-1.5 py-0">CASO REAL</Badge>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-6 text-xs text-zinc-400 font-medium">
            <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="hover:text-white transition-colors text-cyan-400">
              A Experiência
            </button>
            <button onClick={() => document.getElementById("deconstruction")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-white transition-colors">
              Como Foi Feito
            </button>
            <button onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-white transition-colors">
              Diferenciais
            </button>
            <button onClick={() => document.getElementById("how-to-implement")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-white transition-colors">
              Como Implementar
            </button>
            <button onClick={() => document.getElementById("code-embed")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-white transition-colors">
              Código Embed
            </button>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/studio">
              <Button size="sm" className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-full px-4 shadow-lg shadow-cyan-500/20 gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Criar no Studio</span>
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <section ref={scrollSectionRef} className="relative h-[350vh] bg-black">
        <div className="sticky top-14 h-[calc(100vh-3.5rem)] w-full overflow-hidden flex items-center justify-center bg-black">
          <video
            ref={videoRef}
            src={VIDEO_SRC}
            poster={POSTER_SRC}
            muted
            playsInline
            preload="auto"
            className="w-full h-full object-contain md:object-cover pointer-events-none"
          />

          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black via-transparent to-black/60" />

          <div
            className={cn(
              "absolute inset-0 flex flex-col justify-center items-center text-center p-6 transition-all duration-700 pointer-events-none",
              scrollProgress < 0.32 ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8"
            )}
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/15 px-4 py-1.5 text-xs text-zinc-200 mb-4">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <span>Titânio Aeroespacial Grau 5 • Acabamento Satin Matte</span>
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.08]">
              Galaxy S26 Ultra. <br />
              <span className="bg-gradient-to-r from-zinc-100 via-zinc-400 to-zinc-600 bg-clip-text text-transparent">
                Perfeição Esculpida em Titânio.
              </span>
            </h1>
            <p className="text-sm sm:text-lg text-zinc-400 max-w-xl mt-4 leading-relaxed">
              Estrutura ultrarresistente com nano revestimento antirreflexo e vidro Corning Gorilla Armor 2.
            </p>

            <div className="mt-8 flex items-center gap-2 text-xs font-mono text-zinc-500">
              <span className="animate-bounce">↓</span> Role para explorar os detalhes
            </div>
          </div>

          <div
            className={cn(
              "absolute inset-0 flex flex-col justify-end md:justify-center items-start p-6 md:p-16 transition-all duration-700 pointer-events-none",
              scrollProgress >= 0.35 && scrollProgress < 0.70 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            )}
          >
            <div className="max-w-lg bg-black/80 backdrop-blur-2xl border border-white/15 rounded-3xl p-6 md:p-8 shadow-2xl space-y-3 pointer-events-auto">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono uppercase tracking-wider">
                <Camera className="h-4 w-4" />
                <span>Matriz Óptica Quádrupla de 200MP</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Lentes de Safira com Zoom Periscópio 100x.
              </h2>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                Sensor ISOCELL com pixels de 0.6µm e estabilização OIS de eixo duplo. Capture cada detalhe em 8K 60fps com processamento de sinal em tempo real pelo Galaxy AI.
              </p>

              <div className="pt-2 flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full bg-white/10 text-[11px] text-zinc-200 border border-white/10">200 MP Principal f/1.7</span>
                <span className="px-3 py-1 rounded-full bg-white/10 text-[11px] text-zinc-200 border border-white/10">50 MP Periscópio 5x/10x</span>
                <span className="px-3 py-1 rounded-full bg-white/10 text-[11px] text-zinc-200 border border-white/10">12 MP Ultra-Wide</span>
              </div>
            </div>
          </div>

          <div
            className={cn(
              "absolute inset-0 flex flex-col justify-center items-center text-center p-6 transition-all duration-700 pointer-events-none",
              scrollProgress >= 0.72 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            )}
          >
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 px-4 py-1.5 text-xs text-cyan-300 font-mono">
                <Cpu className="h-3.5 w-3.5" />
                <span>Snapdragon 8 Elite Gen 2 for Galaxy</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Desempenho Sem Limites. <br />
                Inteligência Sem Fricção.
              </h2>
              <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
                Bateria de 5.500 mAh de silício-carbono com recarga de 65W e tela Dynamic AMOLED 2X de 3.000 nits.
              </p>

              <div className="pt-4 pointer-events-auto flex items-center justify-center gap-4">
                <Button
                  size="lg"
                  onClick={() => document.getElementById("deconstruction")?.scrollIntoView({ behavior: "smooth" })}
                  className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-8 rounded-full shadow-xl shadow-cyan-500/25 gap-2"
                >
                  <span>Ver Como Funciona por Dentro</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="absolute bottom-6 right-6 z-20 pointer-events-none hidden sm:flex items-center gap-2 rounded-full bg-black/70 backdrop-blur-md border border-white/10 px-3.5 py-1 text-[11px] font-mono text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>{(scrollProgress * 100).toFixed(0)}% da Experiência Espacial</span>
          </div>
        </div>
      </section>

      <section id="deconstruction" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <Badge variant="cyan" className="text-xs font-mono uppercase tracking-wider">
            Arquitetura por Trás da Experiência
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Você não viu um vídeo comum. <br />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Você navegou por um mundo espacial gerado por IA.
            </span>
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            Veja exatamente como a inteligência artificial generativa e o motor de 60 FPS do ScrollWorld criaram a experiência acima em minutos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-8 rounded-3xl bg-zinc-950/90 border-white/10 relative overflow-hidden group hover:border-cyan-500/40 transition-colors space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="text-xs font-mono text-cyan-400 uppercase">1. IA Generativa de Vídeo</div>
            <h3 className="text-2xl font-bold text-white">Voo Contínuo Sem Cortes</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              O modelo <strong>ByteDance Seedance 2.0</strong> gerou a trajetória física da câmera ao redor do celular em 1080p, criando uma transição orbital sem cortes secos ou descontinuidades visuais.
            </p>
            <div className="pt-2 text-[11px] font-mono text-zinc-400 border-t border-white/5">
              Modelo: <code className="text-cyan-300">dreamina-seedance-2-0</code> (Render Real)
            </div>
          </Card>

          <Card className="p-8 rounded-3xl bg-zinc-950/90 border-white/10 relative overflow-hidden group hover:border-purple-500/40 transition-colors space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Layers className="h-6 w-6" />
            </div>
            <div className="text-xs font-mono text-purple-400 uppercase">2. Engenharia de Mídia</div>
            <h3 className="text-2xl font-bold text-white">Transcodificação GOP 8</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              O pipeline do ScrollWorld processou o vídeo com alinhamento de quadros-chave a cada 8 frames (<code className="text-purple-300">-g 8</code>). Isso permite que a GPU busque qualquer frame em menos de 16ms sem congelamento.
            </p>
            <div className="pt-2 text-[11px] font-mono text-zinc-400 border-t border-white/5">
              Tamanho: <span className="text-purple-300 font-bold">2.10 MB</span> • Resposta: <span className="text-emerald-400 font-bold">&lt; 16ms</span>
            </div>
          </Card>

          <Card className="p-8 rounded-3xl bg-zinc-950/90 border-white/10 relative overflow-hidden group hover:border-emerald-500/40 transition-colors space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Gauge className="h-6 w-6" />
            </div>
            <div className="text-xs font-mono text-emerald-400 uppercase">3. Motor Web de Alta Performance</div>
            <h3 className="text-2xl font-bold text-white">Scrubbing Monotônico 60 FPS</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              O motor em JavaScript (&lt;12KB) executa a sincronização contínua com trava monotônica direcional. A rolagem do usuário controla a câmera com física de amortecimento, sem nenhum recuo ou micro-travamento.
            </p>
            <div className="pt-2 text-[11px] font-mono text-zinc-400 border-t border-white/5">
              Zero WebGL Pesado • Zero 3D Shader • 100% Nativo
            </div>
          </Card>
        </div>
      </section>

      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/10">
        <div className="max-w-3xl mb-16 space-y-4">
          <Badge variant="cyan" className="text-xs font-mono uppercase tracking-wider">
            Por que Escolher o ScrollWorld?
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            A nova era de páginas interativas de produtos.
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base">
            Esqueça modelos 3D lentos de 80MB que travam em smartphones. O ScrollWorld entrega qualidade de cinema com carregamento instantâneo.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="p-8 rounded-3xl bg-zinc-950 border-white/10 space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Award className="h-5 w-5 text-cyan-400" />
              <span>ScrollWorld vs 3D WebGL Tradicional</span>
            </h3>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-3 pb-3 border-b border-white/10 font-mono text-zinc-400 uppercase text-[11px]">
                <span>Critério</span>
                <span className="text-cyan-400 font-bold">ScrollWorld Studio</span>
                <span className="text-zinc-500">Three.js / WebGL 3D</span>
              </div>

              <div className="grid grid-cols-3 py-3 border-b border-white/5 items-center">
                <span className="text-zinc-400 font-medium">Peso do Download</span>
                <span className="text-emerald-400 font-bold">~ 2.1 MB (Vídeo GOP 8)</span>
                <span className="text-red-400 font-mono">40 MB – 120 MB (GLTF)</span>
              </div>

              <div className="grid grid-cols-3 py-3 border-b border-white/5 items-center">
                <span className="text-zinc-400 font-medium">Fluidez no Smartphone</span>
                <span className="text-emerald-400 font-bold">60 FPS Coplano Nativo</span>
                <span className="text-red-400 font-mono">15-30 FPS / Esquenta GPU</span>
              </div>

              <div className="grid grid-cols-3 py-3 border-b border-white/5 items-center">
                <span className="text-zinc-400 font-medium">Qualidade Visual</span>
                <span className="text-cyan-300 font-bold">Fotorrealismo de Cinema</span>
                <span className="text-zinc-400">Shaders e Polígonos Web</span>
              </div>

              <div className="grid grid-cols-3 py-3 border-b border-white/5 items-center">
                <span className="text-zinc-400 font-medium">Tempo de Criação</span>
                <span className="text-emerald-400 font-bold">Minutos (com IA)</span>
                <span className="text-zinc-400">Semanas de Modelagem 3D</span>
              </div>

              <div className="grid grid-cols-3 py-3 items-center">
                <span className="text-zinc-400 font-medium">Impacto no SEO (PageSpeed)</span>
                <span className="text-emerald-400 font-bold">Nota 95+ (Zero Atraso)</span>
                <span className="text-red-400 font-mono">Nota baixa (TBT alto)</span>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-6 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-2">
              <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Smartphone className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-white text-base">Mobile-First Nativo</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Transcodificações automáticas em 9:16 (GOP 4) para telas verticais de smartphones com insets seguros contra a barra de URL.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-2">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Zap className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-white text-base">Inércia Apple-Style</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Física de mola assintótica que desacelera a câmera suavemente ao parar a rolagem, sem nenhum recuo ou descontinuidade.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-2">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Code2 className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-white text-base">Embed Universal</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Funciona em qualquer plataforma: WordPress, Shopify, Webflow, React, Next.js, Vue ou HTML estático puro com 1 linha.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-2">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Globe className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-white text-base">CDN Global Otimizada</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Vídeos distribuídos em edge networks mundiais com suporte a HTTP/3 e carregamento em buffer de memória ultrarrápido.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="how-to-implement" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <Badge variant="cyan" className="text-xs font-mono uppercase tracking-wider">
            Fluxo de Implementação
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Como colocar um mundo no seu site em 3 passos.
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base">
            Qualquer equipe de produto, designer ou lojista consegue publicar sem precisar programar 3D.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="relative p-8 rounded-3xl bg-zinc-950 border border-white/10 space-y-4 group hover:border-cyan-500/30 transition-colors">
            <div className="h-10 w-10 rounded-full bg-cyan-500 text-black font-extrabold flex items-center justify-center text-sm shadow-lg shadow-cyan-500/30">
              1
            </div>
            <h3 className="text-xl font-bold text-white">Intake da Marca no Studio</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              No <strong>ScrollWorld Studio</strong>, insira a URL do seu produto ou descreva a identidade da marca. O <strong>Google Gemini 3.6 Flash</strong> cria os roteiros de cenas, estilo de câmera e paleta de cores automaticamente.
            </p>
          </div>

          <div className="relative p-8 rounded-3xl bg-zinc-950 border border-white/10 space-y-4 group hover:border-purple-500/30 transition-colors">
            <div className="h-10 w-10 rounded-full bg-purple-500 text-white font-extrabold flex items-center justify-center text-sm shadow-lg shadow-purple-500/30">
              2
            </div>
            <h3 className="text-xl font-bold text-white">Renderização Automatizada</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Nossa nuvem orquestra a geração dos stills 2K no <strong>Nano Banana</strong>, voo cinemático contínuo no <strong>ByteDance Seedance 2.0</strong> e transcodifica os formatos GOP 8 e GOP 4 para Desktop e Mobile.
            </p>
          </div>

          <div className="relative p-8 rounded-3xl bg-zinc-950 border border-white/10 space-y-4 group hover:border-emerald-500/30 transition-colors">
            <div className="h-10 w-10 rounded-full bg-emerald-500 text-black font-extrabold flex items-center justify-center text-sm shadow-lg shadow-emerald-500/30">
              3
            </div>
            <h3 className="text-xl font-bold text-white">Copie e Cole o Código</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Copie o Web Component <code>&lt;scroll-world&gt;</code> ou o pacote React. Cole no seu site (Shopify, WordPress, Webflow, Next.js) e seu produto passa a ser navegado por scroll imediatamente.
            </p>
          </div>
        </div>
      </section>

      <section id="code-embed" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/10">
        <div className="max-w-3xl mb-12 space-y-4">
          <Badge variant="cyan" className="text-xs font-mono uppercase tracking-wider">
            Integração Pronta
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Código Universal para o Seu Projeto
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base">
            Selecione a sua stack e copie o código pronto para publicar a mesma experiência acima no seu site.
          </p>
        </div>

        <Tabs defaultValue="web-component" className="w-full" onValueChange={setActiveCodeTab}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <TabsList className="bg-zinc-900 border border-white/10 p-1 rounded-2xl">
              <TabsTrigger value="web-component" className="gap-2 text-xs">
                <Globe className="h-3.5 w-3.5" />
                <span>Web Component (HTML / CMS)</span>
              </TabsTrigger>
              <TabsTrigger value="react" className="gap-2 text-xs">
                <FileCode className="h-3.5 w-3.5" />
                <span>React / Next.js</span>
              </TabsTrigger>
              <TabsTrigger value="shopify" className="gap-2 text-xs">
                <Box className="h-3.5 w-3.5" />
                <span>Shopify / Webflow</span>
              </TabsTrigger>
              <TabsTrigger value="api" className="gap-2 text-xs">
                <Code2 className="h-3.5 w-3.5" />
                <span>API REST / Backend</span>
              </TabsTrigger>
            </TabsList>

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const currentCode =
                  activeCodeTab === "web-component"
                    ? codeSnippets.webComponent
                    : activeCodeTab === "react"
                    ? codeSnippets.reactNext
                    : activeCodeTab === "shopify"
                    ? codeSnippets.shopifyWebflow
                    : codeSnippets.apiIntegration;
                handleCopyCode(currentCode, activeCodeTab);
              }}
              className="gap-2 text-xs border-white/15 bg-zinc-900 hover:bg-zinc-800"
            >
              {copiedTab === activeCodeTab ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Código Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copiar Código</span>
                </>
              )}
            </Button>
          </div>

          <TabsContent value="web-component" className="mt-0">
            <div className="relative rounded-3xl bg-zinc-950 border border-white/10 p-6 overflow-hidden">
              <div className="flex items-center justify-between text-xs text-zinc-500 font-mono border-b border-white/5 pb-3 mb-4">
                <span>index.html • Universal Web Component</span>
                <span>Tamanho: &lt; 12KB</span>
              </div>
              <pre className="text-xs sm:text-sm font-mono text-cyan-300 overflow-x-auto leading-relaxed">
                <code>{codeSnippets.webComponent}</code>
              </pre>
            </div>
          </TabsContent>

          <TabsContent value="react" className="mt-0">
            <div className="relative rounded-3xl bg-zinc-950 border border-white/10 p-6 overflow-hidden">
              <div className="flex items-center justify-between text-xs text-zinc-500 font-mono border-b border-white/5 pb-3 mb-4">
                <span>ProductHero.tsx • React 19 / Next.js 15 App Router</span>
                <span>TypeScript Strict</span>
              </div>
              <pre className="text-xs sm:text-sm font-mono text-purple-300 overflow-x-auto leading-relaxed">
                <code>{codeSnippets.reactNext}</code>
              </pre>
            </div>
          </TabsContent>

          <TabsContent value="shopify" className="mt-0">
            <div className="relative rounded-3xl bg-zinc-950 border border-white/10 p-6 overflow-hidden">
              <div className="flex items-center justify-between text-xs text-zinc-500 font-mono border-b border-white/5 pb-3 mb-4">
                <span>product-template.liquid / webflow-embed.html</span>
                <span>Zero Build Step</span>
              </div>
              <pre className="text-xs sm:text-sm font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                <code>{codeSnippets.shopifyWebflow}</code>
              </pre>
            </div>
          </TabsContent>

          <TabsContent value="api" className="mt-0">
            <div className="relative rounded-3xl bg-zinc-950 border border-white/10 p-6 overflow-hidden">
              <div className="flex items-center justify-between text-xs text-zinc-500 font-mono border-b border-white/5 pb-3 mb-4">
                <span>POST https://api.scrollworld.studio/v1/render</span>
                <span>Webhook Ready</span>
              </div>
              <pre className="text-xs sm:text-sm font-mono text-amber-300 overflow-x-auto leading-relaxed">
                <code>{codeSnippets.apiIntegration}</code>
              </pre>
            </div>
          </TabsContent>
        </Tabs>
      </section>

      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/10">
        <div className="relative rounded-3xl bg-gradient-to-br from-cyan-950/40 via-zinc-950 to-blue-950/30 border border-cyan-500/30 p-10 sm:p-16 overflow-hidden text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 px-4 py-1.5 text-xs text-cyan-400 font-mono">
            <Sparkles className="h-3.5 w-3.5" />
            <span>ScrollWorld Studio • Crie o Seu em Minutos</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight max-w-3xl mx-auto leading-tight">
            Pronto para transformar seu produto em uma experiência espacial?
          </h2>

          <p className="text-zinc-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Sem 3D pesado. Sem semanas de desenvolvimento. Apenas a sua marca, a inteligência artificial do Seedance 2.0 e 60 FPS de pura imersão.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/studio">
              <Button size="lg" className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold h-12 px-8 rounded-full shadow-xl shadow-cyan-500/25 gap-2 text-base">
                <Sparkles className="h-5 w-5" />
                <span>Criar Meu Mundo no Studio</span>
              </Button>
            </Link>

            <Link href="/example">
              <Button size="lg" variant="outline" className="border-white/15 bg-white/5 hover:bg-white/10 text-white font-semibold h-12 px-8 rounded-full gap-2 text-base">
                <Monitor className="h-5 w-5" />
                <span>Ver Lab de Telemetria</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-black py-12 px-4 sm:px-6 lg:px-8 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">ScrollWorld Studio</span>
            <span>•</span>
            <span>Motor de Scrubbing de Vídeo 60 FPS com IA Generativa</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/studio" className="hover:text-zinc-300">Studio IDE</Link>
            <Link href="/example" className="hover:text-zinc-300">Showcase</Link>
            <Link href="/" className="hover:text-zinc-300">Documentação</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
