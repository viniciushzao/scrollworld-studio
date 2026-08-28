/**
 * Prompt Engineering & Intake Parser
 * Style Preambles, Motion Handoff Contracts, and 5-7 Scene Journey Synthesizer
 */

import { ArtStylePreset, CameraMotion } from "../types/studio";

export interface StylePreambleDefinition {
  id: ArtStylePreset;
  name: string;
  description: string;
  positivePromptPrefix: string;
  positivePromptSuffix: string;
  negativePrompt: string;
  idealBackgroundColor: string;
}

export const STYLE_PREAMBLES: Record<ArtStylePreset, StylePreambleDefinition> = {
  "isometric-3d": {
    id: "isometric-3d",
    name: "Diorama Isométrico",
    description: "Floating 3D miniature diorama, octane render, crisp isometric projection",
    positivePromptPrefix:
      "Masterpiece 3D floating isometric diorama island, miniature tilt-shift photography, Octane Render 8K, immaculate micro details, soft volumetric lighting, raytraced ambient occlusion",
    positivePromptSuffix:
      "isolated on a clean solid deep dark slate-gray studio background, zero background clutter, razor-sharp clean boundary edges for precise cutout, perfectly centered architectural diorama",
    negativePrompt:
      "blurry background, cluttered backdrop, distorted edges, messy floor, human faces, noisy artifacts, low-res",
    idealBackgroundColor: "#14161B",
  },
  "hyper-realistic": {
    id: "hyper-realistic",
    name: "Photoreal Walkthrough",
    description: "Ultra-photorealistic architectural walkthrough, Hasselblad medium format lens",
    positivePromptPrefix:
      "Award-winning architectural photography, shot on Hasselblad H6D-100c, 80mm lens, f/5.6, hyper-realistic physical materials, authentic tactile textures, soft natural studio illumination",
    positivePromptSuffix:
      "isolated structure against a solid uniform neutral backdrop, clean perimeter boundaries for seamless seam alignment, cinematic precision, 8k resolution",
    negativePrompt:
      "grain, cartoon, 3d render look, oversaturated, messy background objects, crowds, distorted perspective",
    idealBackgroundColor: "#0E1117",
  },
  "luxury-editorial": {
    id: "luxury-editorial",
    name: "Luxury Editorial",
    description: "High-end luxury editorial showcase, brushed titanium, marble and golden accents",
    positivePromptPrefix:
      "Ultra-luxury design editorial showcase, polished obsidian, brushed champagne gold, Carrara marble textures, dramatic soft rim lighting, museum exhibition pedestal",
    positivePromptSuffix:
      "isolated against a solid velvet-black studio background, exquisite reflection handling, pristine edge separation",
    negativePrompt:
      "cheap plastic, flat lighting, messy composition, low detail, smudges, blurred focal point",
    idealBackgroundColor: "#08090C",
  },
  "minimalist-apple": {
    id: "minimalist-apple",
    name: "Minimalist Studio",
    description: "Apple-inspired minimalist product architecture, pure matte surfaces, diffused lighting",
    positivePromptPrefix:
      "Industrial design masterpiece, minimalist aesthetic, bead-blasted anodized aluminum, pure frosted glass, seamless monolithic curves, soft studio shadow diffusion",
    positivePromptSuffix:
      "floating above a solid pure neutral graphite backdrop, clean perimeter, uncompromising precision, 8k detail",
    negativePrompt:
      "ornate decorations, complex clutter, heavy grain, uneven lighting, chromatic aberration",
    idealBackgroundColor: "#1A1D24",
  },
  "cinematic-scifi": {
    id: "cinematic-scifi",
    name: "Cinematic Sci-Fi",
    description: "Futuristic sci-fi installation, dark monolithic geometry, glowing energy tracks",
    positivePromptPrefix:
      "Cinematic sci-fi architectural installation, Denis Villeneuve aesthetic, monolithic geometry, dark aerospace titanium, glowing cyan pulse light conduits, volumetric atmospheric haze",
    positivePromptSuffix:
      "isolated in deep void space against a solid dark carbon backdrop, sharp silhouette boundaries, immaculate 8k depth",
    negativePrompt:
      "messy starfields, cheesy lasers, low-poly, pixelated, human crowd, chaotic composition",
    idealBackgroundColor: "#060709",
  },
  "cyberpunk-neon": {
    id: "cyberpunk-neon",
    name: "Cyberpunk Holographic",
    description: "Cyberpunk aesthetic with neon conduits, holographic HUD projections, dark chrome",
    positivePromptPrefix:
      "Cyberpunk floating diorama, dark chrome plating, luminous neon cyan and magenta optical light ribbons, floating holographic data layers, hyper-detailed micro-circuitry",
    positivePromptSuffix:
      "isolated against a solid dark midnight studio background, pristine luminous edges, high contrast HDR",
    negativePrompt:
      "messy streets, low quality render, blown out white highlights, noisy artifacts",
    idealBackgroundColor: "#0A0B10",
  },
  "organic-nature": {
    id: "organic-nature",
    name: "Organic Biophilic",
    description: "Biophilic architectural garden, moss, polished wood, flowing water streams",
    positivePromptPrefix:
      "Biophilic architectural floating island, lush emerald moss, Japanese bonsai geometry, polished cedar wood, crystal-clear water stream, warm golden hour studio spotlight",
    positivePromptSuffix:
      "isolated against a solid dark earthen slate backdrop, immaculate organic boundary edges, 8k macro detail",
    negativePrompt:
      "plastic plants, artificial look, messy background forest, blurred foliage, muddy colors",
    idealBackgroundColor: "#121512",
  },
  "retro-futuristic": {
    id: "retro-futuristic",
    name: "Retro-Futuristic",
    description: "1970s Syd Mead retro-futuristic concept, warm pastel hues, rounded aerodynamic shapes",
    positivePromptPrefix:
      "Syd Mead inspired retro-futuristic diorama, aerodynamic 1970s futurism, warm orange and cream enamel, brushed bronze details, analog telemetry dials",
    positivePromptSuffix:
      "isolated against a solid dark umber backdrop, smooth studio lighting, crisp edge separation",
    negativePrompt:
      "modern digital clutter, grunge, distortion, noisy background, illegible textures",
    idealBackgroundColor: "#161311",
  },
};

export const MOTION_HANDOFF_CLAUSES = {
  diveStart: "Smooth continuous forward dollying camera, gliding directly towards the central focal subject at constant velocity,",
  diveEndHandoff: "in the final 1.0 second, settle into a slow, steady forward drift, aligning with the target horizon and locking camera orientation for seamless transition.",
  connectorStart: "Begin smoothly from the exact camera position and drift speed of the prior frame, accelerating through the threshold into the next space,",
  connectorEndHandoff: "in the final 1.0 second, gently decelerate and settle into a steady forward drift approaching the next diorama horizon.",
  heroRestStandstill: "smoothly decelerate to a majestic hero standstill with subtle, elegant ambient breathing motion.",
};

export interface SceneBlueprint {
  index: number;
  title: string;
  subtitle: string;
  description: string;
  visualSubject: string;
  cameraMotion: CameraMotion;
  imagePrompt: string;
  videoPrompt: string;
  estimatedDuration: number;
  diveScrollPx: number;
  lingerFactor: number;
}

export function synthesizeSceneJourney(input: {
  brandName: string;
  brandDescription?: string;
  brandUrl?: string;
  artStyle?: ArtStylePreset;
  sceneCount?: number;
}): SceneBlueprint[] {
  const style = STYLE_PREAMBLES[input.artStyle || "isometric-3d"];
  const brand = input.brandName || "SCROLLWORLD";
  const desc = input.brandDescription || "Hyper-modern product experience engineered for maximum visual immersion.";
  const count = Math.max(5, Math.min(7, input.sceneCount || 6));

  const templates = [
    {
      title: "01 // The Discovery",
      subtitle: "The Genesis Architecture",
      visualSubject: `Monolithic floating diorama showcasing ${brand}'s core emblem in levitating obsidian and glowing optical crystals`,
      motion: "forward-dive" as CameraMotion,
      linger: 0.5,
      scrollPx: 1200,
    },
    {
      title: "02 // Precision Engineering",
      subtitle: "Materiality & Craft",
      visualSubject: `Subsurface mechanical chamber with precision-milled aerospace alloy layers and micro-actuators of ${brand}`,
      motion: "forward-dive" as CameraMotion,
      linger: 0.6,
      scrollPx: 1300,
    },
    {
      title: "03 // The Inner Engine",
      subtitle: "Quantum Core Technology",
      visualSubject: `Levitating gyroscopic power core pulsing with synchronized light rings and pure energy streams`,
      motion: "macro-zoom" as CameraMotion,
      linger: 0.55,
      scrollPx: 1250,
    },
    {
      title: "04 // Tactical Harmony",
      subtitle: "Seamless Integration",
      visualSubject: `Exploded isometric view of modular components locking together with sub-millimeter magnetic precision`,
      motion: "forward-dive" as CameraMotion,
      linger: 0.5,
      scrollPx: 1200,
    },
    {
      title: "05 // The Infinite Horizon",
      subtitle: "Ecosystem Mastery",
      visualSubject: `Panoramic terrace overlooking an expansive architectural landscape of connected floating structures`,
      motion: "gentle-glide" as CameraMotion,
      linger: 0.6,
      scrollPx: 1400,
    },
    {
      title: "06 // The Masterpiece",
      subtitle: "The Ultimate Experience",
      visualSubject: `Pristine hero display pedestal illuminated by soft studio key lights presenting ${brand} in crystallized perfection`,
      motion: "forward-dive" as CameraMotion,
      linger: 0.8,
      scrollPx: 1500,
    },
    {
      title: "07 // Beyond the Threshold",
      subtitle: "Your Next Step",
      visualSubject: `Radiant portal archway opening into an expansive realm of infinite possibility and brand elevation`,
      motion: "infinite-plunge" as CameraMotion,
      linger: 0.7,
      scrollPx: 1350,
    },
  ];

  const selectedTemplates = templates.slice(0, count);

  return selectedTemplates.map((t, idx) => {
    const isLast = idx === count - 1;

    const imagePrompt = `${style.positivePromptPrefix}, ${t.visualSubject}, ${desc}, ${style.positivePromptSuffix}`;

    const motionClause = isLast
      ? `${MOTION_HANDOFF_CLAUSES.diveStart} ${t.visualSubject}, ${MOTION_HANDOFF_CLAUSES.heroRestStandstill}`
      : `${MOTION_HANDOFF_CLAUSES.diveStart} ${t.visualSubject}, ${MOTION_HANDOFF_CLAUSES.diveEndHandoff}`;

    const videoPrompt = `${motionClause} Maintaining exact style: ${style.name}, cinematic lighting, photorealistic 1080p.`;

    return {
      index: idx,
      title: t.title,
      subtitle: t.subtitle,
      description: `${brand} — ${t.visualSubject}. Experience seamless scroll-driven exploration.`,
      visualSubject: t.visualSubject,
      cameraMotion: t.motion,
      imagePrompt,
      videoPrompt,
      estimatedDuration: 4.0,
      diveScrollPx: t.scrollPx,
      lingerFactor: t.linger,
    };
  });
}
