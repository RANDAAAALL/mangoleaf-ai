"use client";

import { useSyncExternalStore } from "react";
import type { Language } from "@/lib/translations";

let fallbackLanguage: Language = "bis";
let unsavedLanguage: Language | undefined;
const languageChanged = "mangoleaf-language-changed";

function readLanguage(): Language {
  if (unsavedLanguage) return unsavedLanguage;
  try {
    const saved = localStorage.getItem("preferred_language");
    if (saved === "en" || saved === "bis") return saved;
  } catch {}
  return fallbackLanguage;
}

function subscribeLanguage(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(languageChanged, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(languageChanged, listener);
  };
}

function changeLanguage(next: Language) {
  fallbackLanguage = next;
  try {
    localStorage.setItem("preferred_language", next);
    unsavedLanguage = undefined;
  } catch {
    // A denied write must not replace the user's current choice with an older saved value.
    unsavedLanguage = next;
  }
  window.dispatchEvent(new Event(languageChanged));
}

const serverLanguage = (): Language => "bis";

/** Public Home and download documents share only language, never legacy report storage. */
export function useBrowserLanguage() {
  // A fixed server snapshot keeps static-export hydration deterministic.
  const language = useSyncExternalStore(
    subscribeLanguage,
    readLanguage,
    serverLanguage,
  );
  return { language, changeLanguage };
}
