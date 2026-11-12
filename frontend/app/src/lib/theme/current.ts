import { browserStorage } from '../browser-storage.ts';
import { readSavedTheme, type SavedTheme } from './storage.ts';

/** What the visitor chose, or none when nothing is saved or storage is out of reach. */
export function currentChoice(): SavedTheme | null {
  const storage = browserStorage('localStorage');
  try {
    return storage ? readSavedTheme(storage) : null;
  } catch {
    return null;
  }
}
