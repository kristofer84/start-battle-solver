import type { PuzzleState, Coords, CellState } from '../types/puzzle';

export function rowCells(state: PuzzleState, row: number): Coords[] {
  const { size } = state.def;
  const cells: Coords[] = [];
  for (let c = 0; c < size; c += 1) {
    cells.push({ row, col: c });
  }
  return cells;
}

export function colCells(state: PuzzleState, col: number): Coords[] {
  const { size } = state.def;
  const cells: Coords[] = [];
  for (let r = 0; r < size; r += 1) {
    cells.push({ row: r, col });
  }
  return cells;
}

export function regionCells(state: PuzzleState, regionId: number): Coords[] {
  const coords: Coords[] = [];
  for (let r = 0; r < state.def.size; r += 1) {
    for (let c = 0; c < state.def.size; c += 1) {
      if (state.def.regions[r][c] === regionId) {
        coords.push({ row: r, col: c });
      }
    }
  }
  return coords;
}

export function getCell(state: PuzzleState, { row, col }: Coords): CellState {
  return state.cells[row][col];
}

export function countStars(state: PuzzleState, cells: Coords[]): number {
  return cells.reduce((acc, c) => (getCell(state, c) === 'star' ? acc + 1 : acc), 0);
}

export function countCrosses(state: PuzzleState, cells: Coords[]): number {
  return cells.reduce((acc, c) => (getCell(state, c) === 'cross' ? acc + 1 : acc), 0);
}

export function emptyCells(state: PuzzleState, cells: Coords[]): Coords[] {
  return cells.filter((c) => getCell(state, c) === 'empty');
}

export function neighbors8(coord: Coords, size: number): Coords[] {
  const result: Coords[] = [];
  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      if (dr === 0 && dc === 0) continue;
      const nr = coord.row + dr;
      const nc = coord.col + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
        result.push({ row: nr, col: nc });
      }
    }
  }
  return result;
}


