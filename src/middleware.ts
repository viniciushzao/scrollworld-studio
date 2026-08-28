import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit, RateLimitPresets, createRateLimitHeaders } from "./lib/security/rate-limit";

export async function middleware(request: NextRequest) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (request.method === "OPTIONS" && (pathname.startsWith("/api/embed") || pathname.startsWith("/embed"))) {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  if (pathname.startsWith("/api/")) {
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : (request.headers.get("x-real-ip") || "unknown-ip");

    let rateLimitConfig = RateLimitPresets.PUBLIC_API;

    if (pathname.startsWith("/api/brand/scrape") || pathname.startsWith("/api/brand/intake")) {
      rateLimitConfig = RateLimitPresets.BRAND_INTAKE;
    } else if (pathname.startsWith("/api/ai/image") || pathname.startsWith("/api/generate/still")) {
      rateLimitConfig = RateLimitPresets.AI_IMAGE_GENERATION;
    } else if (pathname.startsWith("/api/ai/video") || pathname.startsWith("/api/generate/video")) {
      rateLimitConfig = RateLimitPresets.AI_VIDEO_GENERATION;
    }

    const rateLimitResult = await checkRateLimit(ip, rateLimitConfig);
    const rlHeaders = createRateLimitHeaders(rateLimitResult);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: "Too Many Requests",
          message: `Rate limit exceeded for endpoint. Retry after ${rateLimitResult.retryAfterSeconds} seconds.`,
        },
        {
          status: 429,
          headers: rlHeaders,
        }
      );
    }

    const response = NextResponse.next();
    for (const [key, value] of Object.entries(rlHeaders)) {
      response.headers.set(key, value);
    }
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
