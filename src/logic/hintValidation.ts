import type { Hint } from '../types/hints';
import type { PuzzleState } from '../types/puzzle';
import { validateState } from './validation';

function getCellType(hint: Hint, row: number, col: number): 'star' | 'cross' {
  const schemaType = hint.schemaCellTypes?.get(`${row},${col}`);
  if (schemaType === 'star' || schemaType === 'cross') {
    return schemaType;
  }
  return hint.kind === 'place-star' ? 'star' : 'cross';
}

export function isHintConsistent(state: PuzzleState, hint: Hint): boolean {
  const candidate = state.cells.map(row => [...row]);

  for (const cell of hint.resultCells) {
    const desired = getCellType(hint, cell.row, cell.col);
    const current = candidate[cell.row][cell.col];

    if (current === desired) {
      continue;
    }

    if (current !== 'empty') {
      return false;
    }

    candidate[cell.row][cell.col] = desired;
  }

  return validateState({ ...state, cells: candidate }).length === 0;
}
