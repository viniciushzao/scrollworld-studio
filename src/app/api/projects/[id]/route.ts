import { NextRequest, NextResponse } from "next/server";
import { ProjectRepository } from "@/lib/db/repository";
import { UpdateProjectSchema } from "@/lib/types/api";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
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

    return NextResponse.json({
      success: true,
      data: project,
    });
  } catch (error: any) {
    console.error("[API GET /api/projects/[id]] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch project",
        details: error?.message,
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const validatedData = UpdateProjectSchema.parse(body);

    const updated = await ProjectRepository.update(id, validatedData);

    if (!updated) {
      return NextResponse.json(
        {
          success: false,
          error: `Project with ID "${id}" not found`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Project updated successfully",
      data: updated,
    });
  } catch (error: any) {
    console.error("[API PUT /api/projects/[id]] Error:", error);

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
        error: "Failed to update project",
        details: error?.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const success = await ProjectRepository.delete(id);

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: `Project with ID "${id}" not found`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error: any) {
    console.error("[API DELETE /api/projects/[id]] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete project",
        details: error?.message,
      },
      { status: 500 }
    );
  }
}
