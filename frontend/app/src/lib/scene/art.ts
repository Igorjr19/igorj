/** Breaks `text` into lines no wider than `max` and draws them from (x, y), `line` apart. */
export function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  max: number,
  line: number,
): void {
  let row = '';
  let at = y;
  for (const word of text.split(' ')) {
    const next = row ? `${row} ${word}` : word;
    if (context.measureText(next).width > max && row) {
      context.fillText(row, x, at);
      at += line;
      row = word;
    } else {
      row = next;
    }
  }
  context.fillText(row, x, at);
}

/** Colors that stand in for a poster's art while its picture is not there, picked by the title so each film keeps its own. */
export function cardColors(title: string): readonly [string, string] {
  let hash = 0;
  for (const letter of title) {
    hash = (hash * 31 + (letter.codePointAt(0) ?? 0)) % 360;
  }
  return [`hsl(${hash} 55% 42%)`, `hsl(${(hash + 40) % 360} 50% 18%)`];
}
