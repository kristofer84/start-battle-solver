import type { PuzzleState } from '../../types/puzzle';
import type { Hint } from '../../types/hints';
import { rowCells, colCells, regionCells, emptyCells, countStars } from '../helpers';

let hintCounter = 0;

function nextHintId() {
  hintCounter += 1;
  return `one-by-n-${hintCounter}`;
}

/**
 * 1×N / "1+n" style bands:
 *
 * If a row/column/region has exactly as many empty cells as remaining stars,
 * then all of those empty cells must be stars.
 *
 * This is a straightforward counting consequence and is always sound, even
 * though it captures only a subset of the full 1×N ideas from the guide.
 */
export function findOneByNHint(state: PuzzleState): Hint | null {
  const { size, starsPerUnit } = state.def;

  // Rows
  for (let r = 0; r < size; r += 1) {
    const row = rowCells(state, r);
    const empties = emptyCells(state, row);
    if (empties.length === 0) continue;
    const starCount = countStars(state, row);
    const remaining = starsPerUnit - starCount;
    if (remaining > 0 && remaining === empties.length) {
      return {
        id: nextHintId(),
        kind: 'place-star',
        technique: 'one-by-n',
        resultCells: empties,
        explanation: `Row ${r + 1} needs ${remaining} more star(s) and has exactly ${empties.length} empty cells left, so all of them must be stars.`,
        highlights: { rows: [r], cells: empties },
      };
    }
  }

  // Columns
  for (let c = 0; c < size; c += 1) {
    const col = colCells(state, c);
    const empties = emptyCells(state, col);
    if (empties.length === 0) continue;
    const starCount = countStars(state, col);
    const remaining = starsPerUnit - starCount;
    if (remaining > 0 && remaining === empties.length) {
      return {
        id: nextHintId(),
        kind: 'place-star',
        technique: 'one-by-n',
        resultCells: empties,
        explanation: `Column ${c + 1} needs ${remaining} more star(s) and has exactly ${empties.length} empty cells left, so all of them must be stars.`,
        highlights: { cols: [c], cells: empties },
      };
    }
  }

  // Regions
  for (let regionId = 1; regionId <= 10; regionId += 1) {
    const region = regionCells(state, regionId);
    if (!region.length) continue;
    const empties = emptyCells(state, region);
    if (empties.length === 0) continue;
    const starCount = countStars(state, region);
    const remaining = starsPerUnit - starCount;
    if (remaining > 0 && remaining === empties.length) {
      return {
        id: nextHintId(),
        kind: 'place-star',
        technique: 'one-by-n',
        resultCells: empties,
        explanation: `Region ${regionId} needs ${remaining} more star(s) and has exactly ${empties.length} empty cells left, so all of them must be stars.`,
        highlights: { regions: [regionId], cells: empties },
      };
    }
  }

  return null;
}


