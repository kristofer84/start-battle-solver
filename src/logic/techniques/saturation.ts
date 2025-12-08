import type { PuzzleState } from '../../types/puzzle';
import type { Hint } from '../../types/hints';
import { rowCells, colCells, regionCells, emptyCells, countStars, formatRow, formatCol, formatRegion } from '../helpers';

let hintCounter = 0;

function nextHintId() {
  hintCounter += 1;
  return `saturation-${hintCounter}`;
}

/**
 * Saturation:
 *
 * If all stars are already placed in a row/column/region (star count equals starsPerUnit),
 * then all remaining empty cells in that area must be crosses.
 *
 * This is a straightforward consequence: once an area has reached its star quota,
 * no more stars can be placed there, so remaining cells must be crosses.
 */
export function findSaturationHint(state: PuzzleState): Hint | null {
  const { size, starsPerUnit } = state.def;

  // Rows
  for (let r = 0; r < size; r += 1) {
    const row = rowCells(state, r);
    const starCount = countStars(state, row);
    if (starCount === starsPerUnit) {
      const empties = emptyCells(state, row);
      if (empties.length > 0) {
        return {
          id: nextHintId(),
          kind: 'place-cross',
          technique: 'saturation',
          resultCells: empties,
          explanation: `${formatRow(r)} already has all ${starsPerUnit} star(s), so all remaining empty cells must be crosses.`,
          highlights: { rows: [r], cells: empties },
        };
      }
    }
  }

  // Columns
  for (let c = 0; c < size; c += 1) {
    const col = colCells(state, c);
    const starCount = countStars(state, col);
    if (starCount === starsPerUnit) {
      const empties = emptyCells(state, col);
      if (empties.length > 0) {
        return {
          id: nextHintId(),
          kind: 'place-cross',
          technique: 'saturation',
          resultCells: empties,
          explanation: `${formatCol(c)} already has all ${starsPerUnit} star(s), so all remaining empty cells must be crosses.`,
          highlights: { cols: [c], cells: empties },
        };
      }
    }
  }

  // Regions
  for (let regionId = 1; regionId <= 10; regionId += 1) {
    const region = regionCells(state, regionId);
    if (!region.length) continue;
    const starCount = countStars(state, region);
    if (starCount === starsPerUnit) {
      const empties = emptyCells(state, region);
      if (empties.length > 0) {
        return {
          id: nextHintId(),
          kind: 'place-cross',
          technique: 'saturation',
          resultCells: empties,
          explanation: `Region ${formatRegion(regionId)} already has all ${starsPerUnit} star(s), so all remaining empty cells must be crosses.`,
          highlights: { regions: [regionId], cells: empties },
        };
      }
    }
  }

  return null;
}

