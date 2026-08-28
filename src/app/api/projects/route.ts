import { NextRequest, NextResponse } from "next/server";
import { ProjectRepository } from "@/lib/db/repository";
import { CreateProjectSchema } from "@/lib/types/api";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined;

    const projects = await ProjectRepository.list({ status, limit });

    return NextResponse.json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error: any) {
    console.error("[API GET /api/projects] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch projects",
        details: error?.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = CreateProjectSchema.parse(body);

    const project = await ProjectRepository.create(validatedData);

    return NextResponse.json(
      {
        success: true,
        message: "Project created successfully",
        data: project,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[API POST /api/projects] Error:", error);

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
        error: "Failed to create project",
        details: error?.message,
      },
      { status: 500 }
    );
  }
}
