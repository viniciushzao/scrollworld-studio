/**
 * ScrollWorld Engine Types & Interfaces
 * High-performance scrub engine architecture
 */

export interface SceneMedia {
  id: string;
  index: number;
  title: string;
  subtitle?: string;
  description?: string;
  tags?: string[];
  stillPosterUrl: string;
  videoDesktopUrl: string;
  videoMobileUrl?: string;
  duration: number;
  diveScrollPx?: number;
  lingerFactor?: number;
  cta?: {
    text: string;
    url: string;
  };
}

export interface VideoPoolItem {
  id: string;
  sceneIndex: number;
  videoElement: HTMLVideoElement;
  blobUrl: string;
  objectUrl: string | null;
  isAttached: boolean;
  lastUsedTimestamp: number;
  isLoaded: boolean;
  isSeeking: boolean;
  aspectRatio: "desktop" | "mobile";
}

export interface ScrubEngineOptions {
  container: HTMLElement;
  scenes: SceneMedia[];
  dampingFactor?: number;
  lingerEasePower?: number;
  maxVideoPoolSize?: number;
  mode?: "desktop" | "mobile";
  debug?: boolean;
  onProgress?: (progress: number, sceneIndex: number, sceneProgress: number) => void;
  onSceneChange?: (sceneIndex: number, scene: SceneMedia) => void;
  onReady?: () => void;
  onError?: (error: Error) => void;
  onFpsUpdate?: (fps: number) => void;
}

export interface ScrubState {
  currentProgress: number;
  targetProgress: number;
  currentSceneIndex: number;
  sceneLocalProgress: number;
  isSeeking: boolean;
  isPrimed: boolean;
  isLoaded: boolean;
  fps: number;
  activeVideoCount: number;
  memoryEstimateMb: number;
}

export type EasingFunction = (t: number) => number;
