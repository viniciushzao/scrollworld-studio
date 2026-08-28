/**
 * Resilient Database Repository Layer for ScrollWorld Studio
 * Transparently integrates with Prisma PostgreSQL and provides an in-memory
 * fallback store when database is offline or uninitialized during local development.
 */

import { prisma } from "./prisma";
import {
  CreateProjectInput,
  UpdateProjectInput,
} from "@/lib/types/api";
import { PipelineStage, LogLevel } from "@/lib/queue/types";

export interface DBBrand {
  id: string;
  name: string;
  url?: string | null;
  logoUrl?: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  typography: string;
  toneOfVoice?: string | null;
  keywords: string[];
  industry?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DBVideoClip {
  id: string;
  sceneId: string;
  type: "DIVE" | "CONNECTOR" | "AMBIENT";
  resolution: string;
  aspectRatio: string;
  format: string;
  url: string;
  blobStoragePath?: string | null;
  duration: number;
  keyint: number;
  crf: number;
  sourceStartFrame?: string | null;
  sourceEndFrame?: string | null;
  ssimScore?: number | null;
  psnrScore?: number | null;
  status: "PENDING" | "PROCESSING" | "READY" | "FAILED";
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface DBScene {
  id: string;
  projectId: string;
  order: number;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  prompt: string;
  cameraMovement: string;
  focalPoint?: string | null;
  stillPosterUrl?: string | null;
  stillPrompt?: string | null;
  knockoutUrl?: string | null;
  videoDesktopUrl?: string | null;
  videoMobileUrl?: string | null;
  diveScrollPx: number;
  lingerFactor: number;
  duration: number;
  status: "PENDING" | "GENERATING" | "READY" | "FAILED";
  ctaText?: string | null;
  ctaUrl?: string | null;
  tags: string[];
  metadata?: any;
  videoClips?: DBVideoClip[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DBJobLog {
  id: string;
  jobId: string;
  level: LogLevel;
  stage: string;
  message: string;
  metadata?: any;
  timestamp: Date;
}

export interface DBGenerationJob {
  id: string;
  projectId: string;
  type: "FULL_PIPELINE" | "INTAKE" | "STILLS" | "DIVES" | "CONNECTORS" | "TRANSCODE";
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";
  currentStage: PipelineStage | string;
  progress: number;
  estimatedCostUsd: number;
  totalTokensUsed: number;
  activeSceneIndex?: number | null;
  totalScenes: number;
  previewUrl?: string | null;
  error?: string | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
  logs?: DBJobLog[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DBProject {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  status: "DRAFT" | "GENERATING" | "READY" | "FAILED";
  artStyle: string;
  cameraMotion: string;
  aspectRatio: string;
  dampingFactor: number;
  lingerFactor: number;
  scrollSensitivity: number;
  enableAudio: boolean;
  audioUrl?: string | null;
  settings?: any;
  metadata?: any;
  brandId?: string | null;
  brand?: DBBrand | null;
  scenes: DBScene[];
  generationJobs?: DBGenerationJob[];
  createdAt: Date;
  updatedAt: Date;
}

class InMemoryStore {
  public projects = new Map<string, DBProject>();
  public jobs = new Map<string, DBGenerationJob>();
  public logs = new Map<string, DBJobLog[]>();

  constructor() {}
}

declare global {
  var inMemoryStoreGlobal: InMemoryStore | undefined;
}

const memoryStore = globalThis.inMemoryStoreGlobal ?? new InMemoryStore();
if (process.env.NODE_ENV !== "production") {
  globalThis.inMemoryStoreGlobal = memoryStore;
}

function generateSlug(title: string): string {
  const clean = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${clean}-${Math.random().toString(36).substring(2, 7)}`;
}

export class ProjectRepository {
  static async list(params?: { status?: string; limit?: number }): Promise<DBProject[]> {
    try {
      if (process.env.DATABASE_URL) {
        const dbProjects = await prisma.project.findMany({
          where: params?.status ? { status: params.status as any } : undefined,
          include: {
            brand: true,
            scenes: {
              orderBy: { order: "asc" },
              include: { videoClips: true },
            },
            generationJobs: {
              take: 1,
              orderBy: { createdAt: "desc" },
            },
          },
          orderBy: { createdAt: "desc" },
          take: params?.limit || 50,
        });

        if (dbProjects.length > 0) {
          return dbProjects as unknown as DBProject[];
        }
      }
    } catch {
      // Graceful fallback to memory store
    }

    const list: DBProject[] = [];
    const seenIds = new Set<string>();
    for (const project of memoryStore.projects.values()) {
      if (!seenIds.has(project.id)) {
        seenIds.add(project.id);
        if (!params?.status || project.status === params.status) {
          list.push(project);
        }
      }
    }

    return list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  static async findByIdOrSlug(idOrSlug: string): Promise<DBProject | null> {
    try {
      if (process.env.DATABASE_URL) {
        const dbProject = await prisma.project.findFirst({
          where: {
            OR: [{ id: idOrSlug }, { slug: idOrSlug }],
          },
          include: {
            brand: true,
            scenes: {
              orderBy: { order: "asc" },
              include: { videoClips: true },
            },
            generationJobs: {
              take: 5,
              orderBy: { createdAt: "desc" },
              include: { logs: { orderBy: { timestamp: "desc" }, take: 20 } },
            },
          },
        });

        if (dbProject) {
          return dbProject as unknown as DBProject;
        }
      }
    } catch {
      // Fallback
    }

    return memoryStore.projects.get(idOrSlug) || null;
  }

  static async create(input: CreateProjectInput): Promise<DBProject> {
    const slug = generateSlug(input.title);
    const projectId = `proj_${Math.random().toString(36).substring(2, 11)}`;

    let brandRecord: DBBrand | null = null;
    if (input.brand) {
      brandRecord = {
        id: `brand_${Math.random().toString(36).substring(2, 11)}`,
        name: input.brand.name,
        url: input.brand.url,
        logoUrl: input.brand.logoUrl,
        primaryColor: input.brand.primaryColor || "#6366f1",
        secondaryColor: input.brand.secondaryColor || "#a855f7",
        accentColor: input.brand.accentColor || "#ec4899",
        typography: input.brand.typography || "Inter, sans-serif",
        toneOfVoice: input.brand.toneOfVoice,
        keywords: input.brand.keywords || [],
        industry: input.brand.industry,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    const scenes: DBScene[] = (input.scenes || []).map((s, idx) => ({
      id: `scene_${Math.random().toString(36).substring(2, 11)}`,
      projectId: projectId,
      order: s.order ?? idx,
      title: s.title,
      subtitle: s.subtitle,
      description: s.description,
      prompt: s.prompt,
      cameraMovement: s.cameraMovement || input.cameraMotion || "forward-dive",
      focalPoint: s.focalPoint,
      stillPosterUrl: s.stillPosterUrl,
      knockoutUrl: s.knockoutUrl,
      videoDesktopUrl: s.videoDesktopUrl,
      videoMobileUrl: s.videoMobileUrl,
      diveScrollPx: s.diveScrollPx ?? 1200,
      lingerFactor: s.lingerFactor ?? 0.3,
      duration: s.duration ?? 4.0,
      status: (s.stillPosterUrl && s.videoDesktopUrl ? "READY" : "PENDING") as any,
      ctaText: s.ctaText,
      ctaUrl: s.ctaUrl,
      tags: s.tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const project: DBProject = {
      id: projectId,
      title: input.title,
      slug: slug,
      description: input.description,
      status: "DRAFT",
      artStyle: input.artStyle || "hyper-realistic",
      cameraMotion: input.cameraMotion || "forward-dive",
      aspectRatio: input.aspectRatio || "16:9",
      dampingFactor: input.dampingFactor ?? 0.18,
      lingerFactor: input.lingerFactor ?? 0.3,
      scrollSensitivity: input.scrollSensitivity ?? 1.0,
      enableAudio: input.enableAudio ?? false,
      audioUrl: input.audioUrl,
      brandId: brandRecord?.id,
      brand: brandRecord,
      scenes: scenes,
      generationJobs: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      if (process.env.DATABASE_URL) {
        const created = await prisma.project.create({
          data: {
            id: project.id,
            title: project.title,
            slug: project.slug,
            description: project.description,
            status: project.status as any,
            artStyle: project.artStyle,
            cameraMotion: project.cameraMotion,
            aspectRatio: project.aspectRatio,
            dampingFactor: project.dampingFactor,
            lingerFactor: project.lingerFactor,
            scrollSensitivity: project.scrollSensitivity,
            enableAudio: project.enableAudio,
            audioUrl: project.audioUrl,
            brand: brandRecord
              ? {
                  create: {
                    id: brandRecord.id,
                    name: brandRecord.name,
                    url: brandRecord.url,
                    logoUrl: brandRecord.logoUrl,
                    primaryColor: brandRecord.primaryColor,
                    secondaryColor: brandRecord.secondaryColor,
                    accentColor: brandRecord.accentColor,
                    typography: brandRecord.typography,
                    toneOfVoice: brandRecord.toneOfVoice,
                    keywords: brandRecord.keywords,
                    industry: brandRecord.industry,
                  },
                }
              : undefined,
            scenes: {
              create: scenes.map((s) => ({
                id: s.id,
                order: s.order,
                title: s.title,
                subtitle: s.subtitle,
                description: s.description,
                prompt: s.prompt,
                cameraMovement: s.cameraMovement,
                focalPoint: s.focalPoint,
                stillPosterUrl: s.stillPosterUrl,
                knockoutUrl: s.knockoutUrl,
                videoDesktopUrl: s.videoDesktopUrl,
                videoMobileUrl: s.videoMobileUrl,
                diveScrollPx: s.diveScrollPx,
                lingerFactor: s.lingerFactor,
                duration: s.duration,
                status: s.status as any,
                ctaText: s.ctaText,
                ctaUrl: s.ctaUrl,
                tags: s.tags,
              })),
            },
          },
          include: { brand: true, scenes: true },
        });

        memoryStore.projects.set(created.id, created as unknown as DBProject);
        memoryStore.projects.set(created.slug, created as unknown as DBProject);
        return created as unknown as DBProject;
      }
    } catch {
      // Fallback
    }

    memoryStore.projects.set(project.id, project);
    memoryStore.projects.set(project.slug, project);
    return project;
  }

  static async update(id: string, input: UpdateProjectInput): Promise<DBProject | null> {
    const existing = await this.findByIdOrSlug(id);
    if (!existing) return null;

    const updated: DBProject = {
      ...existing,
      title: input.title ?? existing.title,
      description: input.description !== undefined ? input.description : existing.description,
      artStyle: input.artStyle ?? existing.artStyle,
      cameraMotion: input.cameraMotion ?? existing.cameraMotion,
      aspectRatio: input.aspectRatio ?? existing.aspectRatio,
      dampingFactor: input.dampingFactor ?? existing.dampingFactor,
      lingerFactor: input.lingerFactor ?? existing.lingerFactor,
      scrollSensitivity: input.scrollSensitivity ?? existing.scrollSensitivity,
      enableAudio: input.enableAudio ?? existing.enableAudio,
      audioUrl: input.audioUrl !== undefined ? input.audioUrl : existing.audioUrl,
      status: (input.status as any) ?? existing.status,
      updatedAt: new Date(),
    };

    if (input.brand && updated.brand) {
      updated.brand = {
        ...updated.brand,
        ...input.brand,
        updatedAt: new Date(),
      };
    }

    if (input.scenes) {
      updated.scenes = input.scenes.map((s, idx) => ({
        id: s.id || `scene_${Math.random().toString(36).substring(2, 11)}`,
        projectId: existing.id,
        order: s.order ?? idx,
        title: s.title,
        subtitle: s.subtitle,
        description: s.description,
        prompt: s.prompt,
        cameraMovement: s.cameraMovement || updated.cameraMotion,
        focalPoint: s.focalPoint,
        stillPosterUrl: s.stillPosterUrl,
        knockoutUrl: s.knockoutUrl,
        videoDesktopUrl: s.videoDesktopUrl,
        videoMobileUrl: s.videoMobileUrl,
        diveScrollPx: s.diveScrollPx ?? 1200,
        lingerFactor: s.lingerFactor ?? 0.3,
        duration: s.duration ?? 4.0,
        status: (s.stillPosterUrl && s.videoDesktopUrl ? "READY" : "PENDING") as any,
        ctaText: s.ctaText,
        ctaUrl: s.ctaUrl,
        tags: s.tags || [],
        createdAt: existing.scenes.find((x) => x.id === s.id)?.createdAt || new Date(),
        updatedAt: new Date(),
      }));
    }

    try {
      if (process.env.DATABASE_URL) {
        await prisma.project.update({
          where: { id: existing.id },
          data: {
            title: updated.title,
            description: updated.description,
            artStyle: updated.artStyle,
            cameraMotion: updated.cameraMotion,
            aspectRatio: updated.aspectRatio,
            dampingFactor: updated.dampingFactor,
            lingerFactor: updated.lingerFactor,
            scrollSensitivity: updated.scrollSensitivity,
            enableAudio: updated.enableAudio,
            audioUrl: updated.audioUrl,
            status: updated.status as any,
          },
        });
      }
    } catch {
      // Fallback
    }

    memoryStore.projects.set(existing.id, updated);
    memoryStore.projects.set(existing.slug, updated);
    return updated;
  }

  static async delete(id: string): Promise<boolean> {
    const existing = await this.findByIdOrSlug(id);
    if (!existing) return false;

    try {
      if (process.env.DATABASE_URL) {
        await prisma.project.delete({ where: { id: existing.id } });
      }
    } catch {
      // Fallback
    }

    memoryStore.projects.delete(existing.id);
    memoryStore.projects.delete(existing.slug);
    return true;
  }
}

export class JobRepository {
  static async createJob(
    projectId: string,
    type: "FULL_PIPELINE" | "INTAKE" | "STILLS" | "DIVES" | "CONNECTORS" | "TRANSCODE" = "FULL_PIPELINE",
    totalScenes: number = 6
  ): Promise<DBGenerationJob> {
    const job: DBGenerationJob = {
      id: `job_${Math.random().toString(36).substring(2, 11)}`,
      projectId: projectId,
      type: type,
      status: "RUNNING",
      currentStage: "STILLS_GENERATING",
      progress: 0.0,
      estimatedCostUsd: 0.0,
      totalTokensUsed: 0,
      totalScenes: totalScenes,
      startedAt: new Date(),
      logs: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      if (process.env.DATABASE_URL) {
        await prisma.generationJob.create({
          data: {
            id: job.id,
            projectId: job.projectId,
            type: job.type as any,
            status: job.status as any,
            currentStage: job.currentStage,
            progress: job.progress,
            totalScenes: job.totalScenes,
            startedAt: job.startedAt,
          },
        });
      }
    } catch {
      // Fallback
    }

    memoryStore.jobs.set(job.id, job);
    memoryStore.logs.set(job.id, []);
    return job;
  }

  static async findById(jobId: string): Promise<DBGenerationJob | null> {
    try {
      if (process.env.DATABASE_URL) {
        const dbJob = await prisma.generationJob.findUnique({
          where: { id: jobId },
          include: { logs: { orderBy: { timestamp: "desc" }, take: 50 } },
        });
        if (dbJob) return dbJob as unknown as DBGenerationJob;
      }
    } catch {
      // Fallback
    }

    const job = memoryStore.jobs.get(jobId);
    if (!job) return null;

    job.logs = memoryStore.logs.get(jobId) || [];
    return job;
  }

  static async updateProgress(
    jobId: string,
    data: {
      stage: PipelineStage | string;
      progress: number;
      estimatedCostUsd?: number;
      totalTokensUsed?: number;
      previewUrl?: string;
      activeSceneIndex?: number;
      error?: string;
      status?: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";
    }
  ): Promise<void> {
    const job = memoryStore.jobs.get(jobId);
    if (job) {
      job.currentStage = data.stage;
      job.progress = data.progress;
      if (data.estimatedCostUsd !== undefined) job.estimatedCostUsd = data.estimatedCostUsd;
      if (data.totalTokensUsed !== undefined) job.totalTokensUsed = data.totalTokensUsed;
      if (data.previewUrl !== undefined) job.previewUrl = data.previewUrl;
      if (data.activeSceneIndex !== undefined) job.activeSceneIndex = data.activeSceneIndex;
      if (data.error !== undefined) job.error = data.error;
      if (data.status) job.status = data.status;
      if (data.status === "COMPLETED" || data.status === "FAILED") {
        job.completedAt = new Date();
      }
      job.updatedAt = new Date();
    }

    try {
      if (process.env.DATABASE_URL) {
        await prisma.generationJob.update({
          where: { id: jobId },
          data: {
            currentStage: data.stage,
            progress: data.progress,
            estimatedCostUsd: data.estimatedCostUsd,
            totalTokensUsed: data.totalTokensUsed,
            previewUrl: data.previewUrl,
            activeSceneIndex: data.activeSceneIndex,
            error: data.error,
            status: data.status as any,
            completedAt: data.status === "COMPLETED" || data.status === "FAILED" ? new Date() : undefined,
          },
        });
      }
    } catch {
      // Fallback
    }
  }

  static async appendLog(
    jobId: string,
    level: LogLevel,
    stage: string,
    message: string,
    metadata?: any
  ): Promise<DBJobLog> {
    const log: DBJobLog = {
      id: `log_${Math.random().toString(36).substring(2, 11)}`,
      jobId: jobId,
      level: level,
      stage: stage,
      message: message,
      metadata: metadata,
      timestamp: new Date(),
    };

    const existingLogs = memoryStore.logs.get(jobId) || [];
    existingLogs.unshift(log);
    memoryStore.logs.set(jobId, existingLogs.slice(0, 100));

    try {
      if (process.env.DATABASE_URL) {
        await prisma.jobLog.create({
          data: {
            id: log.id,
            jobId: jobId,
            level: level as any,
            stage: stage,
            message: message,
            metadata: metadata,
          },
        });
      }
    } catch {
      // Fallback
    }

    return log;
  }
}
