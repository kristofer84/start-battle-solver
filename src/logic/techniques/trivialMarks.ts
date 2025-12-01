import type { PuzzleState, Coords } from '../../types/puzzle';
import type { Hint } from '../../types/hints';
import { rowCells, colCells, regionCells, emptyCells, neighbors8, countStars } from '../helpers';

let hintCounter = 0;

function nextHintId() {
  hintCounter += 1;
  return `trivial-${hintCounter}`;
}

export function findTrivialMarksHint(state: PuzzleState): Hint | null {
  const size = state.def.size;
  const starsPerUnit = state.def.starsPerUnit;

  // 1) Unit saturation: row / column / region already has all its stars -> remaining empties are crosses.
  for (let r = 0; r < size; r += 1) {
    const row = rowCells(state, r);
    const empties = emptyCells(state, row);
    if (!empties.length) continue;
    const starCount = countStars(state, row);
    if (starCount === starsPerUnit) {
      return {
        id: nextHintId(),
        kind: 'place-cross',
        technique: 'trivial-marks',
        resultCells: empties,
        explanation: `Row ${r + 1} already has ${starsPerUnit} stars, so all remaining empty cells in that row must be crosses.`,
        highlights: { rows: [r], cells: empties },
      };
    }
  }

  for (let c = 0; c < size; c += 1) {
    const col = colCells(state, c);
    const empties = emptyCells(state, col);
    if (!empties.length) continue;
    const starCount = countStars(state, col);
    if (starCount === starsPerUnit) {
      return {
        id: nextHintId(),
        kind: 'place-cross',
        technique: 'trivial-marks',
        resultCells: empties,
        explanation: `Column ${c + 1} already has ${starsPerUnit} stars, so all remaining empty cells in that column must be crosses.`,
        highlights: { cols: [c], cells: empties },
      };
    }
  }

  for (let regionId = 1; regionId <= 10; regionId += 1) {
    const region = regionCells(state, regionId);
    if (!region.length) continue;
    const empties = emptyCells(state, region);
    if (!empties.length) continue;
    const starCount = countStars(state, region);
    if (starCount === starsPerUnit) {
      return {
        id: nextHintId(),
        kind: 'place-cross',
        technique: 'trivial-marks',
        resultCells: empties,
        explanation: `Region ${regionId} already has ${starsPerUnit} stars, so all remaining empty cells in that region must be crosses.`,
        highlights: { regions: [regionId], cells: empties },
      };
    }
  }

  // 2) Star adjacency: each placed star forces its 8 neighbors to be crosses.
  const forcedCrosses: Coords[] = [];
  const highlightCells: Coords[] = [];

  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      if (state.cells[r][c] !== 'star') continue;
      const center: Coords = { row: r, col: c };
      const nbs = neighbors8(center, size);
      for (const nb of nbs) {
        if (state.cells[nb.row][nb.col] === 'empty') {
          forcedCrosses.push(nb);
        }
      }
      highlightCells.push(center);
    }
  }

  if (forcedCrosses.length) {
    // Deduplicate forcedCrosses
    const key = (c: Coords) => `${c.row},${c.col}`;
    const seen = new Set<string>();
    const unique = forcedCrosses.filter((c) => {
      const k = key(c);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    return {
      id: nextHintId(),
      kind: 'place-cross',
      technique: 'trivial-marks',
      resultCells: unique,
      explanation:
        'A star cannot touch another star, so all empty neighbors of existing stars must be crosses.',
      highlights: { cells: [...highlightCells, ...unique] },
    };
  }

  return null;
}


