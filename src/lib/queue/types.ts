/**
 * Pipeline DAG & Queue Types for ScrollWorld Video Generation Engine
 */

export type PipelineStage =
  | "PENDING"
  | "INTAKE"
  | "STILLS_GENERATING"
  | "STILLS_READY"
  | "DIVES_GENERATING"
  | "BOUNDARIES_EXTRACTING"
  | "CONNECTORS_GENERATING"
  | "TRANSCODING"
  | "QA_VERIFICATION"
  | "COMPLETED"
  | "FAILED";

export type JobType =
  | "FULL_PIPELINE"
  | "INTAKE"
  | "STILLS"
  | "DIVES"
  | "CONNECTORS"
  | "TRANSCODE";

export type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

export interface PipelineProgressEvent {
  jobId: string;
  projectId: string;
  stage: PipelineStage;
  stageTitle: string;
  progress: number;
  totalTokensUsed: number;
  estimatedCostUsd: number;
  activeSceneIndex?: number;
  totalScenes: number;
  message: string;
  timestamp: number;
  previewUrl?: string;
  sceneUpdated?: {
    id: string;
    order: number;
    title: string;
    stillPosterUrl?: string;
    videoDesktopUrl?: string;
    videoMobileUrl?: string;
    status: "PENDING" | "GENERATING" | "READY" | "FAILED";
  };
  error?: string;
}

export interface GenerationJobPayload {
  jobId: string;
  projectId: string;
  type?: JobType;
  aspectRatio?: "16:9" | "9:16";
  mode?: "draft" | "production";
}

export interface UnitEconomicsSummary {
  stillsCostUsd: number;
  divesCostUsd: number;
  connectorsCostUsd: number;
  transcodeCostUsd: number;
  totalCostUsd: number;
  totalGeminiTokens: number;
}
