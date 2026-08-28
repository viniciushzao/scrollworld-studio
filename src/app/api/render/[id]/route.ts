import { NextRequest, NextResponse } from "next/server";
import { RenderJobRequestSchema } from "@/lib/types/api";
import { orchestrator } from "@/lib/queue/orchestrator";
import { ProjectRepository } from "@/lib/db/repository";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    let id = "";
    if (context?.params) {
      const resolved = typeof (context.params as any)?.then === "function" 
        ? await context.params 
        : context.params;
      id = resolved?.id || "";
    }
    if (!id) {
      const parts = request.nextUrl.pathname.split("/").filter(Boolean);
      id = parts[parts.length - 1] || "";
    }

    let body = {};
    try {
      body = await request.json();
    } catch {}

    const validatedData = RenderJobRequestSchema.parse(body);

    const project = await ProjectRepository.findByIdOrSlug(id);
    if (!project) {
      return NextResponse.json(
        {
          success: false,
          error: `Project with ID or slug "${id}" not found`,
        },
        { status: 404 }
      );
    }

    if (!project.scenes || project.scenes.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Project has no scenes configured to render. Please add scenes or run /api/intake first.",
        },
        { status: 400 }
      );
    }

    const result = await orchestrator.startPipeline(project.id, {
      mode: validatedData.mode,
      aspectRatio: validatedData.aspectRatio,
      forceRegenerate: validatedData.forceRegenerate,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Video rendering pipeline orchestrated successfully",
        data: {
          jobId: result.jobId,
          projectId: result.projectId,
          status: result.status,
          stage: result.stage,
          sseUrl: `/api/sse/${result.jobId}`,
          projectUrl: `/studio/${project.slug || project.id}`,
        },
      },
      { status: 202 }
    );
  } catch (error: any) {
    console.error("[API POST /api/render/[id]] Error:", error);

    if (error?.name === "ZodError") {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to initiate render pipeline",
        details: error?.message,
      },
      { status: 500 }
    );
  }
}
