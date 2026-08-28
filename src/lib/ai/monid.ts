/**
 * Monid API Client (ByteDance Seedance 2.0)
 * Video chain generator with frame conditioning, real execution, defensive parser, and error handling.
 */

import { exec } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import {
  VideoGenerationTaskRequest,
  VideoTaskStatus,
  SfsUploadResult,
} from "../types/pipeline";

export function extractMonidVideoUrl(data: any): string | null {
  if (!data) return null;

  const directCandidates = [
    data.output?.content?.video_url,
    data.output?.video_url,
    data.output?.content?.[0]?.video_url,
    data.output?.content?.[0]?.url,
    data.output?.content?.[0]?.image_url?.url,
    data.result?.content?.video_url,
    data.result?.content?.[0]?.video_url,
    data.result?.video_url,
    data.result?.url,
    data.content?.video_url,
    data.content?.[0]?.video_url,
    data.video_url,
    data.videoUrl,
    data.output_url,
    data.outputUrl,
    data.rawOutputUrl,
    data.url,
    data.download_url,
    data.downloadUrl,
    data.media_url,
    data.mediaUrl,
    data.file_url,
    data.fileUrl,
  ];

  for (const candidate of directCandidates) {
    if (typeof candidate === "string" && isValidVideoUrl(candidate)) {
      return candidate.trim();
    }
  }

  const visited = new Set<any>();

  function isValidVideoUrl(str: string): boolean {
    if (typeof str !== "string") return false;
    const s = str.trim();
    if (!s.startsWith("http://") && !s.startsWith("https://")) return false;
    const lower = s.toLowerCase();
    return (
      lower.includes(".mp4") ||
      lower.includes(".mov") ||
      lower.includes(".webm") ||
      lower.includes(".m3u8") ||
      lower.includes("seedance") ||
      lower.includes("dreamina") ||
      lower.includes("volces.com") ||
      lower.includes("tos-") ||
      lower.includes("video") ||
      lower.includes("monid")
    );
  }

  function deepFind(node: any, depth = 0): string | null {
    if (!node || typeof node !== "object" || depth > 12 || visited.has(node)) {
      return null;
    }
    visited.add(node);

    if (Array.isArray(node)) {
      for (const item of node) {
        if (typeof item === "string" && isValidVideoUrl(item)) {
          return item.trim();
        }
        const found = deepFind(item, depth + 1);
        if (found) return found;
      }
      return null;
    }

    const priorityKeys = [
      "video_url",
      "videoUrl",
      "output_url",
      "outputUrl",
      "download_url",
      "downloadUrl",
      "rawOutputUrl",
      "media_url",
      "mediaUrl",
      "file_url",
      "fileUrl",
      "url",
      "src",
      "video",
    ];

    for (const key of priorityKeys) {
      if (typeof node[key] === "string" && isValidVideoUrl(node[key])) {
        return node[key].trim();
      }
    }

    for (const [, val] of Object.entries(node)) {
      if (typeof val === "string" && isValidVideoUrl(val)) {
        return val.trim();
      }
    }

    for (const [, val] of Object.entries(node)) {
      if (typeof val === "object" && val !== null) {
        const found = deepFind(val, depth + 1);
        if (found) return found;
      }
    }

    return null;
  }

  return deepFind(data);
}

export class MonidApiClient {
  private apiKey: string;
  private videosDir: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.MONID_API_KEY || "";
    this.videosDir = path.join(process.cwd(), "public", "generated", "videos");

    if (!fs.existsSync(this.videosDir)) {
      fs.mkdirSync(this.videosDir, { recursive: true });
    }
  }

  public async checkHealth(): Promise<{ status: "healthy" | "unhealthy"; balanceUsd?: number; message: string }> {
    return new Promise((resolve) => {
      exec("monid balance", (err, stdout, stderr) => {
        if (err && !stdout) {
          resolve({
            status: "unhealthy",
            message: `Monid CLI failed: ${stderr || err.message}`,
          });
          return;
        }

        const match = (stdout || "").match(/Balance:\\s*\\$([0-9.]+)\\s*USD/i);
        const balance = match ? parseFloat(match[1]) : 0.0;

        if (balance <= 0) {
          resolve({
            status: "unhealthy",
            balanceUsd: balance,
            message: `Saldo insuficiente na carteira Monid ($${balance.toFixed(2)} USD). Recarregue em https://app.monid.ai/wallet para gerar vídeos com Seedance 2.0.`,
          });
        } else {
          resolve({
            status: "healthy",
            balanceUsd: balance,
            message: `Monid Seedance 2.0 ativo. Saldo da carteira: $${balance.toFixed(2)} USD.`,
          });
        }
      });
    });
  }

  public async uploadToSfsWorkspace(
    fileBuffer: Buffer | Uint8Array,
    fileName: string,
    mimeType = "image/png"
  ): Promise<SfsUploadResult> {
    const framesDir = path.join(process.cwd(), "public", "generated", "frames");
    if (!fs.existsSync(framesDir)) {
      fs.mkdirSync(framesDir, { recursive: true });
    }

    const localPath = path.join(framesDir, fileName);
    fs.writeFileSync(localPath, Buffer.from(fileBuffer));

    const publicUrl = `/generated/frames/${fileName}`;

    return {
      sfsUri: `sfs://frames/${fileName}`,
      publicUrl,
      fileSizeBytes: fileBuffer.length,
      mimeType,
    };
  }

  public async submitVideoTask(
    req: VideoGenerationTaskRequest
  ): Promise<{ taskId: string; model: "seedance-2.0" }> {
    const contentItems: any[] = [
      { type: "text", text: req.prompt },
    ];

    if (req.startImageUrl && (req.startImageUrl.startsWith("http://") || req.startImageUrl.startsWith("https://") || req.startImageUrl.startsWith("asset://"))) {
      contentItems.push({
        type: "image_url",
        image_url: { url: req.startImageUrl },
        role: "first_frame",
      });
    }

    if (req.endImageUrl && (req.endImageUrl.startsWith("http://") || req.endImageUrl.startsWith("https://") || req.endImageUrl.startsWith("asset://"))) {
      contentItems.push({
        type: "image_url",
        image_url: { url: req.endImageUrl },
        role: "last_frame",
      });
    }

    const payload = {
      content: contentItems,
      resolution: req.quality === "1080p" ? "1080p" : "720p",
      duration: req.durationSeconds ? Math.min(15, Math.max(4, Math.round(req.durationSeconds))) : 4,
      ratio: req.aspectRatio || "16:9",
      generate_audio: false,
    };

    const tempDir = process.platform === "win32" 
      ? path.join("C:", "Users", "Public", "scroll_temp")
      : path.join(os.tmpdir(), "scroll_temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const tempFile = path.join(tempDir, `monid_task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.json`);
    fs.writeFileSync(tempFile, JSON.stringify(payload, null, 2), "utf8");

    const cmd = `monid run -p bytedance -e /v1/video/seedance-2.0 -f "${tempFile}" -j`;

    return new Promise((resolve, reject) => {
      exec(cmd, (err, stdout, stderr) => {
        try {
          if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        } catch {}

        if (stdout) {
          try {
            const json = JSON.parse(stdout);

            if (json.status === "BLOCKED") {
              reject(new Error(`[Monid Seedance 2.0] ${json.reason || "Execução bloqueada por saldo insuficiente. Recarregue em https://app.monid.ai/wallet"}`));
              return;
            }

            const runId = json.runId || json.id || json.run_id;
            if (!runId) {
              reject(new Error(`Monid CLI missing runId: ${stdout}`));
              return;
            }

            resolve({ taskId: runId, model: "seedance-2.0" });
          } catch (e: any) {
            reject(new Error(`Failed to parse Monid response: ${e?.message}. Output: ${stdout}`));
          }
        } else {
          reject(new Error(`Monid CLI Seedance 2.0 task submission failed: ${stderr || err?.message}`));
        }
      });
    });
  }

  public async pollTaskStatus(
    taskId: string,
    onProgress?: (percent: number, status: string) => void
  ): Promise<VideoTaskStatus> {
    const maxAttempts = 120;
    const intervalMs = 5000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const statusResult = await new Promise<any>((resolve, reject) => {
        exec(`monid runs get -r "${taskId}" -j`, (err, stdout, stderr) => {
          if (stdout) {
            try {
              resolve(JSON.parse(stdout));
            } catch (e) {
              reject(e);
            }
          } else {
            reject(new Error(`Failed to fetch Monid run ${taskId}: ${stderr || err?.message}`));
          }
        });
      });

      const state = (statusResult.status || statusResult.state || "running").toLowerCase();
      const progressPercent = Math.min(95, Math.round((attempt / maxAttempts) * 100));

      if (onProgress) {
        onProgress(progressPercent, state);
      }

      if (state === "completed" || state === "succeeded" || state === "done") {
        const remoteVideoUrl = extractMonidVideoUrl(statusResult);

        if (!remoteVideoUrl) {
          throw new Error(
            `Monid task ${taskId} completed but output video_url is missing: ${JSON.stringify(statusResult.output || statusResult)}`
          );
        }

        const localFileName = `seedance_${taskId}.mp4`;
        const localFilePath = path.join(this.videosDir, localFileName);

        let downloadSuccess = false;
        for (let dlAttempt = 1; dlAttempt <= 3; dlAttempt++) {
          try {
            const videoResponse = await fetch(remoteVideoUrl);
            if (videoResponse.ok) {
              const videoBuffer = await videoResponse.arrayBuffer();
              fs.writeFileSync(localFilePath, Buffer.from(videoBuffer));
              downloadSuccess = true;
              break;
            }
          } catch {
            // Retry
          }
          if (dlAttempt < 3) await new Promise((r) => setTimeout(r, 1500));
        }

        const publicVideoUrl = downloadSuccess && fs.existsSync(localFilePath)
          ? `/generated/videos/${localFileName}`
          : remoteVideoUrl;

        return {
          taskId,
          status: "COMPLETED",
          progressPercent: 100,
          videoUrl: publicVideoUrl,
          rawOutputUrl: remoteVideoUrl,
          model: statusResult.output?.model || "seedance-2.0",
          costUsd: statusResult.cost?.value || 0.28,
        };
      }

      if (state === "failed" || state === "error" || state === "rejected" || state === "blocked") {
        const errorMsg = statusResult.reason || statusResult.error?.message || statusResult.error || "Monid Video Generation Failed";
        throw new Error(`[Monid Seedance 2.0] ${errorMsg}`);
      }

      await new Promise((r) => setTimeout(r, intervalMs));
    }

    throw new Error(`Monid Video Generation Task ${taskId} timed out after 10 minutes.`);
  }

  public async generateVideoChainClip(
    req: VideoGenerationTaskRequest,
    onProgress?: (percent: number, status: string) => void
  ): Promise<VideoTaskStatus> {
    const task = await this.submitVideoTask(req);
    return await this.pollTaskStatus(task.taskId, onProgress);
  }
}

export const monidClient = new MonidApiClient();
