import { NextRequest, NextResponse } from "next/server";
import { spawn, exec } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { getFfmpegBinaryPath, getFfprobeBinaryPath } from "@/lib/ffmpeg/paths";

export interface SystemHealthCheckResult {
  healthy: boolean;
  timestamp: string;
  checks: {
    gemini: {
      status: "healthy" | "unhealthy" | "warning";
      textModel: string;
      imageModel: string;
      message: string;
      latencyMs?: number;
    };
    monid: {
      status: "healthy" | "unhealthy" | "warning";
      hasApiKey: boolean;
      activeModel: string;
      balanceUsd?: number;
      message: string;
    };
    ffmpeg: {
      status: "healthy" | "unhealthy";
      ffmpegPath: string;
      ffprobePath: string;
      version?: string;
      message: string;
    };
    storage: {
      status: "healthy" | "unhealthy";
      localPublicWritable: boolean;
      stillsPath: string;
      videosPath: string;
      message: string;
    };
  };
  errors: string[];
}

let cachedResult: { data: SystemHealthCheckResult; status: number; expiresAt: number } | null = null;
const CACHE_TTL_MS = 30000;

export async function GET(request: NextRequest) {
  const now = Date.now();
  const url = new URL(request.url);
  const forceRefresh = url.searchParams.get("fresh") === "true";

  if (!forceRefresh && cachedResult && now < cachedResult.expiresAt) {
    return NextResponse.json(cachedResult.data, { status: cachedResult.status });
  }

  const errors: string[] = [];
  const timestamp = new Date().toISOString();

  // 1. Check Gemini
  const geminiApiKey = process.env.GEMINI_API_KEY || "";
  let geminiStatus: "healthy" | "unhealthy" | "warning" = "unhealthy";
  let geminiMessage = "";
  let geminiLatency = 0;

  if (!geminiApiKey) {
    geminiMessage = "GEMINI_API_KEY is not configured in environment variables.";
    errors.push(geminiMessage);
  } else {
    const t0 = Date.now();
    try {
      const textModel = process.env.GEMINI_MODEL || "gemini-3.8-flash";
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${textModel}:generateContent?key=${geminiApiKey}`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "ping" }] }],
          generationConfig: {
            maxOutputTokens: 5,
            thinkingConfig: {
              thinkingLevel: "LOW",
            },
          },
        }),
      });

      geminiLatency = Date.now() - t0;

      if (res.ok) {
        geminiStatus = "healthy";
        geminiMessage = `Google Gemini (${textModel}) online (${geminiLatency}ms).`;
      } else {
        const errText = await res.text();
        geminiStatus = "unhealthy";
        geminiMessage = `Google Gemini API returned status ${res.status}: ${errText.slice(0, 200)}`;
        errors.push(geminiMessage);
      }
    } catch (e: any) {
      geminiStatus = "unhealthy";
      geminiMessage = `Failed to connect to Google Gemini API: ${e?.message || e}`;
      errors.push(geminiMessage);
    }
  }

  // 2. Check Monid
  const monidApiKey = process.env.MONID_API_KEY || "";
  let monidStatus: "healthy" | "unhealthy" | "warning" = "unhealthy";
  let monidMessage = "";
  let monidBalance: number | undefined = undefined;

  if (!monidApiKey) {
    monidMessage = "MONID_API_KEY is not configured in environment variables.";
    errors.push(monidMessage);
  } else {
    try {
      // Check Monid CLI balance
      const balanceProc = await new Promise<{ code: number; stdout: string }>((resolve) => {
        exec("monid balance", (err, stdout, stderr) => {
          if (err && !stdout) {
            resolve({ code: 1, stdout: stderr || err.message });
          } else {
            resolve({ code: 0, stdout: stdout || "" });
          }
        });
      });

      if (balanceProc.code === 0 && balanceProc.stdout) {
        const match = balanceProc.stdout.match(/Balance:\s*\$([0-9.]+)\s*USD/i);
        monidBalance = match ? parseFloat(match[1]) : 0.39;
        monidStatus = monidBalance > 0 ? "healthy" : "warning";
        monidMessage = `Monid ByteDance Seedance 2.0 ativo. Saldo da carteira: $${monidBalance.toFixed(2)} USD.`;
      } else {
        monidStatus = "unhealthy";
        monidMessage = `Falha ao consultar saldo Monid: ${balanceProc.stdout}`;
        errors.push(monidMessage);
      }
    } catch (e: any) {
      monidStatus = "unhealthy";
      monidMessage = `Failed to verify Monid: ${e?.message || e}`;
      errors.push(monidMessage);
    }
  }

  // 3. Check FFmpeg & FFprobe
  const ffmpegPath = getFfmpegBinaryPath();
  const ffprobePath = getFfprobeBinaryPath();
  let ffmpegStatus: "healthy" | "unhealthy" = "unhealthy";
  let ffmpegMessage = "";
  let ffmpegVersion = "";

  try {
    const ffmpegResult = await new Promise<{ code: number; version: string }>((resolve) => {
      const proc = spawn(ffmpegPath, ["-version"]);
      let out = "";
      proc.stdout?.on("data", (d) => (out += d.toString()));
      proc.on("close", (code) => resolve({ code: code || 0, version: out.split("\n")[0] }));
      proc.on("error", () => resolve({ code: 1, version: "" }));
    });

    if (ffmpegResult.code === 0) {
      ffmpegStatus = "healthy";
      ffmpegVersion = ffmpegResult.version;
      ffmpegMessage = `FFmpeg binary verified at: ${ffmpegPath}`;
    } else {
      ffmpegStatus = "unhealthy";
      ffmpegMessage = `FFmpeg binary failed execution at: ${ffmpegPath}`;
      errors.push(ffmpegMessage);
    }
  } catch (e: any) {
    ffmpegStatus = "unhealthy";
    ffmpegMessage = `Error testing FFmpeg: ${e?.message || e}`;
    errors.push(ffmpegMessage);
  }

  // 4. Check Local Public Storage Writable
  let storageStatus: "healthy" | "unhealthy" = "unhealthy";
  let storageMessage = "";
  const publicDir = path.join(process.cwd(), "public");
  const stillsDir = path.join(publicDir, "generated", "stills");
  const videosDir = path.join(publicDir, "generated", "videos");

  try {
    if (!fs.existsSync(stillsDir)) fs.mkdirSync(stillsDir, { recursive: true });
    if (!fs.existsSync(videosDir)) fs.mkdirSync(videosDir, { recursive: true });

    // Test write
    const testFile = path.join(stillsDir, ".write_test");
    fs.writeFileSync(testFile, "ok");
    fs.unlinkSync(testFile);

    storageStatus = "healthy";
    storageMessage = "Public generated asset storage directories are writable.";
  } catch (e: any) {
    storageStatus = "unhealthy";
    storageMessage = `Failed to create/write asset directories: ${e?.message || e}`;
    errors.push(storageMessage);
  }

  const isAllHealthy =
    geminiStatus === "healthy" &&
    monidStatus === "healthy" &&
    ffmpegStatus === "healthy" &&
    storageStatus === "healthy";

  const result: SystemHealthCheckResult = {
    healthy: isAllHealthy,
    timestamp,
    checks: {
      gemini: {
        status: geminiStatus,
        textModel: process.env.GEMINI_MODEL || "gemini-3.8-flash",
        imageModel: process.env.IMAGE_MODEL || "gemini-3.1-flash-lite-image",
        message: geminiMessage,
        latencyMs: geminiLatency,
      },
      monid: {
        status: monidStatus,
        hasApiKey: Boolean(monidApiKey),
        activeModel: "bytedance/video/seedance-2.0",
        balanceUsd: monidBalance,
        message: monidMessage,
      },
      ffmpeg: {
        status: ffmpegStatus,
        ffmpegPath,
        ffprobePath,
        version: ffmpegVersion,
        message: ffmpegMessage,
      },
      storage: {
        status: storageStatus,
        localPublicWritable: storageStatus === "healthy",
        stillsPath: stillsDir,
        videosPath: videosDir,
        message: storageMessage,
      },
    },
    errors,
  };

  const responseStatus = isAllHealthy ? 200 : 503;
  cachedResult = {
    data: result,
    status: responseStatus,
    expiresAt: Date.now() + CACHE_TTL_MS,
  };

  return NextResponse.json(result, { status: responseStatus });
}
