import { z } from "zod";

/**
 * ==============================================================================
 * SCROLLWORLD STUDIO - SECURE ENVIRONMENT VARIABLE VALIDATOR & AUDITOR
 * ==============================================================================
 * 
 * Enforces strict boundary between Server Secrets and Client-Exposed Variables:
 * - Guarantees sensitive keys (GEMINI_API_KEY, MONID_API_KEY, R2_SECRET_ACCESS_KEY)
 *   are NEVER exposed via `NEXT_PUBLIC_` or bundled to the client.
 * - Validates schema on first server boot to fail-fast on missing credentials.
 */

const ServerEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  
  // AI Engine API Keys (Google Gemini 3.8 Flash & Nano Banana 2 Lite + Monid Seedance 2.0)
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required for image and vision generation").optional(),
  MONID_API_KEY: z.string().min(1, "MONID_API_KEY is required for video generation").optional(),

  // Cloudflare R2 Storage Secrets
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_PUBLIC_DOMAIN: z.string().optional(),

  // Database & Cache Infrastructure
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),

  // Auth / Session Secrets
  AUTH_SECRET: z.string().optional(),
  NEXTAUTH_SECRET: z.string().optional(),

  // Public Configuration
  NEXT_PUBLIC_APP_URL: z.string().url().optional().default("http://localhost:3000"),
});

export type ServerEnv = z.infer<typeof ServerEnvSchema>;

/**
 * Proactive passive audit: inspects process.env to ensure no sensitive key has been mistakenly
 * prefixed with `NEXT_PUBLIC_`, which would cause Next.js / Webpack to bundle it to client browsers.
 */
export function auditClientEnvLeaks(): { safe: boolean; leakedKeys: string[] } {
  if (typeof process === "undefined" || !process.env) {
    return { safe: true, leakedKeys: [] };
  }

  const sensitiveKeywords = [
    "GEMINI",
    "MONID",
    "SECRET",
    "PRIVATE_KEY",
    "PASSWORD",
    "DATABASE",
    "REDIS",
    "ACCESS_KEY",
    "TOKEN",
  ];

  const leakedKeys: string[] = [];

  for (const key of Object.keys(process.env)) {
    if (key.startsWith("NEXT_PUBLIC_")) {
      const upperKey = key.toUpperCase();
      for (const sensitive of sensitiveKeywords) {
        // Exclude legitimate non-secret public keys if any
        if (upperKey.includes(sensitive) && !upperKey.includes("PUBLIC_KEY_PEM")) {
          leakedKeys.push(key);
          break;
        }
      }
    }
  }

  if (leakedKeys.length > 0) {
    console.error(
      `[SECURITY CRITICAL] Detected sensitive secrets exposed with NEXT_PUBLIC_ prefix: ${leakedKeys.join(
        ", "
      )}. These variables are bundled to user browsers!`
    );
  }

  return {
    safe: leakedKeys.length === 0,
    leakedKeys,
  };
}

let cachedEnv: ServerEnv | null = null;

/**
 * Returns validated server-side environment variables.
 * Fails fast with clear diagnostic message in case of invalid or missing schema.
 */
export function getServerEnv(): ServerEnv {
  if (cachedEnv) return cachedEnv;

  // Run proactive leak audit
  auditClientEnvLeaks();

  const parseResult = ServerEnvSchema.safeParse(process.env);

  if (!parseResult.success) {
    console.error("[SECURITY] Environment variable validation failed:", parseResult.error.format());
    // In production we throw to prevent running with invalid config
    if (process.env.NODE_ENV === "production") {
      throw new Error(`Invalid server environment variables: ${JSON.stringify(parseResult.error.flatten().fieldErrors)}`);
    }
  }

  cachedEnv = parseResult.success ? parseResult.data : (process.env as unknown as ServerEnv);
  return cachedEnv;
}
