import type { PuzzleState, Coords } from '../../types/puzzle';
import type { Hint } from '../../types/hints';

let hintCounter = 0;

function nextHintId() {
  hintCounter += 1;
  return `exclusion-${hintCounter}`;
}

/**
 * Exclusion (basic counting version):
 *
 * For each empty cell, consider placing a hypothetical star there.
 * If this would make it impossible for some row/column/region to
 * reach its required number of stars (even ignoring adjacency and 2×2),
 * then that cell is a forced cross.
 *
 * This captures a safe subset of the "exclusion" ideas from
 * Kris De Asis' *A Star Battle Guide*.
 */
export function findExclusionHint(state: PuzzleState): Hint | null {
  const { size, starsPerUnit, regions } = state.def;

  // Precompute star and empty counts per row/column/region.
  const rowStars = new Array(size).fill(0);
  const rowEmpties = new Array(size).fill(0);
  const colStars = new Array(size).fill(0);
  const colEmpties = new Array(size).fill(0);
  const regionStars = new Map<number, number>();
  const regionEmpties = new Map<number, number>();

  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      const cell = state.cells[r][c];
      const regionId = regions[r][c];
      if (cell === 'star') {
        rowStars[r] += 1;
        colStars[c] += 1;
        regionStars.set(regionId, (regionStars.get(regionId) ?? 0) + 1);
      } else if (cell === 'empty') {
        rowEmpties[r] += 1;
        colEmpties[c] += 1;
        regionEmpties.set(regionId, (regionEmpties.get(regionId) ?? 0) + 1);
      }
    }
  }

  function wouldBreakUnit(stars: number, empties: number): boolean {
    // After placing a star in this unit:
    const s = stars + 1;
    const e = empties - 1;
    const remaining = starsPerUnit - s;
    if (remaining < 0) return true; // would exceed quota
    if (remaining > e) return true; // not enough slots left
    return false;
  }

  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      if (state.cells[r][c] !== 'empty') continue;
      const regionId = regions[r][c];

      const breaksRow = wouldBreakUnit(rowStars[r], rowEmpties[r]);
      const breaksCol = wouldBreakUnit(colStars[c], colEmpties[c]);
      const breaksRegion = wouldBreakUnit(
        regionStars.get(regionId) ?? 0,
        regionEmpties.get(regionId) ?? 0,
      );

      if (breaksRow || breaksCol || breaksRegion) {
        const cell: Coords = { row: r, col: c };
        const reasons: string[] = [];
        if (breaksRow) reasons.push(`row ${r + 1}`);
        if (breaksCol) reasons.push(`column ${c + 1}`);
        if (breaksRegion) reasons.push(`region ${regionId}`);

        const explanation = `If this cell contained a star, ${reasons.join(
          ' and ',
        )} could no longer fit the required ${starsPerUnit} stars, so this cell must be a cross.`;

        return {
          id: nextHintId(),
          kind: 'place-cross',
          technique: 'exclusion',
          resultCells: [cell],
          explanation,
          highlights: {
            rows: breaksRow ? [r] : undefined,
            cols: breaksCol ? [c] : undefined,
            regions: breaksRegion ? [regionId] : undefined,
            cells: [cell],
          },
        };
      }
    }
  }

  return null;
}


