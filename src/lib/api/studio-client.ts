import { StudioProject, GenerationTelemetryEvent, ArtStylePreset, CameraMotion } from "@/lib/types/studio";
import { SAMPLE_WORLDS } from "@/lib/data/sample-worlds";

export interface CreateProjectPayload {
  brandUrl?: string;
  promptDescription?: string;
  artStyle: ArtStylePreset;
  cameraMotion: CameraMotion;
  sceneCount?: number;
  aspectRatio?: "16:9" | "9:16";
}

export interface HealthCheckResponse {
  healthy: boolean;
  timestamp: string;
  checks: {
    gemini: { status: string; message: string; latencyMs?: number };
    monid: { status: string; hasApiKey: boolean; balanceUsd?: number; message: string };
    ffmpeg: { status: string; message: string };
    storage: { status: string; message: string };
  };
  errors: string[];
}

export class StudioClient {
  /**
   * Run pre-flight health check before any generation
   */
  static async checkSystemHealth(): Promise<HealthCheckResponse> {
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      return data;
    } catch (e: any) {
      return {
        healthy: false,
        timestamp: new Date().toISOString(),
        checks: {
          gemini: { status: "unhealthy", message: "Failed to query /api/health endpoint." },
          monid: { status: "unhealthy", hasApiKey: false, message: "Health check unreachable." },
          ffmpeg: { status: "unhealthy", message: "Health check unreachable." },
          storage: { status: "unhealthy", message: "Health check unreachable." },
        },
        errors: [`Health check failed: ${e?.message || e}`],
      };
    }
  }

  /**
   * Real AI generation pipeline with pre-flight check, intake, render orchestration, and SSE telemetry
   */
  static async startGenerationPipeline(
    payload: CreateProjectPayload,
    onTelemetry: (event: GenerationTelemetryEvent) => void
  ): Promise<StudioProject> {
    // 1. Pre-Flight Health Check
    const health = await this.checkSystemHealth();
    if (!health.healthy) {
      const issues = health.errors.length > 0 ? health.errors.join(" | ") : "One or more required services are unhealthy.";
      throw new Error(`Pre-flight health check failed: ${issues}`);
    }

    const sceneCount = payload.sceneCount || 4;

    onTelemetry({
      jobId: "init",
      projectId: "init",
      step: "scrape_brand",
      stepTitle: "Pre-Flight & Brand Intake",
      progress: 5,
      message: "Pre-flight checks passed. Initiating Google Gemini 3.6 Flash creative intake...",
      timestamp: Date.now(),
      totalScenes: sceneCount,
    });

    // 2. Call POST /api/intake
    const intakeRes = await fetch("/api/intake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: payload.brandUrl || undefined,
        prompt: payload.promptDescription || undefined,
        artStyle: payload.artStyle,
        cameraMotion: payload.cameraMotion,
        aspectRatio: payload.aspectRatio || "16:9",
        numScenes: sceneCount,
      }),
    });

    if (!intakeRes.ok) {
      const errText = await intakeRes.text();
      throw new Error(`Intake failed with status ${intakeRes.status}: ${errText}`);
    }

    const intakeData = await intakeRes.json();
    const createdProject = intakeData.data?.project || intakeData.project;
    if (!createdProject || !createdProject.id) {
      throw new Error(intakeData.error || intakeData.details || "Falha ao criar estrutura do projeto pelo Gemini 3.6 Flash.");
    }
    const projectId = createdProject.id;

    onTelemetry({
      jobId: "intake",
      projectId,
      step: "prompt_synthesis",
      stepTitle: "Google Gemini 3.6 Flash Narrative Script",
      progress: 15,
      message: `Sintetizadas ${createdProject.scenes?.length || sceneCount} cenas com contratos de movimento. Iniciando Render Orchestrator...`,
      timestamp: Date.now(),
      totalScenes: sceneCount,
    });

    // 3. Trigger Render Orchestrator POST /api/render/[id]
    const renderRes = await fetch(`/api/render/${projectId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "production",
        aspectRatio: payload.aspectRatio || "16:9",
      }),
    });

    if (!renderRes.ok) {
      const errText = await renderRes.text();
      throw new Error(`Render start failed with status ${renderRes.status}: ${errText}`);
    }

    const renderData = await renderRes.json();
    const jobId = renderData.data?.jobId || renderData.jobId;
    if (!jobId) {
      throw new Error(renderData.error || renderData.details || "Falha ao iniciar o Render Orchestrator.");
    }

    // 4. Stream real telemetry events via SSE (GET /api/sse/[id])
    return new Promise<StudioProject>((resolve, reject) => {
      const eventSource = new EventSource(`/api/sse/${jobId}`);

      eventSource.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data);

          let stepName: GenerationTelemetryEvent["step"] = "gemini_stills";
          if (event.stage === "STILLS_GENERATING" || event.stage === "STILLS_READY") {
            stepName = "gemini_stills";
          } else if (event.stage === "DIVES_GENERATING") {
            stepName = "monid_seedance_dives";
          } else if (event.stage === "BOUNDARIES_EXTRACTING") {
            stepName = "boundary_extraction";
          } else if (event.stage === "CONNECTORS_GENERATING") {
            stepName = "monid_seedance_dives";
          } else if (event.stage === "TRANSCODING") {
            stepName = "ffmpeg_gop_transcode";
          } else if (event.stage === "COMPLETED") {
            stepName = "ready";
          }

          onTelemetry({
            jobId,
            projectId,
            step: stepName,
            stepTitle: event.stageTitle || event.stage,
            progress: event.progress || 0,
            message: event.message || "",
            previewUrl: event.previewUrl,
            estimatedCostUsd: event.estimatedCostUsd,
            timestamp: event.timestamp || Date.now(),
            totalScenes: event.totalScenes || sceneCount,
          });

          if (event.stage === "COMPLETED") {
            eventSource.close();
            // Fetch latest project state
            fetch(`/api/projects/${projectId}`)
              .then((res) => res.json())
              .then((p) => {
                const dbProj = p.data || p.project || createdProject;
                const formatted: StudioProject = {
                  id: dbProj.id,
                  title: dbProj.title,
                  description: dbProj.description,
                  brandUrl: dbProj.brand?.url || payload.brandUrl,
                  artStyle: dbProj.artStyle,
                  cameraMotion: dbProj.cameraMotion,
                  status: (dbProj.status?.toLowerCase() as any) || "ready",
                  createdAt: String(dbProj.createdAt || new Date().toISOString()),
                  updatedAt: String(dbProj.updatedAt || new Date().toISOString()),
                  settings: {
                    aspectRatio: (dbProj.aspectRatio as any) || payload.aspectRatio || "16:9",
                    dampingFactor: dbProj.dampingFactor || 0.18,
                    lingerFactor: dbProj.lingerFactor || 0.3,
                    scrollSensitivity: dbProj.scrollSensitivity || 1.0,
                    enableAudio: dbProj.enableAudio || false,
                    themeColor: dbProj.brand?.accentColor || "#06b6d4",
                    fontFamily: "Plus Jakarta Sans",
                    showOverlayText: true,
                    showScrollIndicator: true,
                    showProgressDots: true,
                  },
                  scenes: (dbProj.scenes || []).map((s: any, idx: number) => ({
                    id: s.id || `scene-${idx}`,
                    index: s.order ?? idx,
                    title: s.title || `Scene ${idx + 1}`,
                    subtitle: s.subtitle || "",
                    description: s.description || "",
                    stillUrl: s.stillPosterUrl || "",
                    videoDesktopUrl: s.videoDesktopUrl || "",
                    videoMobileUrl: s.videoMobileUrl || "",
                    diveScrollPx: s.diveScrollPx || 1200,
                    lingerFactor: s.lingerFactor || 0.3,
                    duration: s.duration || 4.0,
                    ctaText: s.ctaText,
                    ctaUrl: s.ctaUrl,
                    tags: s.tags || [],
                  })),
                };
                resolve(formatted);
              })
              .catch(() => resolve(createdProject));
          } else if (event.stage === "FAILED" || event.error) {
            eventSource.close();
            reject(new Error(event.error || event.message || "Falha na execução do pipeline."));
          }
        } catch (parseErr) {
          console.error("SSE parse error:", parseErr);
        }
      };

      eventSource.onerror = (err) => {
        eventSource.close();
        // Check project status in DB as fallback
        fetch(`/api/projects/${projectId}`)
          .then((res) => res.json())
          .then((p) => {
            const dbProj = p.data || p.project;
            if (dbProj?.status === "READY") {
              resolve(dbProj);
            } else if (dbProj?.status === "FAILED") {
              reject(new Error("A geração falhou no servidor."));
            }
          })
          .catch(() => reject(new Error("Erro de conexão com o canal SSE.")));
      };
    });
  }

  static getProjects(): StudioProject[] {
    return this.getLocalProjects();
  }

  static getLocalProjects(): StudioProject[] {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("scrollworld_projects");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore
    }
    return [];
  }

  static saveProject(project: StudioProject): void {
    if (typeof window === "undefined") return;
    try {
      const existing = this.getLocalProjects();
      const idx = existing.findIndex((p) => p.id === project.id);
      let updated: StudioProject[];
      if (idx >= 0) {
        updated = [...existing];
        updated[idx] = project;
      } else {
        updated = [project, ...existing];
      }
      localStorage.setItem("scrollworld_projects", JSON.stringify(updated));
    } catch (e) {
      console.warn("Failed to persist project in local storage", e);
    }
  }

  static getProjectById(id: string): StudioProject | undefined {
    const list = this.getLocalProjects();
    return list.find((p) => p.id === id);
  }
}
