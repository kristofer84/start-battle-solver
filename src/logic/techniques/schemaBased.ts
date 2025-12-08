/**
 * Schema-Based Technique
 * 
 * Uses the schema-based logical engine to find hints.
 * This integrates the new schema system with the existing technique framework.
 */

import type { PuzzleState } from '../../types/puzzle';
import type { Hint } from '../../types/hints';
import { findSchemaHints } from '../schemas/runtime';
import { colCells, neighbors8, rowCells } from '../helpers';

/**
 * Find hint using schema-based system
 */
export function findSchemaBasedHint(state: PuzzleState): Hint | null {
  const hint = findSchemaHints(state);
  if (!hint) return null;

  // Convert to proper Hint format
  const resultCells: Array<{ row: number; col: number }> = [
    ...hint.forcedStars.map(c => ({ row: c.row, col: c.col })),
    ...hint.forcedCrosses.map(c => ({ row: c.row, col: c.col })),
  ];

  if (resultCells.length === 0) return null;

  // Validate that applying the hint would keep the puzzle state sound.
  // Schema-based logic is experimental, so we defensively verify the
  // deductions before surfacing them to the user/tests.
  const candidateState = state.cells.map(row => [...row]);
  for (const cell of resultCells) {
    const value = hint.forcedStars.some(s => s.row === cell.row && s.col === cell.col)
      ? 'star'
      : 'cross';
    candidateState[cell.row][cell.col] = value;
  }

  const { size, starsPerUnit, regions } = state.def;

  // Quota and adjacency checks
  for (let r = 0; r < size; r += 1) {
    const row = rowCells({ ...state, cells: candidateState }, r);
    if (row.filter(c => c === 'star').length > starsPerUnit) return null;
  }

  for (let c = 0; c < size; c += 1) {
    const col = colCells({ ...state, cells: candidateState }, c);
    if (col.filter(cell => cell === 'star').length > starsPerUnit) return null;
  }

  const regionStarCounts = new Map<number, number>();
  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      if (candidateState[r][c] !== 'star') continue;
      const regionId = regions[r][c];
      regionStarCounts.set(regionId, (regionStarCounts.get(regionId) || 0) + 1);

      if (regionStarCounts.get(regionId)! > starsPerUnit) {
        return null;
      }

      const nbs = neighbors8({ row: r, col: c }, size);
      for (const nb of nbs) {
        if (candidateState[nb.row][nb.col] === 'star') {
          return null;
        }
      }
    }
  }

  // Determine hint kind based on first deduction
  const kind: 'place-star' | 'place-cross' = hint.forcedStars.length > 0 ? 'place-star' : 'place-cross';

  return {
    id: hint.id,
    kind,
    technique: 'schema-based',
    resultCells,
    explanation: hint.explanation,
    highlights: hint.highlights,
  };
}

