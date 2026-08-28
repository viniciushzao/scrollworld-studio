export type SupportedLocale = "en" | "pt-BR" | "zh-CN";

export interface LanguageOption {
  code: SupportedLocale;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "pt-BR", name: "Portuguese (Brazil)", nativeName: "Português (Brasil)", flag: "🇧🇷" },
  { code: "zh-CN", name: "Chinese (Simplified)", nativeName: "简体中文", flag: "🇨🇳" },
];

export type TranslationDictionary = {
  nav: {
    overview: string;
    studioIde: string;
    liveShowcase: string;
    docs: string;
    launchStudio: string;
    engineTag: string;
  };
  hero: {
    tag: string;
    headlineStart: string;
    headlineHighlight: string;
    headlineEnd: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
    selectWorld: string;
  };
  studio: {
    projectName: string;
    newWorld: string;
    reSynthesize: string;
    fullPreview: string;
    exportEmbed: string;
    scenesSequence: string;
    addScene: string;
    desktopView: string;
    mobileView: string;
    telemetryHud: string;
    blobCacheReady: string;
    dynamicPool: string;
    editingScene: string;
    kickerTag: string;
    headlineTitle: string;
    bodyDesc: string;
    focalPoint: string;
    diveDuration: string;
    scrollDistance: string;
    lingerFactor: string;
    callToAction: string;
    ctaUrl: string;
    previewPrompt: string;
    deleteScene: string;
    moveUp: string;
    moveDown: string;
  };
  wizard: {
    step1Title: string;
    step1Desc: string;
    tabUrl: string;
    tabPrompt: string;
    urlLabel: string;
    urlPlaceholder: string;
    urlHelp: string;
    presetsLabel: string;
    promptLabel: string;
    promptPlaceholder: string;
    promptHelp: string;
    cancel: string;
    continueToArt: string;
    step2Title: string;
    step2Desc: string;
    continueToMotion: string;
    step3Title: string;
    step3Desc: string;
    pipelineMatrixTitle: string;
    zeroColdStart: string;
    stillsLabel: string;
    videoLabel: string;
    transcodeLabel: string;
    cdnLabel: string;
    back: string;
    generateButton: string;
    generatingButton: string;
    pipelineActive: string;
  };
  styles: {
    appleMinimalist: { name: string; desc: string };
    hyperRealistic: { name: string; desc: string };
    luxuryEditorial: { name: string; desc: string };
    cyberpunkNeon: { name: string; desc: string };
    cinematicScifi: { name: string; desc: string };
    organicNature: { name: string; desc: string };
  };
  motions: {
    infiniteForwardDive: { name: string; desc: string };
    orbitalGlide: { name: string; desc: string };
    extremeMacroZoom: { name: string; desc: string };
    slowAtmosphericGlide: { name: string; desc: string };
  };
  exportModal: {
    tag: string;
    title: string;
    subtitle: string;
    previewUrlLabel: string;
    copyLink: string;
    copied: string;
    tabUniversalJs: string;
    tabWebComponent: string;
    tabReact: string;
    tabStandalone: string;
    tabUniversalJsDesc: string;
    tabWebComponentDesc: string;
    tabReactDesc: string;
    tabStandaloneDesc: string;
    downloadHtml: string;
    close: string;
  };
  telemetry: {
    title: string;
    sub: string;
    estCost: string;
    brandIntake: string;
    promptSynthesis: string;
    stillsGen: string;
    ffmpegQa: string;
    seedanceDives: string;
    gopTranscode: string;
    r2Upload: string;
  };
  footer: {
    tagline: string;
    sub: string;
  };
};
