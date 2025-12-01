export type CellState = 'empty' | 'star' | 'cross';

export interface Coords {
  row: number; // 0–9
  col: number; // 0–9
}

export interface PuzzleDef {
  size: number; // 10
  starsPerUnit: number; // 2
  regions: number[][]; // [row][col] => 1..10
}

export interface PuzzleState {
  def: PuzzleDef;
  cells: CellState[][]; // [row][col]
}

export const DEFAULT_SIZE = 10;
export const DEFAULT_STARS_PER_UNIT = 2;

export function createEmptyPuzzleDef(): PuzzleDef {
  const regions: number[][] = [];
  for (let r = 0; r < DEFAULT_SIZE; r += 1) {
    const row: number[] = [];
    for (let c = 0; c < DEFAULT_SIZE; c += 1) {
      row.push(1);
    }
    regions.push(row);
  }
  return {
    size: DEFAULT_SIZE,
    starsPerUnit: DEFAULT_STARS_PER_UNIT,
    regions,
  };
}

export function createEmptyPuzzleState(def: PuzzleDef): PuzzleState {
  const cells: CellState[][] = [];
  for (let r = 0; r < def.size; r += 1) {
    const row: CellState[] = [];
    for (let c = 0; c < def.size; c += 1) {
      row.push('empty');
    }
    cells.push(row);
  }
  return { def, cells };
}


