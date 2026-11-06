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

/** Edges get the lighter characters of the dense half and the core the heaviest, so the letters read as solid shapes. */
function cellValue(covered: number): number {
  return covered > 0.08 ? 0.45 + 0.55 * covered : 0;
}

/** The name as text, one line per row and one character per column; the space around it stays blank. */
export function render(cells: Float32Array, cols: number, rows: number, ramp: string = RAMP): string {
  const top = ramp.length - 1;
  const lines: string[] = [];
  for (let y = 0; y < rows; y++) {
    let line = '';
    for (let x = 0; x < cols; x++) {
      line += ramp[Math.min(top, Math.floor(cellValue(cells[y * cols + x] ?? 0) * ramp.length))];
    }
    lines.push(line.trimEnd());
  }
  return lines.join('\n');
}

/** Splits a name into at most two lines, keeping the first two words together. */
export function nameLines(name: string): string[] {
  const words = name.trim().split(/\s+/);
  return words.length > 2 ? [words.slice(0, 2).join(' '), words.slice(2).join(' ')] : [words.join(' ')];
}
