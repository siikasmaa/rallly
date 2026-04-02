export type AvailableLanguageTag = "en" | "cs" | "da" | "de" | "es" | "fa" | "fr" | "hu" | "it" | "ko" | "nl" | "pl" | "pt" | "pt-BR" | "sk" | "sv" | "zh";
export const availableLanguageTags: AvailableLanguageTag[] = ["en", "cs", "da", "de", "es", "fa", "fr", "hu", "it", "ko", "nl", "pl", "pt", "pt-BR", "sk", "sv", "zh"];
export const sourceLanguageTag = "en" as const;
let _languageTag: AvailableLanguageTag = "en";
export function setLanguageTag(tag: AvailableLanguageTag | (() => AvailableLanguageTag)) {
  _languageTag = typeof tag === "function" ? tag() : tag;
}
export function languageTag(): AvailableLanguageTag { return _languageTag; }
