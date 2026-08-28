"use client";

import React from "react";
import { GenerationTelemetryEvent } from "@/lib/types/studio";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  CheckCircle2,
  Coins,
  Sparkles,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GenerationTelemetryProps {
  currentEvent: GenerationTelemetryEvent | null;
  history: GenerationTelemetryEvent[];
}

const PIPELINE_STAGES = [
  { id: "scrape_brand", label: "Brand Intake", sub: "Palette & Hierarchy" },
  { id: "prompt_synthesis", label: "Gemini 3.6", sub: "Latent Motion Script" },
  { id: "gemini_stills", label: "Nano Banana 2", sub: "2K Cohesive Stills" },
  { id: "boundary_extraction", label: "FFmpeg QA", sub: "Boundary SSIM > 0.88" },
  { id: "monid_seedance_dives", label: "Seedance 2.0", sub: "Frame-Locked Dives" },
  { id: "ffmpeg_gop_transcode", label: "GOP Transcode", sub: "Desktop 8 / Mobile 4" },
  { id: "cloudflare_r2_upload", label: "Cloudflare R2", sub: "Edge Blob Cache" },
];

export function GenerationTelemetry({ currentEvent, history }: GenerationTelemetryProps) {
  if (!currentEvent) return null;

  const currentProgress = currentEvent.progress;
  const currentStep = currentEvent.step;

  return (
    <div className="rounded-3xl border border-cyan-500/30 bg-zinc-950/95 p-6 backdrop-blur-2xl shadow-2xl space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
            <Activity className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white text-base">Real-Time Worker Orchestrator</h3>
              <Badge variant="cyan">SSE Live</Badge>
            </div>
            <p className="text-xs text-zinc-400">
              Distributed worker pipeline executing on GPU cluster
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/5 text-xs text-zinc-300">
            <Coins className="h-3.5 w-3.5 text-amber-400" />
            <span>Est. Cost: </span>
            <strong className="text-white font-mono">
              ${(currentEvent.estimatedCostUsd ?? 0.18).toFixed(2)}
            </strong>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
        {PIPELINE_STAGES.map((stage, idx) => {
          const isDone =
            currentProgress >= ((idx + 1) / PIPELINE_STAGES.length) * 100 ||
            currentStep === "ready";
          const isActive = currentStep === stage.id;

          return (
            <div
              key={stage.id}
              className={cn(
                "p-2.5 rounded-xl border text-center transition-all duration-300 flex flex-col items-center justify-center",
                isActive
                  ? "border-cyan-400 bg-cyan-950/40 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400"
                  : isDone
                  ? "border-emerald-500/30 bg-emerald-950/20 text-zinc-300"
                  : "border-white/5 bg-zinc-900/30 text-zinc-600"
              )}
            >
              <div className="flex items-center justify-center mb-1">
                {isDone ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                ) : isActive ? (
                  <Sparkles className="h-3.5 w-3.5 text-cyan-400 animate-spin-slow" />
                ) : (
                  <span className="text-[10px] font-mono">{idx + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  "text-[11px] font-semibold block leading-tight",
                  isActive ? "text-cyan-300" : isDone ? "text-zinc-200" : "text-zinc-500"
                )}
              >
                {stage.label}
              </span>
              <span className="text-[9px] text-zinc-500 block truncate max-w-[80px]">
                {stage.sub}
              </span>
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-cyan-400 flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 animate-bounce" />
            {currentEvent.stepTitle}
          </span>
          <span className="text-zinc-300 font-bold">{currentProgress}%</span>
        </div>

        <Progress value={currentProgress} className="h-3" />
        <p className="text-xs text-zinc-400 font-mono mt-1">
          &gt; {currentEvent.message}
        </p>
      </div>
    </div>
  );
}
