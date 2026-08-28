import dns from "dns";
import { z } from "zod";

interface IPRange {
  start: number;
  end: number;
  name: string;
}

function ipToUint(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let uint = 0;
  for (const part of parts) {
    const num = Number(part);
    if (isNaN(num) || num < 0 || num > 255 || (part.length > 1 && part.startsWith("0"))) {
      return null;
    }
    uint = (uint << 8) | num;
  }
  return uint >>> 0;
}

function cidrToRange(ip: string, prefixLen: number, name: string): IPRange {
  const base = ipToUint(ip)!;
  const mask = prefixLen === 0 ? 0 : (~0 << (32 - prefixLen)) >>> 0;
  const start = (base & mask) >>> 0;
  const end = (start | ~mask) >>> 0;
  return { start, end, name };
}

const BLOCKED_IPV4_RANGES: IPRange[] = [
  cidrToRange("0.0.0.0", 8, "Current Network (RFC 1122)"),
  cidrToRange("10.0.0.0", 8, "Private Network RFC 1918"),
  cidrToRange("100.64.0.0", 10, "Shared Address Space RFC 6598"),
  cidrToRange("127.0.0.0", 8, "Loopback RFC 1122"),
  cidrToRange("169.254.0.0", 16, "Link-Local / Cloud Metadata RFC 3927"),
  cidrToRange("172.16.0.0", 12, "Private Network RFC 1918"),
  cidrToRange("192.0.0.0", 24, "IETF Protocol Assignments RFC 6890"),
  cidrToRange("192.0.2.0", 24, "TEST-NET-1 RFC 5737"),
  cidrToRange("192.88.99.0", 24, "6to4 Relay Anycast RFC 7526"),
  cidrToRange("192.168.0.0", 16, "Private Network RFC 1918"),
  cidrToRange("198.18.0.0", 15, "Benchmark Tests RFC 2544"),
  cidrToRange("198.51.100.0", 24, "TEST-NET-2 RFC 5737"),
  cidrToRange("203.0.113.0", 24, "TEST-NET-3 RFC 5737"),
  cidrToRange("224.0.0.0", 4, "Multicast RFC 5771"),
  cidrToRange("240.0.0.0", 4, "Reserved RFC 1112"),
  cidrToRange("255.255.255.255", 32, "Broadcast RFC 919"),
];

function isBlockedIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase().trim();
  if (normalized === "::1" || normalized === "::" || normalized === "0:0:0:0:0:0:0:1" || normalized === "0:0:0:0:0:0:0:0") {
    return true;
  }
  if (normalized.startsWith("::ffff:") || normalized.startsWith("0:0:0:0:0:ffff:")) {
    const v4Part = normalized.replace(/^.*:ffff:/, "");
    if (v4Part.includes(".")) {
      return isBlockedIPv4(v4Part);
    }
    return true;
  }
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) {
    return true;
  }
  if (/^fe[89ab]/i.test(normalized)) {
    return true;
  }
  if (normalized.startsWith("ff")) {
    return true;
  }
  if (normalized.startsWith("2001:db8:") || normalized.startsWith("2001:0db8:")) {
    return true;
  }
  return false;
}

export function isBlockedIPv4(ip: string): boolean {
  const uint = ipToUint(ip);
  if (uint === null) return true;

  for (const range of BLOCKED_IPV4_RANGES) {
    if (uint >= range.start && uint <= range.end) {
      return true;
    }
  }
  return false;
}

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "local",
  "broadcasthost",
  "ip6-localhost",
  "ip6-loopback",
  "instance-data",
  "metadata.google.internal",
  "metadata.internal",
  "169.254.169.254",
  "metadata",
]);

const BLOCKED_TLD_SUFFIXES = [
  ".local",
  ".localhost",
  ".internal",
  ".lan",
  ".corp",
  ".home",
  ".intranet",
  ".test",
  ".invalid",
  ".example",
];

export interface UrlValidationResult {
  valid: boolean;
  error?: string;
  cleanUrl?: string;
  hostname?: string;
}

export function validateBrandUrl(inputUrl: string): UrlValidationResult {
  if (!inputUrl || typeof inputUrl !== "string") {
    return { valid: false, error: "URL must be a non-empty string" };
  }

  const trimmed = inputUrl.trim();
  if (trimmed.length > 2048) {
    return { valid: false, error: "URL exceeds maximum length of 2048 characters" };
  }

  let parsed: URL;
  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    parsed = new URL(withProtocol);
  } catch {
    return { valid: false, error: "Invalid URL syntax" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { valid: false, error: `Disallowed protocol: ${parsed.protocol}. Only http: and https: are permitted.` };
  }

  if (parsed.username || parsed.password) {
    return { valid: false, error: "URLs containing embedded user credentials are not allowed" };
  }

  if (parsed.port && parsed.port !== "80" && parsed.port !== "443") {
    return { valid: false, error: `Disallowed port: ${parsed.port}. Only standard HTTP/HTTPS ports (80, 443) are allowed.` };
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^\.+|\.+$/g, "");

  if (!hostname || hostname.length === 0) {
    return { valid: false, error: "Hostname cannot be empty" };
  }

  if (BLOCKED_HOSTNAMES.has(hostname)) {
    return { valid: false, error: `Access to internal host '${hostname}' is forbidden` };
  }

  for (const suffix of BLOCKED_TLD_SUFFIXES) {
    if (hostname.endsWith(suffix) || hostname === suffix.slice(1)) {
      return { valid: false, error: `Access to internal domain '${suffix}' is forbidden` };
    }
  }

  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
    if (isBlockedIPv4(hostname)) {
      return { valid: false, error: `Access to private/reserved IP '${hostname}' is forbidden` };
    }
  }

  const cleanIpv6 = hostname.replace(/^\[|\]$/g, "");
  if (cleanIpv6.includes(":")) {
    if (isBlockedIPv6(cleanIpv6)) {
      return { valid: false, error: `Access to private/reserved IPv6 '${hostname}' is forbidden` };
    }
  }

  if (/^(0x[0-9a-f]+|\d+)$/i.test(hostname)) {
    return { valid: false, error: "Numeric or hex obfuscated IP addresses are forbidden" };
  }

  return {
    valid: true,
    cleanUrl: parsed.toString(),
    hostname,
  };
}

export async function isSafePublicUrl(urlStr: string): Promise<{ safe: boolean; reason?: string; resolvedIp?: string }> {
  const initialCheck = validateBrandUrl(urlStr);
  if (!initialCheck.valid || !initialCheck.hostname) {
    return { safe: false, reason: initialCheck.error };
  }

  const hostname = initialCheck.hostname;

  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
    return { safe: true, resolvedIp: hostname };
  }

  try {
    const addresses = await dns.promises.lookup(hostname, { all: true, verbatim: true });
    if (!addresses || addresses.length === 0) {
      return { safe: false, reason: `Could not resolve DNS for host: ${hostname}` };
    }

    for (const record of addresses) {
      if (record.family === 4) {
        if (isBlockedIPv4(record.address)) {
          return {
            safe: false,
            reason: `Host ${hostname} resolves to blocked private/internal IPv4: ${record.address}`,
            resolvedIp: record.address,
          };
        }
      } else if (record.family === 6) {
        if (isBlockedIPv6(record.address)) {
          return {
            safe: false,
            reason: `Host ${hostname} resolves to blocked private/internal IPv6: ${record.address}`,
            resolvedIp: record.address,
          };
        }
      }
    }

    return { safe: true, resolvedIp: addresses[0]?.address };
  } catch (err: any) {
    return { safe: false, reason: `DNS lookup failure for host ${hostname}: ${err.message || err}` };
  }
}

export async function safeFetch(
  urlStr: string,
  options: RequestInit & { maxRedirects?: number; timeoutMs?: number } = {}
): Promise<Response> {
  const maxRedirects = options.maxRedirects ?? 3;
  const timeoutMs = options.timeoutMs ?? 10000;

  let currentUrl = urlStr;
  let redirectsCount = 0;

  while (redirectsCount <= maxRedirects) {
    const dnsSafety = await isSafePublicUrl(currentUrl);
    if (!dnsSafety.safe) {
      throw new Error(`SSRF Prevention: Refused to fetch unsafe URL (${dnsSafety.reason})`);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(currentUrl, {
        ...options,
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "User-Agent": "ScrollWorld-Studio-Bot/1.0 (+https://scrollworld.studio/bot-info)",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");
        if (!location) {
          throw new Error(`Redirect response (${response.status}) missing Location header`);
        }

        redirectsCount++;
        if (redirectsCount > maxRedirects) {
          throw new Error(`Exceeded maximum allowed redirects (${maxRedirects})`);
        }

        currentUrl = new URL(location, currentUrl).toString();
        continue;
      }

      return response;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === "AbortError") {
        throw new Error(`Request timed out after ${timeoutMs}ms`);
      }
      throw err;
    }
  }

  throw new Error("Too many redirects");
}

const PROMPT_INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|directives|rules)/gi,
  /disregard\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|directives|rules)/gi,
  /bypass\s+(safety|content\s+filters|moderation|guidelines)/gi,
  /jailbreak/gi,
  /dan\s+mode/gi,
  /developer\s+mode\s+(enabled|on)/gi,
  /system\s*:\s*/gi,
  /human\s*:\s*/gi,
  /assistant\s*:\s*/gi,
  /<\|im_start\|>/gi,
  /<\|im_end\|>/gi,
  /\[INST\]/gi,
  /\[\/INST\]/gi,
  /<<SYS>>/gi,
  /<<\/SYS>>/gi,
  /<system>/gi,
  /<\/system>/gi,
  /output\s+the\s+(system\s+prompt|initial\s+instructions)/gi,
  /reveal\s+your\s+(instructions|system\s+prompt|prompt)/gi,
  /repeat\s+(everything|the\s+words\s+above)/gi,
];

const ZERO_WIDTH_REGEX = /[\u200B-\u200D\uFEFF\u00A0\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/g;

export function sanitizeAiPrompt(rawPrompt: string, maxLength: number = 2000): string {
  if (!rawPrompt || typeof rawPrompt !== "string") return "";

  let clean = rawPrompt.normalize("NFKC").replace(ZERO_WIDTH_REGEX, " ");
  clean = clean.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    clean = clean.replace(pattern, "[sanitized]");
  }

  clean = clean.replace(/`{3,}/g, "'''");
  clean = clean.replace(/\s+/g, " ").trim();

  if (clean.length > maxLength) {
    clean = clean.substring(0, maxLength).trim();
  }

  return clean;
}

const NSFW_TRIGGER_SUBSTITUTIONS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\b(bedroom|bedrooms|bed|beds|bedding|mattress|headboard)\b/gi, replacement: "architectural lounge suite" },
  { pattern: /\b(master\s+bedroom|hotel\s+room|motel\s+room|boudoir)\b/gi, replacement: "luxury minimalist living chamber" },
  { pattern: /\b(silk\s+sheets|bed\s+sheets|duvet|pillow\s+fight)\b/gi, replacement: "sculptural linen textiles" },
  { pattern: /\b(bathroom|bathrooms|shower|showers|bathtub|bathtubs|jacuzzi|hot\s+tub)\b/gi, replacement: "hydro wellness sanctuary with stone basin" },
  { pattern: /\b(spa|massage|sauna|steam\s+room)\b/gi, replacement: "zen architectural wellness pavilion" },
  { pattern: /\b(wine|red\s+wine|white\s+wine|champagne|liquor|whiskey|vodka|cocktail|beer|alcohol)\b/gi, replacement: "artisanal culinary beverage in crystal glassware" },
  { pattern: /\b(wine\s+glass|wine\s+bottle)\b/gi, replacement: "sculptural glassware bottle" },
  { pattern: /\b(waterfall|waterfalls|cascade|cascades)\b/gi, replacement: "cascading architectural water feature" },
  { pattern: /\b(nude|naked|skin|sensual|erotic|provocative|lingerie|underwear|bikini|swimsuit|cleavage|body|flesh)\b/gi, replacement: "sculptural form" },
  { pattern: /\b(person|people|woman|man|model|girl|boy|human|couple|crowd)\b/gi, replacement: "sculptural focal point" },
];

export const SAFE_ARCHITECTURAL_CLAUSES = [
  "empty",
  "unoccupied",
  "architectural design",
  "editorial interior photography",
  "museum quality lighting",
  "no people",
  "static clean atmosphere",
  "solid seamless background",
  "hyper-detailed 8k",
].join(", ");

export function sanitizeArchitecturalPrompt(
  prompt: string,
  options?: { appendSafeClauses?: boolean; customClauses?: string }
): string {
  if (!prompt || typeof prompt !== "string") return "";

  let sanitized = sanitizeAiPrompt(prompt);

  for (const { pattern, replacement } of NSFW_TRIGGER_SUBSTITUTIONS) {
    sanitized = sanitized.replace(pattern, replacement);
  }

  const shouldAppend = options?.appendSafeClauses !== false;
  if (shouldAppend) {
    const extra = options?.customClauses ? `, ${options.customClauses}` : "";
    sanitized = `${sanitized}, ${SAFE_ARCHITECTURAL_CLAUSES}${extra}`;
  }

  return sanitized.replace(/\s+,/g, ",").replace(/,{2,}/g, ",").trim();
}

export const BrandIntakeUrlSchema = z.string().min(1, "URL is required").max(2048).refine(
  (url) => {
    const result = validateBrandUrl(url);
    return result.valid;
  },
  { message: "Invalid URL or unauthorized host (SSRF protection enabled)" }
);

export const AiPromptInputSchema = z.object({
  prompt: z.string().min(1, "Prompt is required").max(3000),
  aspectRatio: z.enum(["16:9", "9:16", "3:2", "1:1"]).default("16:9"),
  isArchitectural: z.boolean().default(true),
  appendSafeClauses: z.boolean().default(true),
});

export const SceneGenerationConfigSchema = z.object({
  brandUrl: BrandIntakeUrlSchema.optional(),
  brandName: z.string().min(1).max(120),
  conceptPrompt: z.string().min(1).max(2000),
  aspectRatio: z.enum(["16:9", "9:16"]).default("16:9"),
  scenesCount: z.number().int().min(2).max(12).default(6),
  modelProvider: z.enum(["gemini-imagen-3", "monid-seedance-2", "kling-3"]).default("gemini-imagen-3"),
});
