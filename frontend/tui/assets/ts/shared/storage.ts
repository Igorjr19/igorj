/// <reference lib="dom" />

/** The browser storage, or null where the visitor blocks site data and merely reading the property throws. */
export function browserStorage(kind: 'localStorage' | 'sessionStorage'): Storage | null {
  try {
    return globalThis[kind];
  } catch {
    return null;
  }
}
