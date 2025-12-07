/**
 * Board state construction and conversion
 */

import type { PuzzleState } from '../../../types/puzzle';
import type { BoardState, Region, RowGroup, ColumnGroup, Block2x2, CellId } from './types';
import { CellState, toSchemaCellState, coordToCellId } from './types';

/**
 * Convert from PuzzleState to BoardState
 */
export function puzzleStateToBoardState(state: PuzzleState): BoardState {
  const { def, cells } = state;
  const size = def.size;
  const starsPerLine = def.starsPerUnit;
  const starsPerRegion = def.starsPerUnit;

  // Convert cell states
  const cellStates: CellState[] = new Array(size * size);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const cellId = coordToCellId({ row: r, col: c }, size);
      cellStates[cellId] = toSchemaCellState(cells[r][c]);
    }
  }

  // Build regions
  const regionMap = new Map<number, CellId[]>();
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const regionId = def.regions[r][c];
      const cellId = coordToCellId({ row: r, col: c }, size);
      if (!regionMap.has(regionId)) {
        regionMap.set(regionId, []);
      }
      regionMap.get(regionId)!.push(cellId);
    }
  }

  const regions: Region[] = Array.from(regionMap.entries()).map(([id, cells]) => ({
    id,
    cells,
    starsRequired: starsPerRegion,
  }));

  // Build rows
  const rows: RowGroup[] = [];
  for (let r = 0; r < size; r++) {
    const rowCells: CellId[] = [];
    for (let c = 0; c < size; c++) {
      rowCells.push(coordToCellId({ row: r, col: c }, size));
    }
    rows.push({
      type: 'row',
      rowIndex: r,
      cells: rowCells,
      starsRequired: starsPerLine,
    });
  }

  // Build columns
  const cols: ColumnGroup[] = [];
  for (let c = 0; c < size; c++) {
    const colCells: CellId[] = [];
    for (let r = 0; r < size; r++) {
      colCells.push(coordToCellId({ row: r, col: c }, size));
    }
    cols.push({
      type: 'column',
      colIndex: c,
      cells: colCells,
      starsRequired: starsPerLine,
    });
  }

  // Build 2×2 blocks
  const blocks2x2: Block2x2[] = [];
  let blockId = 0;
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      const blockCells: CellId[] = [
        coordToCellId({ row: r, col: c }, size),
        coordToCellId({ row: r, col: c + 1 }, size),
        coordToCellId({ row: r + 1, col: c }, size),
        coordToCellId({ row: r + 1, col: c + 1 }, size),
      ];
      blocks2x2.push({
        id: blockId++,
        cells: blockCells,
      });
    }
  }

  return {
    size,
    starsPerLine,
    starsPerRegion,
    cellStates,
    regions,
    rows,
    cols,
    blocks2x2,
  };
}

/**
 * Clone board state (for immutability)
 */
export function cloneBoardState(state: BoardState): BoardState {
  return {
    ...state,
    cellStates: [...state.cellStates],
    regions: state.regions.map(r => ({ ...r, cells: [...r.cells] })),
    rows: state.rows.map(r => ({ ...r, cells: [...r.cells] })),
    cols: state.cols.map(c => ({ ...c, cells: [...c.cells] })),
    blocks2x2: state.blocks2x2.map(b => ({ ...b, cells: [...b.cells] })),
  };
}

