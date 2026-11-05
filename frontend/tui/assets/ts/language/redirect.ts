/// <reference lib="dom" />
import { chooseLanguage, LANGUAGE_STORAGE_KEY } from './choice.ts';

// Runs inline in the root page's <head>: the root is the only address that picks a language for the visitor.
let saved: string | null = null;
try {
  saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
} catch {
  // Storage blocked: the browser language decides.
}
location.replace(`${chooseLanguage(saved, navigator.languages ?? [navigator.language])}/`);
