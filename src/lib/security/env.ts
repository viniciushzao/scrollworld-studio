import { z } from "zod";

const ServerEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required for image and vision generation").optional(),
  MONID_API_KEY: z.string().min(1, "MONID_API_KEY is required for video generation").optional(),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_PUBLIC_DOMAIN: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
  AUTH_SECRET: z.string().optional(),
  NEXTAUTH_SECRET: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional().default("http://localhost:3000"),
});

export type ServerEnv = z.infer<typeof ServerEnvSchema>;

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

export function getServerEnv(): ServerEnv {
  if (cachedEnv) return cachedEnv;

  auditClientEnvLeaks();

  const parseResult = ServerEnvSchema.safeParse(process.env);

  if (!parseResult.success) {
    console.error("[SECURITY] Environment variable validation failed:", parseResult.error.format());
    if (process.env.NODE_ENV === "production") {
      throw new Error(`Invalid server environment variables: ${JSON.stringify(parseResult.error.flatten().fieldErrors)}`);
    }
  }

  cachedEnv = parseResult.success ? parseResult.data : (process.env as unknown as ServerEnv);
  return cachedEnv;
}
