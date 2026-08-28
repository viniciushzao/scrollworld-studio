/**
 * ScrollWorld Scrub Engine Core
 * Ultra-smooth, hardware-accelerated video scrub player
 * In-Memory Blob seeking, Dynamic Video Pool (max 2 DOM nodes),
 * Seek Coalescing, Cubic Linger Easing, iOS Safari Priming.
 */

import { SceneMedia, ScrubEngineOptions, ScrubState, VideoPoolItem } from "./types";
import { clamp, lerp } from "@/lib/utils";

export class ScrubEngine {
  private container: HTMLElement;
  private scenes: SceneMedia[] = [];
  private options: Required<ScrubEngineOptions>;

  private pool: Map<number, VideoPoolItem> = new Map();
  private blobCache: Map<string, string> = new Map();
  private videoContainer!: HTMLElement;
  private posterContainer!: HTMLElement;
  private overlayContainer!: HTMLElement;

  private targetProgress = 0;
  private currentProgress = 0;
  private isPrimed = false;
  private isDestroyed = false;
  private rafId: number | null = null;

  private lastFrameTime = performance.now();
  private frameCount = 0;
  private currentFps = 60;
  private lastFpsUpdate = performance.now();

  private lastWindowWidth = 0;
  private lastWindowHeight = 0;

  private currentSceneIndex = 0;
  private localSceneProgress = 0;

  constructor(options: ScrubEngineOptions) {
    this.container = options.container;
    this.scenes = options.scenes || [];
    this.options = {
      container: options.container,
      scenes: options.scenes,
      dampingFactor: options.dampingFactor ?? 0.18,
      lingerEasePower: options.lingerEasePower ?? 3.0,
      maxVideoPoolSize: options.maxVideoPoolSize ?? 2,
      mode: options.mode ?? "desktop",
      debug: options.debug ?? false,
      onProgress: options.onProgress ?? (() => {}),
      onSceneChange: options.onSceneChange ?? (() => {}),
      onReady: options.onReady ?? (() => {}),
      onError: options.onError ?? (() => {}),
      onFpsUpdate: options.onFpsUpdate ?? (() => {}),
    };

    if (typeof window !== "undefined") {
      this.lastWindowWidth = window.innerWidth;
      this.lastWindowHeight = window.innerHeight;
      this.initDOM();
      this.setupTouchPriming();
      this.setupResizeListener();
      this.preloadInitialBlobs().then(() => {
        this.startRenderLoop();
        this.options.onReady();
      });
    }
  }

  private initDOM() {
    this.container.style.position = "relative";
    this.container.style.overflow = "hidden";
    this.container.style.userSelect = "none";
    this.container.style.touchAction = "none";

    this.posterContainer = document.createElement("div");
    this.posterContainer.className = "scrollworld-posters-layer";
    Object.assign(this.posterContainer.style, {
      position: "absolute",
      inset: "0",
      zIndex: "1",
      pointerEvents: "none",
    });

    this.videoContainer = document.createElement("div");
    this.videoContainer.className = "scrollworld-video-pool-layer";
    Object.assign(this.videoContainer.style, {
      position: "absolute",
      inset: "0",
      zIndex: "2",
      pointerEvents: "none",
    });

    this.overlayContainer = document.createElement("div");
    this.overlayContainer.className = "scrollworld-overlay-layer";
    Object.assign(this.overlayContainer.style, {
      position: "absolute",
      inset: "0",
      zIndex: "3",
      pointerEvents: "none",
    });

    this.container.appendChild(this.posterContainer);
    this.container.appendChild(this.videoContainer);
    this.container.appendChild(this.overlayContainer);

    this.renderPosters();
  }

  private renderPosters() {
    this.posterContainer.innerHTML = "";
    this.scenes.forEach((scene, index) => {
      const poster = scene.stillPosterUrl || (scene as any).stillDesktop || (scene as any).stillMobile || "";
      if (!poster) return;
      const img = document.createElement("img");
      img.src = poster;
      img.alt = scene.title || `Scene ${index + 1}`;
      img.dataset.sceneIndex = index.toString();
      Object.assign(img.style, {
        position: "absolute",
        inset: "0",
        width: "100%",
        height: "100%",
        objectFit: "cover",
        opacity: index === 0 ? "1" : "0",
        transition: "opacity 0.25s ease-out",
      });
      this.posterContainer.appendChild(img);
    });
  }

  private async preloadInitialBlobs() {
    if (!this.scenes.length) return;
    await this.fetchBlob(0);
    if (this.scenes.length > 1) {
      this.fetchBlob(1);
    }
  }

  private async fetchBlob(sceneIndex: number): Promise<string | null> {
    const scene = this.scenes[sceneIndex];
    if (!scene) return null;

    const rawUrl =
      (this.options.mode === "mobile" && (scene.videoMobileUrl || (scene as any).clipMobile))
        ? (scene.videoMobileUrl || (scene as any).clipMobile)
        : (scene.videoDesktopUrl || (scene as any).clipDesktop || (scene as any).videoUrl || "");

    if (!rawUrl) return null;

    if (this.blobCache.has(rawUrl)) {
      return this.blobCache.get(rawUrl)!;
    }

    try {
      const response = await fetch(rawUrl, { mode: "cors" });
      if (!response.ok) {
        this.blobCache.set(rawUrl, rawUrl);
        return rawUrl;
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      this.blobCache.set(rawUrl, objectUrl);
      return objectUrl;
    } catch {
      this.blobCache.set(rawUrl, rawUrl);
      return rawUrl;
    }
  }

  private getOrCreateVideoElement(sceneIndex: number): VideoPoolItem | null {
    if (sceneIndex < 0 || sceneIndex >= this.scenes.length) return null;

    let item = this.pool.get(sceneIndex);
    if (!item) {
      const scene = this.scenes[sceneIndex];
      const video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      video.preload = "auto";
      video.setAttribute("playsinline", "");
      video.setAttribute("webkit-playsinline", "");
      video.setAttribute("muted", "");
      video.disablePictureInPicture = true;

      Object.assign(video.style, {
        position: "absolute",
        inset: "0",
        width: "100%",
        height: "100%",
        objectFit: "cover",
        opacity: "0",
        transition: "opacity 0.2s ease-out",
      });

      item = {
        id: `video-scene-${sceneIndex}`,
        sceneIndex,
        videoElement: video,
        blobUrl:
          this.options.mode === "mobile" && scene.videoMobileUrl
            ? scene.videoMobileUrl
            : scene.videoDesktopUrl,
        objectUrl: null,
        isAttached: false,
        lastUsedTimestamp: performance.now(),
        isLoaded: false,
        isSeeking: false,
        aspectRatio: this.options.mode,
      };

      video.addEventListener("seeking", () => {
        if (item) item.isSeeking = true;
      });
      video.addEventListener("seeked", () => {
        if (item) {
          item.isSeeking = false;
          video.style.opacity = "1";
        }
      });
      video.addEventListener("loadeddata", () => {
        if (item) {
          item.isLoaded = true;
          video.style.opacity = "1";
        }
      });
      video.addEventListener("canplay", () => {
        if (item) item.isLoaded = true;
      });
      video.addEventListener("error", () => {
        if (item) {
          item.isLoaded = false;
          video.style.opacity = "0";
        }
      });

      this.pool.set(sceneIndex, item);
    }

    if (!item.isAttached) {
      this.evictUnusedVideos(sceneIndex);
      this.videoContainer.appendChild(item.videoElement);
      item.isAttached = true;

      const cachedUrl = this.blobCache.get(item.blobUrl);
      if (cachedUrl && item.videoElement.src !== cachedUrl) {
        item.videoElement.src = cachedUrl;
        item.videoElement.load();
      } else if (!cachedUrl) {
        this.fetchBlob(sceneIndex).then((url) => {
          if (url && item) {
            item.videoElement.src = url;
            item.videoElement.load();
          }
        });
      }
    }

    item.lastUsedTimestamp = performance.now();
    return item;
  }

  private evictUnusedVideos(activeSceneIndex: number) {
    const attachedItems = Array.from(this.pool.values()).filter((i) => i.isAttached);
    if (attachedItems.length < this.options.maxVideoPoolSize) return;

    attachedItems.sort(
      (a, b) =>
        Math.abs(b.sceneIndex - activeSceneIndex) - Math.abs(a.sceneIndex - activeSceneIndex)
    );

    while (attachedItems.length >= this.options.maxVideoPoolSize) {
      const toEvict = attachedItems.shift();
      if (toEvict && toEvict.sceneIndex !== activeSceneIndex) {
        try {
          if (toEvict.videoElement.parentNode) {
            toEvict.videoElement.parentNode.removeChild(toEvict.videoElement);
          }
          toEvict.isAttached = false;
        } catch {}
      }
    }
  }

  private setupTouchPriming() {
    const primeHandler = () => {
      if (this.isPrimed) return;
      this.isPrimed = true;

      const activeItem = this.getOrCreateVideoElement(this.currentSceneIndex);
      if (activeItem) {
        const v = activeItem.videoElement;
        const playPromise = v.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              v.pause();
            })
            .catch(() => {});
        }
      }

      window.removeEventListener("touchstart", primeHandler, { capture: true });
      window.removeEventListener("pointerdown", primeHandler, { capture: true });
      window.removeEventListener("wheel", primeHandler, { capture: true });
    };

    window.addEventListener("touchstart", primeHandler, { capture: true, passive: true });
    window.addEventListener("pointerdown", primeHandler, { capture: true, passive: true });
    window.addEventListener("wheel", primeHandler, { capture: true, passive: true });
  }

  private setupResizeListener() {
    window.addEventListener("resize", () => {
      const widthDelta = Math.abs(window.innerWidth - this.lastWindowWidth);
      const heightDelta = Math.abs(window.innerHeight - this.lastWindowHeight);

      if (widthDelta === 0 && heightDelta < 120) {
        return;
      }

      this.lastWindowWidth = window.innerWidth;
      this.lastWindowHeight = window.innerHeight;
      this.resize();
    });
  }

  private applyLingerEase(t: number, lingerFactor: number = 0.5): number {
    const k = clamp(lingerFactor, 0, 0.95);
    return t - (k / (2 * Math.PI)) * Math.sin(2 * Math.PI * t);
  }

  private startRenderLoop() {
    const render = (now: number) => {
      if (this.isDestroyed) return;

      this.frameCount++;
      if (now - this.lastFpsUpdate >= 1000) {
        this.currentFps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
        this.frameCount = 0;
        this.lastFpsUpdate = now;
        this.options.onFpsUpdate(this.currentFps);
      }
      this.lastFrameTime = now;

      const diff = this.targetProgress - this.currentProgress;
      if (Math.abs(diff) > 0.00005) {
        this.currentProgress = lerp(this.currentProgress, this.targetProgress, this.options.dampingFactor);
      } else {
        this.currentProgress = this.targetProgress;
      }

      this.updatePlayerFrame(this.currentProgress);

      this.rafId = requestAnimationFrame(render);
    };

    this.rafId = requestAnimationFrame(render);
  }

  private updatePlayerFrame(progress: number) {
    if (!this.scenes.length) return;

    const totalScenes = this.scenes.length;
    const clampedProgress = clamp(progress, 0, 1);

    const scaled = clampedProgress * (totalScenes - 1);
    const sceneIndex = Math.floor(scaled);
    const rawLocalProgress = scaled - sceneIndex;

    this.currentSceneIndex = Math.min(sceneIndex, totalScenes - 1);
    const activeScene = this.scenes[this.currentSceneIndex];

    const linger = activeScene.lingerFactor ?? 0.45;
    this.localSceneProgress = this.applyLingerEase(rawLocalProgress, linger);

    const currentVideoItem = this.getOrCreateVideoElement(this.currentSceneIndex);

    if (currentVideoItem && currentVideoItem.videoElement) {
      const v = currentVideoItem.videoElement;
      const duration = v.duration || activeScene.duration || 4.0;
      const targetTime = clamp(this.localSceneProgress * duration, 0, duration);

      if (!v.seeking && Math.abs(v.currentTime - targetTime) > 0.02) {
        try {
          if ("fastSeek" in v && typeof (v as any).fastSeek === "function") {
            (v as any).fastSeek(targetTime);
          } else {
            v.currentTime = targetTime;
          }
        } catch {}
      }
    }

    if (this.currentSceneIndex + 1 < totalScenes) {
      this.getOrCreateVideoElement(this.currentSceneIndex + 1);
    }
    if (this.currentSceneIndex - 1 >= 0) {
      this.getOrCreateVideoElement(this.currentSceneIndex - 1);
    }

    const posterImages = this.posterContainer.querySelectorAll<HTMLImageElement>("img");
    posterImages.forEach((img, idx) => {
      img.style.opacity = idx === this.currentSceneIndex ? "1" : "0";
    });

    this.options.onProgress(clampedProgress, this.currentSceneIndex, this.localSceneProgress);
  }

  public scrollToProgress(progress: number) {
    this.targetProgress = clamp(progress, 0, 1);
  }

  public scrollBy(delta: number) {
    this.scrollToProgress(this.targetProgress + delta);
  }

  public goToScene(index: number) {
    if (!this.scenes.length) return;
    const progress = clamp(index / (this.scenes.length - 1), 0, 1);
    this.scrollToProgress(progress);
    this.options.onSceneChange(index, this.scenes[index]);
  }

  public setMode(mode: "desktop" | "mobile") {
    if (this.options.mode === mode) return;
    this.options.mode = mode;

    this.pool.forEach((item) => {
      if (item.videoElement.parentNode) {
        item.videoElement.parentNode.removeChild(item.videoElement);
      }
    });
    this.pool.clear();
    this.preloadInitialBlobs();
  }

  public updateScenes(newScenes: SceneMedia[]) {
    this.scenes = newScenes;
    this.renderPosters();
    this.preloadInitialBlobs();
    this.updatePlayerFrame(this.currentProgress);
  }

  public prime() {
    this.isPrimed = true;
    const activeItem = this.getOrCreateVideoElement(this.currentSceneIndex);
    if (activeItem) {
      activeItem.videoElement.play().then(() => activeItem.videoElement.pause()).catch(() => {});
    }
  }

  public resize() {
    this.updatePlayerFrame(this.currentProgress);
  }

  public getState(): ScrubState {
    const activeItem = this.pool.get(this.currentSceneIndex);
    const attachedCount = Array.from(this.pool.values()).filter((i) => i.isAttached).length;

    return {
      currentProgress: this.currentProgress,
      targetProgress: this.targetProgress,
      currentSceneIndex: this.currentSceneIndex,
      sceneLocalProgress: this.localSceneProgress,
      isSeeking: activeItem ? activeItem.isSeeking : false,
      isPrimed: this.isPrimed,
      isLoaded: this.blobCache.size > 0,
      fps: this.currentFps,
      activeVideoCount: attachedCount,
      memoryEstimateMb: Math.round(this.blobCache.size * 18.5),
    };
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }

    this.blobCache.forEach((objectUrl) => {
      if (objectUrl.startsWith("blob:")) {
        URL.revokeObjectURL(objectUrl);
      }
    });
    this.blobCache.clear();

    this.pool.forEach((item) => {
      if (item.videoElement.parentNode) {
        item.videoElement.parentNode.removeChild(item.videoElement);
      }
      item.videoElement.src = "";
    });
    this.pool.clear();

    if (this.posterContainer.parentNode) this.posterContainer.parentNode.removeChild(this.posterContainer);
    if (this.videoContainer.parentNode) this.videoContainer.parentNode.removeChild(this.videoContainer);
    if (this.overlayContainer.parentNode) this.overlayContainer.parentNode.removeChild(this.overlayContainer);
  }
}
