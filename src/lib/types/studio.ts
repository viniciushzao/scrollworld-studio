import { SceneMedia } from "@/lib/engine/types";

export type ArtStylePreset =
  | "hyper-realistic"
  | "cinematic-scifi"
  | "luxury-editorial"
  | "minimalist-apple"
  | "cyberpunk-neon"
  | "organic-nature"
  | "retro-futuristic"
  | "isometric-3d";

export type CameraMotion =
  | "forward-dive"
  | "orbital-pan"
  | "macro-zoom"
  | "infinite-plunge"
  | "spiral-ascend"
  | "gentle-glide";

export interface ProjectSettings {
  aspectRatio: "16:9" | "9:16";
  dampingFactor: number;
  lingerFactor: number;
  scrollSensitivity: number;
  enableAudio: boolean;
  audioUrl?: string;
  themeColor: string;
  fontFamily: string;
  showOverlayText: boolean;
  showScrollIndicator: boolean;
  showProgressDots: boolean;
}

export interface StudioProject {
  id: string;
  title: string;
  description: string;
  brandUrl?: string;
  artStyle: ArtStylePreset;
  cameraMotion: CameraMotion;
  scenes: SceneMedia[];
  settings: ProjectSettings;
  createdAt: string;
  updatedAt: string;
  status: "draft" | "generating" | "ready" | "error";
  generationProgress?: number;
  generationStep?: string;
}

export interface GenerationTelemetryEvent {
  jobId: string;
  projectId: string;
  step:
    | "scrape_brand"
    | "prompt_synthesis"
    | "gemini_stills"
    | "boundary_extraction"
    | "monid_seedance_dives"
    | "ffmpeg_gop_transcode"
    | "cloudflare_r2_upload"
    | "ready"
    | "error";
  stepTitle: string;
  progress: number;
  tokenCount?: number;
  estimatedCostUsd?: number;
  activeSceneIndex?: number;
  totalScenes?: number;
  message: string;
  timestamp: number;
  previewUrl?: string;
}

export interface EmbedConfig {
  projectId: string;
  mode: "full-screen" | "inline" | "hero-section";
  aspectRatio: "16:9" | "9:16" | "auto";
  enableControls: boolean;
  enableSound: boolean;
  primaryColor?: string;
  autoPrimeTouch: boolean;
}
