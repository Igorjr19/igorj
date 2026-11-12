import { brightness, sigmoid, unsharpMask } from './filters.ts';
import type { Gray } from './types.ts';

/**
 * The photo made ready for one-bit dithering: a little sharper and brightened in the middle tones, so the
 * background goes clean and the face keeps its lines.
 */
export function treatPortrait(gray: Gray): Gray {
  return sigmoid(brightness(unsharpMask(gray, 1.2, 1, 0), 12), 0.45, 5);
}
