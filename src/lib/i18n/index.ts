import { SupportedLocale, TranslationDictionary, SUPPORTED_LANGUAGES } from "./types";
import { en } from "./locales/en";

export const DICTIONARIES: Record<SupportedLocale, () => Promise<{ default?: TranslationDictionary; [key: string]: any }>> = {
  en: () => import("./locales/en").then(m => m.en),
  "pt-BR": () => import("./locales/pt-BR").then(m => m.ptBR || m.default),
  "zh-CN": () => import("./locales/zh-CN").then(m => m.zhCN || m.default),
};

export { en } from "./locales/en";
export { ptBR } from "./locales/pt-BR";
export { zhCN } from "./locales/zh-CN";
export * from "./types";
