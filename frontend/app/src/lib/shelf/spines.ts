export const SPINE_ROLES = ['accent', 'link', 'success', 'warning', 'error', 'text'] as const;
export type SpineRole = (typeof SPINE_ROLES)[number];

export interface Spine {
  readonly role: SpineRole;
  /** In steps of a text line: books differ in height. */
  readonly height: number;
  /** In cells. */
  readonly width: number;
}

/** A small stable hash, so a book looks the same on every build. */
function hashOf(text: string): number {
  let hash = 2166136261;
  for (const char of text) {
    hash = Math.imul(hash ^ (char.codePointAt(0) ?? 0), 16777619) >>> 0;
  }
  return hash;
}

/** What the spine of a book or a paper looks like, made from its title alone: a color role, a height and a thickness. */
export function spineOf(title: string, kind: 'book' | 'paper'): Spine {
  const hash = hashOf(title);
  const role = SPINE_ROLES[hash % SPINE_ROLES.length] ?? 'text';
  if (kind === 'paper') {
    return { role, height: 8, width: 2 };
  }
  return { role, height: 10 + ((hash >>> 8) % 4), width: 2 + ((hash >>> 16) % 2) };
}
