export type AspectRatioType = "16:9" | "9:16" | "3:2" | "1:1" | "4:3";

export interface ImageGenerationOptions {
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: AspectRatioType;
  solidBackground?: boolean;
  backgroundColor?: string;
  stylePreset?: string;
  seed?: number;
  numberOfImages?: number;
}

export interface GeneratedImageResult {
  id: string;
  url: string;
  base64?: string;
  width: number;
  height: number;
  aspectRatio: AspectRatioType;
  prompt: string;
  generationTimeMs: number;
  mimeType: string;
}

export interface BatchStillGenerationResult {
  sceneId: string;
  sceneIndex: number;
  still: GeneratedImageResult;
  status: "success" | "failed";
  error?: string;
}

export interface VideoModelProvider {
  name: "seedance-2.0" | "kling-3.0";
  endpoint: string;
  quality: "480p" | "720p" | "1080p";
}

export interface VideoGenerationTaskRequest {
  id?: string;
  sceneIndex?: number;
  sceneTitle?: string;
  type?: "dive" | "connector" | string;
  prompt: string;
  startImageUrl?: string;
  endImageUrl?: string;
  aspectRatio?: "16:9" | "9:16" | string;
  quality?: "480p" | "720p" | "1080p";
  durationSeconds?: number;
  preferredModel?: "seedance-2.0" | "kling-3.0" | string;
  maxRetries?: number;
}

export interface VideoTaskStatus {
  taskId: string;
  status: "queued" | "processing" | "completed" | "failed" | "rejected_nsfw" | "COMPLETED" | "FAILED" | string;
  progress?: number;
  progressPercent?: number;
  videoUrl?: string;
  rawOutputUrl?: string;
  model?: string;
  costUsd?: number;
  providerUsed?: "seedance-2.0" | "kling-3.0" | string;
  failoverTriggered?: boolean;
  failoverReason?: string;
  error?: string;
  durationMs?: number;
  metrics?: {
    ssim?: number;
    psnr?: number;
  };
}

export interface SfsUploadResult {
  sfsUri: string;
  publicUrl: string;
  fileSizeBytes: number;
  mimeType: string;
  checksumMd5?: string;
}

export interface BoundaryFrameExtractionResult {
  sceneIndex: number;
  firstFrameBuffer: Buffer;
  lastFrameBuffer: Buffer;
  firstFramePath?: string;
  lastFramePath?: string;
  firstFramePublicUrl?: string;
  lastFramePublicUrl?: string;
  durationSeconds: number;
  fps: number;
}

export interface TranscodePresetConfig {
  name: "desktop-1080p-gop8" | "mobile-720p-gop4";
  resolution: { width: number; height: number };
  gopSize: number;
  keyintMin: number;
  crf: number;
  preset: "slow" | "medium" | "fast";
  unsharpFilter: string;
  movFlags: string;
  videoCodec: string;
  audioDisabled: boolean;
}

export interface KnockoutOptions {
  tolerance?: number;
  edgeSoftness?: number;
  floodFillSeedBorders?: ("top" | "bottom" | "left" | "right")[];
  targetBackgroundColor?: { r: number; g: number; b: number };
}

export interface StorageUploadOptions {
  key: string;
  buffer: Buffer | Uint8Array;
  contentType: string;
  isPublic?: boolean;
  cacheControl?: string;
}

export interface StorageUploadResult {
  key: string;
  url: string;
  publicCdnUrl: string;
  sizeBytes: number;
  etag?: string;
}

export interface BrandAnalysisResult {
  brandName: string;
  brandTone: string;
  primaryColors: string[];
  suggestedArtStyle: string;
  suggestedCameraMotion: string;
  scenes: Array<{
    title: string;
    description: string;
    visualConcept: string;
    motionPrompt: string;
    handoffClause: string;
    estimatedDuration: number;
  }>;
}
