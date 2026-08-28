import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' blob: data: https:;
  media-src 'self' blob: data: https:;
  font-src 'self' https://fonts.gstatic.com data:;
  connect-src 'self' blob: data: https: wss:;
  worker-src 'self' blob:;
  frame-ancestors 'self' *;
  form-action 'self';
  base-uri 'self';
  object-src 'none';
  ${isProd ? "upgrade-insecure-requests;" : ""}
`.replace(/\s{2,}/g, " ").trim();

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: ContentSecurityPolicy,
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  ...(isProd
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ["@prisma/client", "prisma", "bullmq", "ioredis"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/api/embed/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
        ],
      },
      {
        source: "/embed/:path*",
        headers: [
          { key: "X-Frame-Options", value: "ALLOWALL" },
        ],
      },
    ];
  },
};

export default nextConfig;
