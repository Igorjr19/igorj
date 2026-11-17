export interface Anchor {
  /** Where the object is on the screen, from -1 to 1 in both directions, up being positive. */
  readonly x: number;
  readonly y: number;
}

export type Arrow = 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown';

function distanceAhead(arrow: Arrow, dx: number, dy: number): number {
  switch (arrow) {
    case 'ArrowRight':
      return dx;
    case 'ArrowLeft':
      return -dx;
    case 'ArrowUp':
      return dy;
    case 'ArrowDown':
      return -dy;
  }
}

/** The nearest object in the direction of the arrow, preferring the one straight ahead; null where nothing lies that way. */
export function neighbour(from: string, anchors: Readonly<Record<string, Anchor>>, arrow: Arrow): string | null {
  const here = anchors[from];
  if (!here) {
    return null;
  }
  const horizontal = arrow === 'ArrowLeft' || arrow === 'ArrowRight';
  let best: string | null = null;
  let bestScore = Number.POSITIVE_INFINITY;
  for (const [name, anchor] of Object.entries(anchors)) {
    const dx = anchor.x - here.x;
    const dy = anchor.y - here.y;
    const ahead = distanceAhead(arrow, dx, dy);
    if (name === from || ahead <= 0.02) {
      continue;
    }
    const score = ahead + (horizontal ? Math.abs(dy) : Math.abs(dx)) * 1.6;
    if (score < bestScore) {
      bestScore = score;
      best = name;
    }
  }
  return best;
}
