import type { Coords, PuzzleState } from '../../types/puzzle';
import { colCells, countStars, getCell, neighbors8, regionCells, rowCells } from '../helpers';

export function isValidStarPlacement(state: PuzzleState, cell: Coords): boolean {
  if (getCell(state, cell) !== 'empty') {
    return false;
  }

  for (let dr = -1; dr <= 0; dr += 1) {
    for (let dc = -1; dc <= 0; dc += 1) {
      const blockTopLeft = { row: cell.row + dr, col: cell.col + dc };
      if (
        blockTopLeft.row >= 0 &&
        blockTopLeft.col >= 0 &&
        blockTopLeft.row < state.def.size - 1 &&
        blockTopLeft.col < state.def.size - 1
      ) {
        const block: Coords[] = [
          blockTopLeft,
          { row: blockTopLeft.row, col: blockTopLeft.col + 1 },
          { row: blockTopLeft.row + 1, col: blockTopLeft.col },
          { row: blockTopLeft.row + 1, col: blockTopLeft.col + 1 },
        ];

        const starsInBlock = block.filter(
          c => (c.row !== cell.row || c.col !== cell.col) && getCell(state, c) === 'star'
        ).length;

        if (starsInBlock >= 1) {
          return false;
        }
      }
    }
  }

  const adjacent = neighbors8(cell, state.def.size);
  for (const adj of adjacent) {
    if (getCell(state, adj) === 'star') {
      return false;
    }
  }

  return true;
}

export function canPlaceAllStarsSimultaneously(
  state: PuzzleState,
  candidates: Coords[],
  starsPerUnit: number
): Coords[] | null {
  const accepted: Coords[] = [];

  for (const cell of candidates) {
    if (getCell(state, cell) !== 'empty') {
      return null;
    }

    const neighbors = neighbors8(cell, state.def.size);
    if (neighbors.some(nb => getCell(state, nb) === 'star')) {
      return null;
    }

    if (
      accepted.some(other => Math.abs(cell.row - other.row) <= 1 && Math.abs(cell.col - other.col) <= 1)
    ) {
      return null;
    }

    const rowStarCount = countStars(state, rowCells(state, cell.row));
    const colStarCount = countStars(state, colCells(state, cell.col));
    const regionId = state.def.regions[cell.row][cell.col];
    const regionStarCount = countStars(state, regionCells(state, regionId));

    const plannedInRow = accepted.filter(c => c.row === cell.row).length;
    const plannedInCol = accepted.filter(c => c.col === cell.col).length;
    const plannedInRegion = accepted.filter(c => state.def.regions[c.row][c.col] === regionId).length;

    if (
      rowStarCount + plannedInRow + 1 > starsPerUnit ||
      colStarCount + plannedInCol + 1 > starsPerUnit ||
      regionStarCount + plannedInRegion + 1 > starsPerUnit
    ) {
      return null;
    }

    accepted.push(cell);
  }

  return [...candidates];
}
