/**
 * FFmpeg Video Encoder & Transcode Engine
 * Generates frame-accurate GOP 8 (Desktop) and GOP 4 (Mobile) seekable H.264 streams
 */

import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { TranscodePresetConfig } from "../types/pipeline";
import { getFfmpegBinaryPath, getFfprobeBinaryPath } from "./paths";

export const TRANSCODE_PRESETS: Record<"desktop" | "mobile", TranscodePresetConfig> = {
  desktop: {
    name: "desktop-1080p-gop8",
    resolution: { width: 1920, height: 1080 },
    gopSize: 8,
    keyintMin: 8,
    crf: 20,
    preset: "slow",
    unsharpFilter: "unsharp=5:5:0.8:5:5:0.0",
    movFlags: "+faststart",
    videoCodec: "libx264",
    audioDisabled: true,
  },
  mobile: {
    name: "mobile-720p-gop4",
    resolution: { width: 720, height: 1280 },
    gopSize: 4,
    keyintMin: 4,
    crf: 23,
    preset: "slow",
    unsharpFilter: "scale=-2:720,unsharp=5:5:0.6:5:5:0.0",
    movFlags: "+faststart",
    videoCodec: "libx264",
    audioDisabled: true,
  },
};

export interface TranscodeJobResult {
  preset: "desktop" | "mobile";
  outputPath: string;
  outputBuffer?: Buffer;
  durationSeconds: number;
  fileSizeBytes: number;
  gopSize: number;
  keyintMin: number;
  crf: number;
  isSimulated: boolean;
}

export class VideoTranscoder {
  private ffmpegPath: string;
  private ffprobePath: string;
  private tempDir: string;

  constructor(options?: { ffmpegPath?: string; ffprobePath?: string; tempDir?: string }) {
    this.ffmpegPath = options?.ffmpegPath || getFfmpegBinaryPath();
    this.ffprobePath = options?.ffprobePath || getFfprobeBinaryPath();
    this.tempDir = options?.tempDir || path.join(os.tmpdir(), "scrollworld-transcode");

    if (!fs.existsSync(this.tempDir)) {
      try {
        fs.mkdirSync(this.tempDir, { recursive: true });
      } catch {
        this.tempDir = os.tmpdir();
      }
    }
  }

  public async isFfmpegAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      const proc = spawn(this.ffmpegPath, ["-version"]);
      proc.on("error", () => resolve(false));
      proc.on("close", (code) => resolve(code === 0));
    });
  }

  public async transcodeVideo(
    input: string | Buffer,
    preset: "desktop" | "mobile" = "desktop",
    options?: {
      outputFilePath?: string;
      onProgress?: (percent: number) => void;
    }
  ): Promise<TranscodeJobResult> {
    const config = TRANSCODE_PRESETS[preset];
    const timestamp = Date.now();
    let inputPath: string;
    let isTempInput = false;

    if (typeof input === "string" && fs.existsSync(input)) {
      inputPath = input;
    } else if (typeof input === "string" && (input.startsWith("http://") || input.startsWith("https://"))) {
      isTempInput = true;
      inputPath = path.join(this.tempDir, `remote_input_${timestamp}.mp4`);
      const response = await fetch(input);
      if (!response.ok) {
        throw new Error(`Failed to download remote video for transcoding: HTTP ${response.status}`);
      }
      const arrayBuf = await response.arrayBuffer();
      fs.writeFileSync(inputPath, Buffer.from(arrayBuf));
    } else {
      isTempInput = true;
      inputPath = path.join(this.tempDir, `raw_${timestamp}.mp4`);
      const buffer = typeof input === "string" ? Buffer.from(input) : input;
      fs.writeFileSync(inputPath, buffer);
    }

    const outputPath =
      options?.outputFilePath ||
      path.join(this.tempDir, `transcoded_${preset}_${timestamp}.mp4`);

    const hasFfmpeg = await this.isFfmpegAvailable();
    if (!hasFfmpeg) {
      if (isTempInput && fs.existsSync(inputPath)) {
        try { fs.unlinkSync(inputPath); } catch {}
      }
      throw new Error(`FFmpeg binary not available at "${this.ffmpegPath}". Transcoding aborted.`);
    }

    try {
      const args: string[] = [
        "-y",
        "-i", inputPath,
        "-c:v", config.videoCodec,
        "-g", config.gopSize.toString(),
        "-keyint_min", config.keyintMin.toString(),
        "-sc_threshold", "0",
        "-crf", config.crf.toString(),
        "-preset", config.preset,
        "-vf", config.unsharpFilter,
        "-movflags", config.movFlags,
      ];

      if (config.audioDisabled) {
        args.push("-an");
      }

      args.push(outputPath);

      await this.runCommand(args);

      if (!fs.existsSync(outputPath)) {
        throw new Error("Transcode output file was not created by FFmpeg.");
      }

      const stats = fs.statSync(outputPath);
      const outputBuffer = fs.readFileSync(outputPath);

      if (isTempInput && fs.existsSync(inputPath)) {
        try { fs.unlinkSync(inputPath); } catch {}
      }

      return {
        preset,
        outputPath,
        outputBuffer,
        durationSeconds: 4.0,
        fileSizeBytes: stats.size,
        gopSize: config.gopSize,
        keyintMin: config.keyintMin,
        crf: config.crf,
        isSimulated: false,
      };
    } catch (error: any) {
      if (isTempInput && fs.existsSync(inputPath)) {
        try { fs.unlinkSync(inputPath); } catch {}
      }
      throw new Error(`Video Transcoding Failed (${preset}): ${error?.message || error}`);
    }
  }

  private runCommand(args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const proc = spawn(this.ffmpegPath, args, { stdio: ["ignore", "pipe", "pipe"] });
      let stderr = "";

      proc.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      proc.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg exited with code ${code}. Stderr: ${stderr.slice(-400)}`));
        }
      });

      proc.on("error", (err) => {
        reject(err);
      });
    });
  }
}

export const videoTranscoder = new VideoTranscoder();
