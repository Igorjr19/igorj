/** The pane a path belongs to, by its first part after the language; null for pages outside the panes. */
const PANE_OF: Readonly<Record<string, number>> = {
  '': 0,
  projects: 1,
  posts: 2,
  categories: 2,
  research: 3,
  cv: 4,
  shelf: 5,
};

function place(path: string): { pane: number | null; depth: number } {
  const [, , section = '', ...rest] = path.split('/').filter((part, index) => index === 0 || part);
  return { pane: PANE_OF[section] ?? null, depth: rest.length };
}

/**
 * Which way a navigation goes: to a pane further down the list, or deeper into the same pane, is forward;
 * the other way is backward. Pages outside the panes, or the same place, have no direction.
 */
export function direction(from: string, to: string): 'forward' | 'backward' | null {
  const a = place(from);
  const b = place(to);
  if (a.pane === null || b.pane === null) {
    return null;
  }
  const step = b.pane === a.pane ? b.depth - a.depth : b.pane - a.pane;
  if (step === 0) {
    return null;
  }
  return step > 0 ? 'forward' : 'backward';
}

export const MOTION_STORAGE_KEY = 'motion';

/** Motion is reduced when the visitor chose it here, or when the system asks for it. */
export function motionReduced(saved: string | null, systemReduced: boolean): boolean {
  return saved === 'reduced' || systemReduced;
}
