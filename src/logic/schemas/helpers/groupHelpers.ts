/**
 * Group-level helper functions
 */

import type { BoardState, Group, CellId } from '../model/types';
import { CellState } from '../model/types';
import { getStarCountInCells, getUnknownOrStarCandidates } from './cellHelpers';

/**
 * Get number of stars remaining in a group
 */
export function getStarsRemainingInGroup(group: Group, state: BoardState): number {
  if (group.starsRequired === undefined) return 0;
  const currentStars = getStarCountInCells(state, group.cells);
  return Math.max(0, group.starsRequired - currentStars);
}

/**
 * Get candidate cells in a group (unknown or star, not forced empty)
 */
export function getCandidatesInGroup(group: Group, state: BoardState): CellId[] {
  return getUnknownOrStarCandidates(state, group.cells);
}

/**
 * Get star count in a group
 */
export function getStarCountInGroup(group: Group, state: BoardState): number {
  return getStarCountInCells(state, group.cells);
}

/**
 * Check if a region is fully inside a set of rows
 */
export function regionFullyInsideRows(region: { cells: CellId[] }, rows: number[], size: number): boolean {
  const rowSet = new Set(rows);
  for (const cellId of region.cells) {
    const row = Math.floor(cellId / size);
    if (!rowSet.has(row)) {
      return false;
    }
  }
  return true;
}

/**
 * Check if a region is fully inside a set of columns
 */
export function regionFullyInsideCols(region: { cells: CellId[] }, cols: number[], size: number): boolean {
  const colSet = new Set(cols);
  for (const cellId of region.cells) {
    const col = cellId % size;
    if (!colSet.has(col)) {
      return false;
    }
  }
  return true;
}

