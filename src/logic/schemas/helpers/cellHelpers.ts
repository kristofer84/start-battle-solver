/**
 * Cell-level helper functions
 */

import type { BoardState, CellId, Coords } from '../model/types';
import { CellState, cellIdToCoord } from '../model/types';

/**
 * Get star count in a set of cells
 */
export function getStarCountInCells(state: BoardState, cells: CellId[]): number {
  return cells.filter(cellId => state.cellStates[cellId] === CellState.Star).length;
}

/**
 * Get unknown or star candidate cells (not forced empty)
 */
export function getUnknownOrStarCandidates(state: BoardState, cells: CellId[]): CellId[] {
  return cells.filter(
    cellId => state.cellStates[cellId] === CellState.Unknown || state.cellStates[cellId] === CellState.Star
  );
}

/**
 * Check if a cell is a star candidate (unknown or star, not empty)
 */
export function isStarCandidate(state: BoardState, cellId: CellId): boolean {
  const cellState = state.cellStates[cellId];
  return cellState === CellState.Unknown || cellState === CellState.Star;
}

/**
 * Get 8-directional neighbors (orthogonal + diagonal)
 */
export function getNeighbors8(cellId: CellId, size: number): Coords[] {
  const coord = cellIdToCoord(cellId, size);
  const neighbors: Coords[] = [];
  
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = coord.row + dr;
      const c = coord.col + dc;
      if (r >= 0 && r < size && c >= 0 && c < size) {
        neighbors.push({ row: r, col: c });
      }
    }
  }
  
  return neighbors;
}

/**
 * Check if two cells are adjacent (8-directional)
 */
export function areAdjacent(cellId1: CellId, cellId2: CellId, size: number): boolean {
  const coord1 = cellIdToCoord(cellId1, size);
  const coord2 = cellIdToCoord(cellId2, size);
  const dr = Math.abs(coord1.row - coord2.row);
  const dc = Math.abs(coord1.col - coord2.col);
  return dr <= 1 && dc <= 1 && (dr !== 0 || dc !== 0);
}

