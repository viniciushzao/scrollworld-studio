# 🌐 ScrollWorld Studio — The No-Code AI-Powered Scroll Cinematic Engine

> Plataforma web SaaS para criação e publicação de landing pages 3D cinematográficas controladas por scroll (*Apple-Style Scrollytelling*), integrando **Google Gemini (Imagen 3)** para geração de imagens, **ByteDance Seedance 2.0 (via Monid)** para encadeamento contínuo de vídeo e um **motor ultra-leve Vanilla JS (<12KB)** baseado em Blobs de memória.

---

## 📁 Estrutura de Documentação do Projeto

- [**IMPLEMENTATION_PLAN.md**](./IMPLEMENTATION_PLAN.md) — Roteiro técnico em 5 fases, máquina de estados BullMQ, FFmpeg workers, mitigação de riscos e critérios de QA.
- [**BUSINESS_MODEL.md**](./BUSINESS_MODEL.md) — Unit economics (COGS), planos de assinatura, modelos de créditos avulsos, margens de lucro e estratégia Go-to-Market.
- [**REVERSE_ENGINEERING_DOSSIER.md**](./REVERSE_ENGINEERING_DOSSIER.md) — Engenharia reversa detalhada da física de *Frame-Locking*, *Motion Handoff Contract*, *Seek Coalescing* e encoding de vídeo.

---

## 🛠️ Stack Tecnológica Recomendada

### Frontend (Studio & Player)
- **Framework:** Next.js 15 (App Router) + React 19
- **Estilização:** Tailwind CSS v4 + Radix UI (Shadcn UI)
- **Player Core:** Vanilla JS / TypeScript com Blob Object URLs em memória e `requestAnimationFrame` lerp loop
- **Distribuição:** Universal Script Embed (<12KB gzip), Web Component com Shadow DOM e pacote `@scrollworld/react`

### Backend & Orquestração
- **API Server:** Node.js (Fastify / NestJS) ou Next.js App Router API
- **Fila Assíncrona:** BullMQ / Resilient In-Memory State Machine (Execução em DAG)
- **Telemetria:** Server-Sent Events (SSE) com heartbeat para streaming de progresso em tempo real
- **Banco de Dados:** PostgreSQL com Prisma ORM (com fallback in-memory resiliente)

### Pipelines de IA & Mídia
- **Geração de Stills (2K):** Google Gemini 3.6 Flash / Nano Banana 2 Lite (`@google/genai`)
- **Cadeia Contínua de Vídeo:** Monid API (`bytedance /v1/video/seedance-2.0`) + Failover Kling 3.0
- **Processamento de Vídeo:** FFmpeg (`-g 8` Desktop 1080p / `-g 4` Mobile 720p)
- **Storage & CDN:** Cloudflare R2 / Local CDN Edge Streaming
