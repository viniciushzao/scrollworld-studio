"use client";

import React, { useState, useEffect } from "react";
import { StudioProject, GenerationTelemetryEvent } from "@/lib/types/studio";
import { SceneMedia } from "@/lib/engine/types";
import { StudioClient } from "@/lib/api/studio-client";
import { OnboardingWizard } from "./OnboardingWizard";
import { SceneEditor } from "./SceneEditor";
import { DualPreview } from "./DualPreview";
import { TimelineControls } from "./TimelineControls";
import { ExportModal } from "./ExportModal";
import { GenerationTelemetry } from "./GenerationTelemetry";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Share2,
  ExternalLink,
  Plus,
  Layers,
  Wand2,
  Download,
  FolderOpen,
  CheckCircle2,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/lib/i18n/context";

export default function StudioPage() {
  const [projects, setProjects] = useState<StudioProject[]>([]);
  const [activeProject, setActiveProject] = useState<StudioProject | null>(null);
  const [selectedSceneIndex, setSelectedSceneIndex] = useState<number>(0);
  const [globalProgress, setGlobalProgress] = useState<number>(0);
  const { t } = useTranslation();

  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentTelemetry, setCurrentTelemetry] = useState<GenerationTelemetryEvent | null>(null);
  const [telemetryHistory, setTelemetryHistory] = useState<GenerationTelemetryEvent[]>([]);

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

    if (loaded && loaded.length > 0) {
      setProjects(loaded);
      setActiveProject(loaded[0]);
    } else {
      if (typeof window !== "undefined") {
        localStorage.removeItem("scrollworld_projects");
      }
      setProjects([]);
      setActiveProject(null);
      setIsWizardOpen(true);
    }
  }, []);

  const handleUpdateScenes = (updatedScenes: SceneMedia[]) => {
    if (!activeProject) return;
    const updatedProj: StudioProject = {
      ...activeProject,
      scenes: updatedScenes,
      updatedAt: new Date().toISOString(),
    };
    setActiveProject(updatedProj);
    StudioClient.saveProject(updatedProj);
  };

  const handleSelectProject = (proj: StudioProject) => {
    setActiveProject(proj);
    setSelectedSceneIndex(0);
    setGlobalProgress(0);
  };

  const handleWizardComplete = (newProject: StudioProject) => {
    setProjects((prev) => [newProject, ...prev]);
    setActiveProject(newProject);
    setSelectedSceneIndex(0);
    setIsWizardOpen(false);
    setIsGenerating(false);
  };

  const handleRegenerateProject = async () => {
    if (!activeProject) return;
    setIsGenerating(true);
    setTelemetryHistory([]);
    try {
      const updated = await StudioClient.startGenerationPipeline(
        {
          brandUrl: activeProject.brandUrl,
          promptDescription: activeProject.description,
          artStyle: activeProject.artStyle,
          cameraMotion: activeProject.cameraMotion,
          sceneCount: activeProject.scenes.length,
        },
        (telemetry) => {
          setCurrentTelemetry(telemetry);
          setTelemetryHistory((prev) => [...prev, telemetry]);
        }
      );
      setActiveProject(updated);
      StudioClient.saveProject(updated);
      setIsGenerating(false);
    } catch (e) {
      console.error(e);
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-zinc-950 text-foreground">
      <header className="h-14 border-b border-white/10 px-4 flex items-center justify-between bg-zinc-950/90 backdrop-blur-xl shrink-0 z-30">
        <div className="flex items-center gap-3">
          {activeProject ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-xl bg-zinc-900/90 border border-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 transition-colors">
                  <FolderOpen className="h-4 w-4 text-cyan-400" />
                  <span className="max-w-[200px] truncate">{activeProject.title}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72">
                <div className="p-2 text-[10px] font-mono text-zinc-500 uppercase">
                  Projetos Criados
                </div>
                {projects.map((proj) => (
                  <DropdownMenuItem
                    key={proj.id}
                    onClick={() => handleSelectProject(proj)}
                    className="flex items-center justify-between"
                  >
                    <div className="truncate">
                      <p className="font-medium text-white truncate">{proj.title}</p>
                      <p className="text-[10px] text-zinc-400">{proj.scenes.length} Scenes • {proj.artStyle}</p>
                    </div>
                    {proj.id === activeProject.id && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
                    )}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setIsWizardOpen(true)}
                  className="gap-2 text-cyan-400 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Criar Novo Projeto do Zero</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <span className="text-xs font-semibold text-zinc-400">Nenhum projeto selecionado</span>
          )}

          {activeProject && (
            <div className="hidden sm:flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] font-mono uppercase bg-cyan-950/40 text-cyan-400 border-cyan-500/30">
                {activeProject.artStyle}
              </Badge>
              <Badge variant="outline" className="text-[10px] font-mono uppercase bg-zinc-900 text-zinc-300">
                {activeProject.cameraMotion}
              </Badge>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsWizardOpen(true)}
            className="gap-1.5 h-8 text-xs border-white/15 hover:bg-white/10"
          >
            <Plus className="h-3.5 w-3.5 text-cyan-400" />
            <span>{t("studio.newWorld", "Novo Mundo")}</span>
          </Button>

          {activeProject && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerateProject}
              disabled={isGenerating}
              className="gap-1.5 h-8 text-xs border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/40"
            >
              <Wand2 className="h-3.5 w-3.5 animate-spin-slow" />
              <span>{isGenerating ? t("studio.generating", "Gerando...") : t("studio.resynthesize", "Ressintetizar com IA")}</span>
            </Button>
          )}

          {activeProject && (
            <a
              href={`/preview/${activeProject.id}`}
              target="_blank"
              rel="noreferrer"
            >
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-8 text-xs border-white/15 hover:bg-white/10"
              >
                <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
                <span className="hidden md:inline">{t("studio.fullPreview", "Full Preview")}</span>
              </Button>
            </a>
          )}

          {activeProject && (
            <Button
              size="sm"
              onClick={() => setIsExportModalOpen(true)}
              className="gap-1.5 h-8 text-xs shadow-md shadow-cyan-500/20"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{t("studio.exportEmbed", "Export & Embed")}</span>
            </Button>
          )}
        </div>
      </header>

      {isGenerating && currentTelemetry && (
        <div className="p-4 bg-zinc-950/90 border-b border-cyan-500/30 z-20">
          <GenerationTelemetry
            currentEvent={currentTelemetry}
            history={telemetryHistory}
          />
        </div>
      )}

      {activeProject ? (
        <div className="flex-1 flex overflow-hidden">
          <div className="w-80 md:w-96 shrink-0 h-full">
            <SceneEditor
              scenes={activeProject.scenes}
              selectedSceneIndex={selectedSceneIndex}
              onSelectScene={(idx) => {
                setSelectedSceneIndex(idx);
                const progress = idx / Math.max(1, activeProject.scenes.length - 1);
                setGlobalProgress(progress);
              }}
              onUpdateScenes={handleUpdateScenes}
            />
          </div>

          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="flex-1 relative overflow-hidden">
              <DualPreview
                key={activeProject.id}
                scenes={activeProject.scenes}
                settings={activeProject.settings}
                activeSceneIndex={selectedSceneIndex}
                onProgress={(p, sIdx) => {
                  setGlobalProgress(p);
                  setSelectedSceneIndex(sIdx);
                }}
                onSceneChange={(sIdx) => setSelectedSceneIndex(sIdx)}
              />
            </div>

            <TimelineControls
              scenes={activeProject.scenes}
              activeProgress={globalProgress}
              activeSceneIndex={selectedSceneIndex}
              settings={activeProject.settings}
              onProgressChange={(p) => setGlobalProgress(p)}
              onSettingsChange={(newSettings) => {
                const updated: StudioProject = {
                  ...activeProject,
                  settings: newSettings,
                };
                setActiveProject(updated);
                StudioClient.saveProject(updated);
              }}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div className="max-w-lg space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-cyan-500/20 via-blue-500/30 to-indigo-500/20 border border-cyan-500/30 flex items-center justify-center mx-auto shadow-2xl shadow-cyan-500/20">
              <Sparkles className="h-10 w-10 text-cyan-400 animate-pulse" />
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-extrabold text-white">Crie Seu Primeiro ScrollWorld do Zero</h2>
              <p className="text-sm text-zinc-400 leading-relaxed max-w-md mx-auto">
                Nenhum projeto pré-configurado carregado. Insira a URL da sua marca ou descreva sua visão para gerar do zero todos os stills 2K, vídeos contínuos de câmera e transições sem cortes.
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => setIsWizardOpen(true)}
              className="gap-2 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white font-semibold px-8 h-13 shadow-xl shadow-cyan-500/30 hover:scale-105 transition-all"
            >
              <Plus className="h-5 w-5" />
              <span>✨ Criar Meu Primeiro Mundo do Zero</span>
            </Button>
          </div>
        </div>
      )}

      {isWizardOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-4xl bg-zinc-950 border border-white/10 rounded-3xl p-2 shadow-2xl">
            <OnboardingWizard
              onComplete={handleWizardComplete}
              onCancel={projects.length > 0 ? () => setIsWizardOpen(false) : undefined}
            />
          </div>
        </div>
      )}

      {activeProject && (
        <ExportModal
          project={activeProject}
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
        />
      )}
    </div>
  );
}
