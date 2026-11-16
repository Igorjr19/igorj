export interface Grid {
  readonly cols: number;
  readonly rows: number;
  readonly cells: Uint8Array;
}

/** A small deterministic generator, so a pattern can be reproduced from its seed. */
function generator(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = Math.imul(state ^ (state >>> 15), state | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

export function seeded(cols: number, rows: number, seed: number, density = 0.28): Grid {
  const next = generator(seed);
  const cells = new Uint8Array(cols * rows);
  for (let at = 0; at < cells.length; at += 1) {
    cells[at] = next() < density ? 1 : 0;
  }
  return { cols, rows, cells };
}

export function population(grid: Grid): number {
  return grid.cells.reduce((total, cell) => total + cell, 0);
}

function neighbours(grid: Grid, col: number, row: number): number {
  let total = 0;
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (dx !== 0 || dy !== 0) {
        const x = (col + dx + grid.cols) % grid.cols;
        const y = (row + dy + grid.rows) % grid.rows;
        total += grid.cells[y * grid.cols + x] ?? 0;
      }
    }
  }
  return total;
}

/** One generation on a grid whose edges wrap around. */
export function step(grid: Grid): Grid {
  const cells = new Uint8Array(grid.cells.length);
  for (let row = 0; row < grid.rows; row += 1) {
    for (let col = 0; col < grid.cols; col += 1) {
      const around = neighbours(grid, col, row);
      const alive = grid.cells[row * grid.cols + col] === 1;
      cells[row * grid.cols + col] = around === 3 || (alive && around === 2) ? 1 : 0;
    }
  }
  return { cols: grid.cols, rows: grid.rows, cells };
}
