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

/** The name as a grid of cells; aspect is how many times taller than wide a character is. */
export interface Grid {
  readonly cols: number;
  readonly rows: number;
  readonly cells: Float32Array;
  readonly aspect: number;
}

/** Where the pointer is on the grid, in columns and rows. */
export interface Lens {
  readonly col: number;
  readonly row: number;
}

/** How far the lens reaches, in columns: an eighth of the name's width, and never less than eight. */
export function lensRadius(grid: Grid): number {
  return Math.max(8, grid.cols * 0.12);
}

/** From 1 at the pointer to 0 at the edge of the lens, measuring rows by the height of a character. */
function closeness(grid: Grid, lens: Lens, col: number, row: number): number {
  const distance = Math.hypot(col - lens.col, (row - lens.row) * grid.aspect) / lensRadius(grid);
  return Math.max(0, 1 - distance);
}

/** How much bigger the name looks at the very centre of the lens. */
const MAGNIFY = 1.8;

/**
 * The name as seen through a magnifying lens at the pointer: each cell near it shows the cell closer to the
 * centre, so the letters bulge, and reads a little denser. Cells beyond the lens stay as they are.
 */
export function lensed(grid: Grid, lens: Lens): Float32Array {
  const { cols, rows, cells } = grid;
  return cells.map((covered, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const near = closeness(grid, lens, col, row);
    if (near === 0) {
      return covered;
    }
    const pull = 1 - (1 - 1 / MAGNIFY) * near * near;
    const from = Math.round(lens.row + (row - lens.row) * pull);
    const source = cells[Math.min(rows - 1, Math.max(0, from)) * cols + Math.round(lens.col + (col - lens.col) * pull)];
    const seen = source ?? covered;
    return seen > 0 ? Math.min(1, seen * (1 + near)) : 0;
  });
}

/** Close to the pointer, some characters are swapped for noise while it moves. */
export function scrambled(text: string, grid: Grid, lens: Lens, random: () => number): string {
  return text
    .split('\n')
    .map((line, row) =>
      [...line]
        .map((char, col) => {
          const near = closeness(grid, lens, col, row);
          return char !== ' ' && random() < 0.4 * near * near ? (RAMP[4 + Math.floor(random() * 7)] ?? char) : char;
        })
        .join(''),
    )
    .join('\n');
}
