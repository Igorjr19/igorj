/** Characters from empty to full; each cell picks one by how much of the name covers it. */
export const RAMP = ' .·:-=+*#%@';

function cellCoverage(
  alpha: ArrayLike<number>,
  width: number,
  left: number,
  top: number,
  cellWidth: number,
  cellHeight: number,
): number {
  let sum = 0;
  for (let dy = 0; dy < cellHeight; dy++) {
    for (let dx = 0; dx < cellWidth; dx++) {
      sum += alpha[(top + dy) * width + left + dx] ?? 0;
    }
  }
  return sum / (cellWidth * cellHeight * 255);
}

/** The share of each character cell covered by the drawn name, from 0 to 1, given the canvas alpha channel. */
export function coverage(
  alpha: ArrayLike<number>,
  width: number,
  cols: number,
  rows: number,
  cellWidth: number,
  cellHeight: number,
): Float32Array {
  const cells = new Float32Array(cols * rows);
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      cells[row * cols + col] = cellCoverage(alpha, width, col * cellWidth, row * cellHeight, cellWidth, cellHeight);
    }
  }
  return cells;
}

function noise(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function cellValue(covered: number, x: number, y: number, t: number): number {
  const wave = 0.5 + 0.5 * Math.sin(x * 0.16 + y * 0.55 - t * 1.4) * Math.cos(x * 0.045 + t * 0.6);
  if (covered > 0.08) {
    return 0.45 + 0.55 * covered * (0.55 + 0.45 * wave);
  }
  const spark = noise(x, y + Math.floor(t * 3)) > 0.985 ? 0.35 : 0;
  return (0.14 * wave + spark) * (noise(x, y) > 0.55 ? 1 : 0.3);
}

/** One frame at time `t` seconds: the letters stay solid while a slow wave and rare sparks move through them and the space around. */
export function frame(cells: Float32Array, cols: number, rows: number, t: number, ramp: string = RAMP): string {
  const top = ramp.length - 1;
  const lines: string[] = [];
  for (let y = 0; y < rows; y++) {
    let line = '';
    for (let x = 0; x < cols; x++) {
      line += ramp[Math.min(top, Math.floor(cellValue(cells[y * cols + x] ?? 0, x, y, t) * ramp.length))];
    }
    lines.push(line);
  }
  return lines.join('\n');
}

/** Splits a name into at most two lines, keeping the first two words together. */
export function nameLines(name: string): string[] {
  const words = name.trim().split(/\s+/);
  return words.length > 2 ? [words.slice(0, 2).join(' '), words.slice(2).join(' ')] : [words.join(' ')];
}
