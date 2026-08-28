import { NextResponse } from "next/server";

export interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
  prefix?: string;
  cost?: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfterSeconds?: number;
}

export const RateLimitPresets = {
  BRAND_INTAKE: {
    maxRequests: 10,
    windowSeconds: 60,
    prefix: "rl:brand_intake",
  } satisfies RateLimitConfig,

  AI_IMAGE_GENERATION: {
    maxRequests: 15,
    windowSeconds: 60,
    prefix: "rl:ai_img",
  } satisfies RateLimitConfig,

  AI_VIDEO_GENERATION: {
    maxRequests: 5,
    windowSeconds: 60,
    prefix: "rl:ai_video",
  } satisfies RateLimitConfig,

  PUBLIC_API: {
    maxRequests: 60,
    windowSeconds: 60,
    prefix: "rl:public_api",
  } satisfies RateLimitConfig,

  EXPORT_API: {
    maxRequests: 20,
    windowSeconds: 60,
    prefix: "rl:export",
  } satisfies RateLimitConfig,
};

interface MemoryTokenBucket {
  tokens: number;
  lastRefill: number;
  expiresAt: number;
}

class MemoryRateLimiter {
  private store: Map<string, MemoryTokenBucket> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof setInterval !== "undefined") {
      this.cleanupInterval = setInterval(() => this.prune(), 60000);
      if (this.cleanupInterval && typeof this.cleanupInterval.unref === "function") {
        this.cleanupInterval.unref();
      }
    }
  }

  public check(key: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now();
    const windowMs = config.windowSeconds * 1000;
    const cost = config.cost ?? 1;
    const maxTokens = config.maxRequests;
    const refillRate = maxTokens / windowMs;

    let bucket = this.store.get(key);

    if (!bucket || now >= bucket.expiresAt) {
      bucket = {
        tokens: maxTokens,
        lastRefill: now,
        expiresAt: now + windowMs,
      };
    } else {
      const elapsedTime = now - bucket.lastRefill;
      const refilledTokens = elapsedTime * refillRate;
      bucket.tokens = Math.min(maxTokens, bucket.tokens + refilledTokens);
      bucket.lastRefill = now;
    }

    const resetTimestampSec = Math.ceil(bucket.expiresAt / 1000);

    if (bucket.tokens >= cost) {
      bucket.tokens -= cost;
      this.store.set(key, bucket);
      return {
        success: true,
        limit: maxTokens,
        remaining: Math.floor(bucket.tokens),
        reset: resetTimestampSec,
      };
    } else {
      const timeNeededMs = ((cost - bucket.tokens) / refillRate);
      const retryAfterSeconds = Math.max(1, Math.ceil(timeNeededMs / 1000));
      return {
        success: false,
        limit: maxTokens,
        remaining: 0,
        reset: resetTimestampSec,
        retryAfterSeconds,
      };
    }
  }

  private prune() {
    const now = Date.now();
    for (const [key, bucket] of this.store.entries()) {
      if (now >= bucket.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  public destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }
}

const globalMemoryLimiter = new MemoryRateLimiter();

export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const prefix = config.prefix ?? "rl:default";
  const key = `${prefix}:${identifier}`;
  return globalMemoryLimiter.check(key, config);
}

export function getClientIdentifier(req: Request): string {
  const headers = req.headers;
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    const ip = forwardedFor.split(",")[0].trim();
    if (ip) return ip;
  }

  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const cfConnectingIp = headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();

  return "anonymous-client";
}

export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(result.reset),
  };

  if (!result.success && result.retryAfterSeconds !== undefined) {
    headers["Retry-After"] = String(result.retryAfterSeconds);
  }

  return headers;
}

export function withRateLimit<T extends (...args: any[]) => Promise<Response>>(
  handler: T,
  config: RateLimitConfig = RateLimitPresets.PUBLIC_API
): T {
  return (async (...args: Parameters<T>): Promise<Response> => {
    const req = args[0] as Request;
    const clientId = getClientIdentifier(req);
    const result = await checkRateLimit(clientId, config);
    const rateLimitHeaders = createRateLimitHeaders(result);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: `Too many requests. Please retry in ${result.retryAfterSeconds} seconds.`,
          retryAfter: result.retryAfterSeconds,
        },
        {
          status: 429,
          headers: rateLimitHeaders,
        }
      );
    }

    const response = await handler(...args);

    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value);
    }

    return response;
  }) as T;
}
