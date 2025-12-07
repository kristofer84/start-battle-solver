/**
 * Schema-Based Technique
 * 
 * Uses the schema-based logical engine to find hints.
 * This integrates the new schema system with the existing technique framework.
 */

import type { PuzzleState } from '../../types/puzzle';
import type { Hint } from '../../types/hints';
import { findSchemaHints } from '../schemas/runtime';

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

