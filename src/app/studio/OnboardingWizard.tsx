"use client";

import React, { useState } from "react";
import { ArtStylePreset, CameraMotion, StudioProject } from "@/lib/types/studio";
import { StudioClient } from "@/lib/api/studio-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Globe,
  ArrowRight,
  ArrowLeft,
  Wand2,
  CheckCircle2,
  Cpu,
  Film,
  Zap,
  Palette,
  Compass,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";

interface OnboardingWizardProps {
  onComplete: (project: StudioProject) => void;
  onCancel?: () => void;
}

const ART_STYLES: { id: ArtStylePreset; label: string; desc: string; icon: any; color: string }[] = [
  {
    id: "minimalist-apple",
    label: "Apple Minimalist",
    desc: "Clean studio lighting, pristine reflections, ultra-sharp industrial textures, solid neutral backdrop.",
    icon: Sparkles,
    color: "from-zinc-400 to-zinc-600",
  },
  {
    id: "hyper-realistic",
    label: "Hyper-Realistic",
    desc: "Macro precision 8K octane render with extreme material details and cinematic ray tracing.",
    icon: Film,
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "luxury-editorial",
    label: "Luxury Editorial",
    desc: "Golden hour lighting, architectural warmth, velvety textures, and premium elegance.",
    icon: Palette,
    color: "from-amber-400 to-orange-500",
  },
  {
    id: "cyberpunk-neon",
    label: "Cyberpunk Neon",
    desc: "Volumetric neon atmospheric mist, holographic HUD overlays, and high-contrast night aesthetics.",
    icon: Zap,
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "cinematic-scifi",
    label: "Cinematic Sci-Fi",
    desc: "Deep space monoliths, titanium chambers, and dramatic anamorphic lens flares.",
    icon: Cpu,
    color: "from-cyan-500 to-indigo-600",
  },
  {
    id: "organic-nature",
    label: "Organic Nature",
    desc: "Pristine ocean currents, lush biometric flora, crystal clear water refractions.",
    icon: Globe,
    color: "from-emerald-400 to-teal-600",
  },
];

const CAMERA_MOTIONS: { id: CameraMotion; label: string; desc: string; icon: any }[] = [
  {
    id: "forward-dive",
    label: "Infinite Forward Dive",
    desc: "A continuous plunge straight through the core of each scene with frame-locked acceleration.",
    icon: ArrowRight,
  },
  {
    id: "orbital-pan",
    label: "360° Orbital Glide",
    desc: "Sweeping circular rotation showcasing all angles of the product or landscape.",
    icon: Compass,
  },
  {
    id: "macro-zoom",
    label: "Extreme Macro Zoom",
    desc: "Deep zoom into micro structures revealing microscopic craftsmanship.",
    icon: Wand2,
  },
  {
    id: "gentle-glide",
    label: "Slow Atmospheric Glide",
    desc: "Silky smooth cinematic tracking shot with gentle parallax depth.",
    icon: Layers,
  },
];

export function OnboardingWizard({ onComplete, onCancel }: OnboardingWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [inputType, setInputType] = useState<"url" | "prompt">("url");
  const [brandUrl, setBrandUrl] = useState("");
  const [promptDescription, setPromptDescription] = useState("");
  const [selectedStyle, setSelectedStyle] = useState<ArtStylePreset>("minimalist-apple");
  const [selectedCamera, setSelectedCamera] = useState<CameraMotion>("forward-dive");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationLog, setGenerationLog] = useState<string>("");
  const [generationProgress, setGenerationProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [healthStatus, setHealthStatus] = useState<any>(null);

  React.useEffect(() => {
    StudioClient.checkSystemHealth().then((res) => {
      setHealthStatus(res);
    });
  }, []);

  const handleStartGeneration = async () => {
    setErrorMessage(null);
    setIsGenerating(true);
    try {
      const project = await StudioClient.startGenerationPipeline(
        {
          brandUrl: inputType === "url" ? brandUrl : undefined,
          promptDescription: inputType === "prompt" ? promptDescription : undefined,
          artStyle: selectedStyle,
          cameraMotion: selectedCamera,
          sceneCount: 4,
        },
        (telemetry) => {
          setGenerationLog(`${telemetry.stepTitle}: ${telemetry.message}`);
          setGenerationProgress(telemetry.progress);
        }
      );
      StudioClient.saveProject(project);
      onComplete(project);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || "Ocorreu um erro durante a execução da geração.");
      setIsGenerating(false);
    }
  };

  const { t } = useTranslation();

  return (
    <div className="w-full max-w-4xl mx-auto p-6 md:p-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider">
            <Sparkles className="h-4 w-4" />
            <span>AI World Architect • Step {step} of 3</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mt-1">
            {step === 1 && t("wizard.step1Title", "Brand Discovery & Narrative Intent")}
            {step === 2 && t("wizard.step2Title", "Visual Art Style & Material Aesthetics")}
            {step === 3 && t("wizard.step3Title", "Camera Motion & Pacing Pipeline")}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                s === step
                  ? "w-8 bg-cyan-400"
                  : s < step
                  ? "w-4 bg-cyan-600"
                  : "w-4 bg-zinc-800"
              )}
            />
          ))}
        </div>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl border border-rose-500/40 bg-rose-950/40 text-rose-200 text-xs space-y-2 animate-in fade-in">
          <div className="flex items-center gap-2 font-semibold text-rose-300">
            <span className="h-2 w-2 rounded-full bg-rose-400 animate-ping" />
            <span>Falha na Execução do Pipeline Real</span>
          </div>
          <p className="font-mono text-[11px] leading-relaxed text-rose-200/90 break-words">{errorMessage}</p>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="flex rounded-2xl bg-zinc-900/90 p-1.5 border border-white/10 w-fit">
            <button
              onClick={() => setInputType("url")}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all",
                inputType === "url"
                  ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/25"
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              <Globe className="h-4 w-4" />
              <span>{t("wizard.tabUrl", "Brand URL Intake (Zero-Effort)")}</span>
            </button>
            <button
              onClick={() => setInputType("prompt")}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all",
                inputType === "prompt"
                  ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/25"
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              <Wand2 className="h-4 w-4" />
              <span>{t("wizard.tabPrompt", "1-Line Text Prompt")}</span>
            </button>
          </div>

          {inputType === "url" ? (
            <div className="space-y-3">
              <label className="text-sm font-medium text-zinc-300">
                {t("wizard.urlLabel", "Enter your product or brand website URL")}
              </label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                <Input
                  value={brandUrl}
                  onChange={(e) => setBrandUrl(e.target.value)}
                  placeholder="https://suamarca.com/produto ou https://seusite.com.br"
                  className="pl-12 h-14 text-base rounded-2xl bg-zinc-900/90 border-white/15 focus-visible:ring-cyan-500"
                />
              </div>
              <p className="text-xs text-zinc-400">
                {t("wizard.urlHelp", "Google Gemini 3.6 Flash will instantly analyze colors, value propositions, key features, and typography hierarchy.")}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="text-sm font-medium text-zinc-300">
                {t("wizard.promptLabel", "Describe the world, product, or experience you want to build")}
              </label>
              <Textarea
                value={promptDescription}
                onChange={(e) => setPromptDescription(e.target.value)}
                placeholder="e.g. A hyper-futuristic electric hydrofoil yacht gliding over midnight bioluminescent waters with titanium hydrofoils and holographic cockpit..."
                className="min-h-[140px] text-sm rounded-2xl bg-zinc-900/90 border-white/15 p-4"
              />
              <p className="text-xs text-zinc-400">
                {t("wizard.promptHelp", "Describe materials, atmosphere, key features, or mood.")}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between pt-6 border-t border-white/10">
            {onCancel ? (
              <Button variant="ghost" onClick={onCancel}>
                {t("wizard.cancel", "Cancel")}
              </Button>
            ) : <div />}
            <Button
              size="lg"
              onClick={() => setStep(2)}
              disabled={inputType === "url" ? !brandUrl.trim() : !promptDescription.trim()}
              className="gap-2"
            >
              <span>{t("wizard.continueToArt", "Continue to Art Style")}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <p className="text-sm text-zinc-400">
            {t("wizard.step2Desc", "Choose the visual rendering engine style and lighting atmosphere for Nano Banana 2 Lite stills.")}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ART_STYLES.map((style) => {
              const isSelected = selectedStyle === style.id;
              const Icon = style.icon;
              return (
                <div
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={cn(
                    "cursor-pointer rounded-2xl p-5 border transition-all duration-200 relative overflow-hidden flex flex-col justify-between group",
                    isSelected
                      ? "border-cyan-500 bg-cyan-950/20 shadow-lg shadow-cyan-500/15"
                      : "border-white/10 bg-zinc-900/60 hover:bg-zinc-900/90 hover:border-white/20"
                  )}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={cn("p-2.5 rounded-xl bg-gradient-to-br text-white", style.color)}>
                        <Icon className="h-5 w-5" />
                      </div>
                      {isSelected && <CheckCircle2 className="h-5 w-5 text-cyan-400" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-base">{style.label}</h3>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{style.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-white/10">
            <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span>{t("wizard.back", "Back")}</span>
            </Button>
            <Button size="lg" onClick={() => setStep(3)} className="gap-2">
              <span>{t("wizard.continueToMotion", "Continue to Camera & Motion")}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <p className="text-sm text-zinc-400">
            {t("wizard.step3Desc", "Select the camera choreography applied across Monid Seedance 2.0 video generation.")}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CAMERA_MOTIONS.map((motion) => {
              const isSelected = selectedCamera === motion.id;
              const Icon = motion.icon;
              return (
                <div
                  key={motion.id}
                  onClick={() => setSelectedCamera(motion.id)}
                  className={cn(
                    "cursor-pointer rounded-2xl p-5 border transition-all duration-200 relative overflow-hidden flex items-start gap-4 group",
                    isSelected
                      ? "border-cyan-500 bg-cyan-950/20 shadow-lg shadow-cyan-500/15"
                      : "border-white/10 bg-zinc-900/60 hover:bg-zinc-900/90 hover:border-white/20"
                  )}
                >
                  <div className="p-3 rounded-xl bg-white/10 text-cyan-400 shrink-0">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-white text-base">{motion.label}</h3>
                      {isSelected && <CheckCircle2 className="h-4 w-4 text-cyan-400" />}
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{motion.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 rounded-2xl border border-white/10 bg-zinc-950/80 backdrop-blur-md text-xs text-zinc-400 space-y-3">
            <div className="flex items-center justify-between text-zinc-200 font-semibold">
              <span className="flex items-center gap-1.5">
                <Cpu className="h-4 w-4 text-cyan-400" />
                <span>Status Pré-Voo & Matriz de Produção Real</span>
              </span>
              <Badge variant={healthStatus?.healthy ? "cyan" : "outline"} className={healthStatus?.healthy ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-amber-500/20 text-amber-300 border-amber-500/30"}>
                {healthStatus?.healthy ? "🟢 Sistema 100% Saudável" : "🟡 Verificando Saúde..."}
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
              <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                <div className="text-zinc-400 text-[10px]">Gemini 3.6 Flash / Nano Banana:</div>
                <strong className={healthStatus?.checks?.gemini?.status === "healthy" ? "text-emerald-400" : "text-amber-400"}>
                  {healthStatus?.checks?.gemini?.status === "healthy" ? "✓ Conectado (2K)" : "Pendente"}
                </strong>
              </div>
              <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                <div className="text-zinc-400 text-[10px]">Monid Seedance 2.0:</div>
                <strong className={healthStatus?.checks?.monid?.status === "healthy" ? "text-emerald-400" : "text-amber-400"}>
                  {healthStatus?.checks?.monid?.balanceUsd ? `$${healthStatus.checks.monid.balanceUsd.toFixed(2)} USD` : "✓ Autenticado"}
                </strong>
              </div>
              <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                <div className="text-zinc-400 text-[10px]">FFmpeg Local:</div>
                <strong className={healthStatus?.checks?.ffmpeg?.status === "healthy" ? "text-emerald-400" : "text-rose-400"}>
                  {healthStatus?.checks?.ffmpeg?.status === "healthy" ? "✓ GOP 8/4 Ativo" : "Binário Ausente"}
                </strong>
              </div>
              <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                <div className="text-zinc-400 text-[10px]">Armazenamento:</div>
                <strong className={healthStatus?.checks?.storage?.status === "healthy" ? "text-emerald-400" : "text-rose-400"}>
                  {healthStatus?.checks?.storage?.status === "healthy" ? "✓ Gravável" : "Erro de Permissão"}
                </strong>
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="p-4 rounded-2xl border border-rose-500/40 bg-rose-950/40 text-rose-200 text-xs space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 font-semibold text-rose-300">
                <span className="h-2 w-2 rounded-full bg-rose-400 animate-ping" />
                <span>Falha na Execução do Pipeline Real</span>
              </div>
              <p className="font-mono text-[11px] leading-relaxed text-rose-200/90 break-words">{errorMessage}</p>
            </div>
          )}

          {isGenerating && (
            <div className="p-5 rounded-2xl border border-cyan-500/30 bg-cyan-950/30 backdrop-blur-lg space-y-3 animate-pulse">
              <div className="flex items-center justify-between text-xs text-cyan-300 font-mono">
                <span>{t("wizard.pipelineActive", "GENERATION PIPELINE ACTIVE")}</span>
                <span>{generationProgress}%</span>
              </div>
              <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 transition-all duration-300"
                  style={{ width: `${generationProgress}%` }}
                />
              </div>
              <p className="text-xs text-zinc-300 font-mono">{generationLog || "Starting workers..."}</p>
            </div>
          )}

          <div className="flex items-center justify-between pt-6 border-t border-white/10">
            <Button variant="outline" onClick={() => setStep(2)} disabled={isGenerating} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span>{t("wizard.back", "Back")}</span>
            </Button>
            <Button
              size="lg"
              onClick={handleStartGeneration}
              disabled={isGenerating}
              className="gap-2 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 shadow-xl shadow-cyan-500/30"
            >
              <Wand2 className="h-5 w-5 animate-spin-slow" />
              <span>{isGenerating ? t("wizard.generatingButton", "Generating World Pipeline...") : t("wizard.generateButton", "Generate ScrollWorld (6s Previz)")}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
