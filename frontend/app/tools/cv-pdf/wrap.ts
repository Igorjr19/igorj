import type { FontKind, Measure } from './types.ts';

/**
 * Breaks a text into lines no wider than `width`, at spaces; a word wider than a line stands alone on one.
 * The first line may start further in (`firstOffset`), as it does after a label in front of it.
 */
export function wrapText(
  text: string,
  width: number,
  measure: Measure,
  font: FontKind,
  size: number,
  firstOffset = 0,
): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const candidate = line ? `${line} ${word}` : word;
    const room = width - (lines.length === 0 ? firstOffset : 0);
    if (line && measure(candidate, font, size) > room) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) {
    lines.push(line);
  }
  return lines;
}
