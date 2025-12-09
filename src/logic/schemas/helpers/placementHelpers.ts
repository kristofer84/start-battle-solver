import type { BoardState, CellId } from '../model/types';
import { CellState, cellIdToCoord, coordToCellId } from '../model/types';
import { getNeighbors8 } from './cellHelpers';

export function isValidBoardPlacement(state: BoardState, cellId: CellId): boolean {
  if (state.cellStates[cellId] !== CellState.Unknown) {
    return false;
  }

  const coord = cellIdToCoord(cellId, state.size);

  for (let dr = -1; dr <= 0; dr += 1) {
    for (let dc = -1; dc <= 0; dc += 1) {
      const blockTopLeft = { row: coord.row + dr, col: coord.col + dc };
      if (
        blockTopLeft.row >= 0 &&
        blockTopLeft.col >= 0 &&
        blockTopLeft.row < state.size - 1 &&
        blockTopLeft.col < state.size - 1
      ) {
        const block: CellId[] = [
          coordToCellId(blockTopLeft, state.size),
          coordToCellId({ row: blockTopLeft.row, col: blockTopLeft.col + 1 }, state.size),
          coordToCellId({ row: blockTopLeft.row + 1, col: blockTopLeft.col }, state.size),
          coordToCellId({ row: blockTopLeft.row + 1, col: blockTopLeft.col + 1 }, state.size),
        ];

        const starsInBlock = block.filter(
          id => id !== cellId && state.cellStates[id] === CellState.Star
        ).length;

        if (starsInBlock >= 1) {
          return false;
        }
      }
    }
  }

  const neighbors = getNeighbors8(cellId, state.size);
  for (const neighbor of neighbors) {
    const neighborId = coordToCellId(neighbor, state.size);
    if (state.cellStates[neighborId] === CellState.Star) {
      return false;
    }
  }

  return true;
}
