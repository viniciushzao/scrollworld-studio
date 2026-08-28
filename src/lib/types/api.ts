import { z } from "zod";

export const ArtStylePresetSchema = z.enum([
  "hyper-realistic",
  "cinematic-scifi",
  "luxury-editorial",
  "minimalist-apple",
  "cyberpunk-neon",
  "organic-nature",
  "retro-futuristic",
  "isometric-3d",
]);

export const CameraMotionSchema = z.enum([
  "forward-dive",
  "orbital-pan",
  "macro-zoom",
  "infinite-plunge",
  "spiral-ascend",
  "gentle-glide",
]);

export const AspectRatioSchema = z.enum(["16:9", "9:16"]);

export const CreateBrandInputSchema = z.object({
  name: z.string().min(1, "Brand name is required"),
  url: z.string().url().optional().or(z.literal("")),
  logoUrl: z.string().url().optional().or(z.literal("")),
  primaryColor: z.string().regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/).default("#6366f1"),
  secondaryColor: z.string().regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/).default("#a855f7"),
  accentColor: z.string().regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/).default("#ec4899"),
  typography: z.string().default("Inter, sans-serif"),
  toneOfVoice: z.string().optional(),
  keywords: z.array(z.string()).default([]),
  industry: z.string().optional(),
});

export const CreateSceneInputSchema = z.object({
  order: z.number().int().nonnegative(),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  prompt: z.string().min(3),
  cameraMovement: CameraMotionSchema.default("forward-dive"),
  focalPoint: z.string().optional(),
  stillPosterUrl: z.string().optional(),
  knockoutUrl: z.string().optional(),
  videoDesktopUrl: z.string().optional(),
  videoMobileUrl: z.string().optional(),
  diveScrollPx: z.number().default(1200),
  lingerFactor: z.number().min(0).max(1).default(0.3),
  duration: z.number().default(4.0),
  ctaText: z.string().optional(),
  ctaUrl: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export const CreateProjectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  artStyle: ArtStylePresetSchema.default("hyper-realistic"),
  cameraMotion: CameraMotionSchema.default("forward-dive"),
  aspectRatio: AspectRatioSchema.default("16:9"),
  dampingFactor: z.number().min(0.01).max(1.0).default(0.18),
  lingerFactor: z.number().min(0).max(1.0).default(0.3),
  scrollSensitivity: z.number().min(0.1).max(5.0).default(1.0),
  enableAudio: z.boolean().default(false),
  audioUrl: z.string().optional(),
  brand: CreateBrandInputSchema.optional(),
  scenes: z.array(CreateSceneInputSchema).optional(),
});

export const UpdateProjectSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  artStyle: ArtStylePresetSchema.optional(),
  cameraMotion: CameraMotionSchema.optional(),
  aspectRatio: AspectRatioSchema.optional(),
  dampingFactor: z.number().min(0.01).max(1.0).optional(),
  lingerFactor: z.number().min(0).max(1.0).optional(),
  scrollSensitivity: z.number().min(0.1).max(5.0).optional(),
  enableAudio: z.boolean().optional(),
  audioUrl: z.string().optional(),
  status: z.enum(["DRAFT", "GENERATING", "READY", "FAILED"]).optional(),
  brand: CreateBrandInputSchema.partial().optional(),
  scenes: z.array(CreateSceneInputSchema.extend({ id: z.string().optional() })).optional(),
});

export const IntakeRequestSchema = z.object({
  url: z.string().url("Please provide a valid website URL").optional().or(z.literal("")),
  brandName: z.string().optional(),
  niche: z.string().optional(),
  prompt: z.string().optional(),
  artStyle: ArtStylePresetSchema.default("hyper-realistic"),
  cameraMotion: CameraMotionSchema.default("forward-dive"),
  aspectRatio: AspectRatioSchema.default("16:9"),
  numScenes: z.number().int().min(3).max(10).default(6),
  targetAudience: z.string().optional(),
});

export const RenderJobRequestSchema = z.object({
  mode: z.enum(["draft", "production"]).default("production"),
  aspectRatio: AspectRatioSchema.default("16:9"),
  forceRegenerate: z.boolean().default(false),
  sceneCount: z.number().int().min(3).max(10).default(6),
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
export type IntakeRequestInput = z.infer<typeof IntakeRequestSchema>;
export type RenderJobRequestInput = z.infer<typeof RenderJobRequestSchema>;
