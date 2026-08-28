import * as fs from "fs";
import * as path from "path";

function findBinary(binaryName: "ffmpeg" | "ffprobe"): string {
  const envVar = binaryName === "ffmpeg" ? process.env.FFMPEG_PATH : process.env.FFPROBE_PATH;
  if (envVar && fs.existsSync(envVar)) {
    return envVar;
  }

  const root = process.cwd();
  const exeName = process.platform === "win32" ? `${binaryName}.exe` : binaryName;
  const platformPkg =
    process.platform === "win32"
      ? "win32-x64"
      : process.platform === "darwin"
      ? process.arch === "arm64"
        ? "darwin-arm64"
        : "darwin-x64"
      : process.arch === "arm64"
      ? "linux-arm64"
      : "linux-x64";

  const directPath = path.join(root, "node_modules", `@${binaryName}-installer`, platformPkg, exeName);
  if (fs.existsSync(directPath)) {
    return directPath;
  }

  const fallbackPkgPath = path.join(root, "node_modules", `@${binaryName}-installer`, binaryName, exeName);
  if (fs.existsSync(fallbackPkgPath)) {
    return fallbackPkgPath;
  }

  return binaryName;
}

export const FFMPEG_PATH = findBinary("ffmpeg");
export const FFPROBE_PATH = findBinary("ffprobe");

export function getFfmpegBinaryPath(): string {
  return FFMPEG_PATH;
}

export function getFfprobeBinaryPath(): string {
  return FFPROBE_PATH;
}
