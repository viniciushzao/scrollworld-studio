import { NextRequest, NextResponse } from "next/server";
import { IntakeRequestSchema } from "@/lib/types/api";
import { analyzeBrandAndGenerateScenes } from "@/lib/ai/gemini";
import { ProjectRepository } from "@/lib/db/repository";
import { validateBrandUrl, sanitizeAiPrompt } from "@/lib/security/sanitize";
import { withRateLimit, RateLimitPresets } from "@/lib/security/rate-limit";

/**
 * POST /api/intake
 * Intake brand URL or prompt, synthesize brand palette, tone of voice, and 5-7 continuous scenes
 * Protected by SSRF Validation, Prompt Injection Sanitization & Rate Limiting
 */
async function handleIntake(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = IntakeRequestSchema.parse(body);

    // 1. Strict SSRF Defense: Validate URL target if provided
    if (validatedData.url && validatedData.url.trim().length > 0) {
      const ssrfCheck = validateBrandUrl(validatedData.url);
      if (!ssrfCheck.valid) {
        return NextResponse.json(
          {
            success: false,
            error: "Security validation failed",
            details: ssrfCheck.error || "Invalid or blocked host (SSRF prevention).",
          },
          { status: 400 }
        );
      }
    }

    // 2. AI Prompt Injection & Prompt Sanitization
    if (validatedData.prompt) {
      validatedData.prompt = sanitizeAiPrompt(validatedData.prompt);
    }

    // 3. Run AI Synthesis (Gemini 3.6 Flash / Imagen 3 or intelligent fallback)
    const intakeResult = await analyzeBrandAndGenerateScenes(validatedData);

    // 4. Create the project in the database / repository
    const title =
      validatedData.brandName ||
      intakeResult.brand.name ||
      "Interactive Spatial Journey";

    const project = await ProjectRepository.create({
      title: title,
      description: `Spatial scroll experience for ${intakeResult.brand.name}. ${intakeResult.brand.toneOfVoice || ""}`,
      artStyle: validatedData.artStyle,
      cameraMotion: validatedData.cameraMotion,
      aspectRatio: validatedData.aspectRatio,
      dampingFactor: 0.18,
      lingerFactor: 0.3,
      scrollSensitivity: 1.0,
      enableAudio: false,
      brand: {
        name: intakeResult.brand.name,
        url: intakeResult.brand.url,
        logoUrl: intakeResult.brand.logoUrl,
        primaryColor: intakeResult.brand.primaryColor,
        secondaryColor: intakeResult.brand.secondaryColor,
        accentColor: intakeResult.brand.accentColor,
        typography: intakeResult.brand.typography,
        toneOfVoice: intakeResult.brand.toneOfVoice,
        keywords: intakeResult.brand.keywords,
        industry: intakeResult.brand.industry,
      },
      scenes: intakeResult.scenes.map((s) => ({
        order: s.order,
        title: s.title,
        subtitle: s.subtitle,
        description: s.description,
        prompt: s.prompt,
        cameraMovement: s.cameraMovement,
        focalPoint: s.focalPoint,
        stillPosterUrl: s.stillPosterUrl,
        videoDesktopUrl: s.videoDesktopUrl,
        videoMobileUrl: s.videoMobileUrl,
        diveScrollPx: s.diveScrollPx,
        lingerFactor: s.lingerFactor,
        duration: s.duration,
        ctaText: s.ctaText,
        ctaUrl: s.ctaUrl,
        tags: s.tags,
      })),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Brand intake and scene synthesis completed successfully",
        data: {
          project: project,
          intakeAnalysis: {
            brand: intakeResult.brand,
            totalTokensUsed: intakeResult.totalTokensUsed,
            estimatedCostUsd: intakeResult.estimatedCostUsd,
            executionMode: intakeResult.executionMode,
          },
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[API POST /api/intake] Error:", error);

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
        error: "Failed to process brand intake",
        details: error?.message,
      },
      { status: 500 }
    );
  }
}

export const POST = withRateLimit(handleIntake, RateLimitPresets.BRAND_INTAKE);
