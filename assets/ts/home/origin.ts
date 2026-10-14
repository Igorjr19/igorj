export const ORIGIN_STORAGE_KEY = 'home-origin';

/** The link of a home panel the visitor followed, so going back can land on it. */
export interface HomeOrigin {
  readonly panel: string;
  readonly href: string;
}

export function saveOrigin(storage: Pick<Storage, 'setItem'>, origin: HomeOrigin): void {
  storage.setItem(ORIGIN_STORAGE_KEY, JSON.stringify(origin));
}

/** Reads and forgets the saved origin: it is only good for the next arrival on the home. */
export function takeOrigin(storage: Pick<Storage, 'getItem' | 'removeItem'>): HomeOrigin | null {
  const saved = storage.getItem(ORIGIN_STORAGE_KEY);
  storage.removeItem(ORIGIN_STORAGE_KEY);
  if (saved === null) {
    return null;
  }
  try {
    const { panel, href } = JSON.parse(saved) as Partial<HomeOrigin>;
    return typeof panel === 'string' && typeof href === 'string' ? { panel, href } : null;
  } catch {
    return null;
  }
}

/** Reloads and fresh visits start from the top; only coming back from inside the site restores the place. */
export function shouldRestoreFocus(navigationType: string, cameFromThisSite: boolean): boolean {
  return navigationType === 'back_forward' || (navigationType === 'navigate' && cameFromThisSite);
}
