import { NextRequest } from "next/server";
import { orchestrator } from "@/lib/queue/orchestrator";
import { JobRepository } from "@/lib/db/repository";
import { PipelineProgressEvent } from "@/lib/queue/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params;
  const jobId = id;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let isClosed = false;
      let heartbeatTimer: NodeJS.Timeout | null = null;
      let unsubscribe: (() => void) | null = null;

      const cleanup = () => {
        if (isClosed) return;
        isClosed = true;
        if (heartbeatTimer) {
          clearInterval(heartbeatTimer);
          heartbeatTimer = null;
        }
        if (unsubscribe) {
          unsubscribe();
          unsubscribe = null;
        }
        try {
          controller.close();
        } catch {}
      };

      const sendEvent = (event: string, data: any) => {
        if (isClosed) return;
        try {
          const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(payload));
          const standardPayload = `data: ${JSON.stringify({ ...data, _type: event })}\n\n`;
          controller.enqueue(encoder.encode(standardPayload));
        } catch {
          cleanup();
        }
      };

      const sendHeartbeat = () => {
        if (isClosed) return;
        try {
          controller.enqueue(encoder.encode(": keep-alive\n\n"));
        } catch {
          cleanup();
        }
      };

      // 1. Send initial current state if job already exists
      try {
        const initialJob = await JobRepository.findById(jobId);
        if (initialJob) {
          sendEvent("telemetry", {
            jobId: initialJob.id,
            projectId: initialJob.projectId,
            stage: initialJob.currentStage,
            progress: initialJob.progress,
            totalTokensUsed: initialJob.totalTokensUsed,
            estimatedCostUsd: initialJob.estimatedCostUsd,
            activeSceneIndex: initialJob.activeSceneIndex,
            totalScenes: initialJob.totalScenes,
            previewUrl: initialJob.previewUrl,
            message: `Connected to job ${initialJob.id} at stage ${initialJob.currentStage}`,
            timestamp: Date.now(),
          });

          if (initialJob.logs && initialJob.logs.length > 0) {
            for (const log of [...initialJob.logs].reverse()) {
              sendEvent("log", log);
            }
          }

          if (initialJob.status === "COMPLETED" || initialJob.status === "FAILED") {
            sendEvent("complete", {
              jobId: initialJob.id,
              status: initialJob.status,
              progress: initialJob.progress,
            });
            cleanup();
            return;
          }
        }
      } catch (err) {
        console.warn("[SSE /api/sse/[id]] Could not load initial job state:", err);
      }

      // 2. Subscribe to live DAG progress updates
      unsubscribe = orchestrator.subscribe(jobId, (event: PipelineProgressEvent) => {
        if (isClosed) return;

        sendEvent("telemetry", event);
        sendEvent("stage", {
          stage: event.stage,
          stageTitle: event.stageTitle,
          progress: event.progress,
        });

        sendEvent("log", {
          level: event.error ? "ERROR" : "INFO",
          stage: event.stage,
          message: event.message,
          timestamp: event.timestamp,
        });

        if (event.sceneUpdated) {
          sendEvent("clip_ready", event.sceneUpdated);
        }

        if (event.stage === "COMPLETED" || event.stage === "FAILED") {
          sendEvent("complete", {
            jobId: event.jobId,
            status: event.stage,
            progress: event.progress,
            totalCost: event.estimatedCostUsd,
            totalTokens: event.totalTokensUsed,
          });
          setTimeout(() => {
            cleanup();
          }, 1000);
        }
      });

      heartbeatTimer = setInterval(sendHeartbeat, 15000);

      request.signal.addEventListener("abort", () => {
        cleanup();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform, no-store, must-revalidate",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
