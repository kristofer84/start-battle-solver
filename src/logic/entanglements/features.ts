/**
 * Constraint feature evaluation functions
 * These functions evaluate boolean features for candidate cells
 * to determine if a constrained triple rule applies
 */

import type { PuzzleState, Coords } from '../../types/puzzle';
import { getCell, rowCells, colCells, neighbors8 } from '../helpers';

/**
 * Evaluate a named constraint feature for a candidate cell
 */
export function evaluateFeature(
  featureName: string,
  state: PuzzleState,
  candidate: Coords,
  canonicalStars?: Coords[]
): boolean {
  switch (featureName) {
    case 'candidate_on_outer_ring':
      return candidateOnOuterRing(state, candidate);
    case 'candidate_in_ring_1':
      return candidateInRing1(state, candidate);
    case 'candidate_in_same_row_as_any_star':
      return candidateInSameRowAsAnyStar(state, candidate, canonicalStars);
    case 'candidate_in_same_col_as_any_star':
      return candidateInSameColAsAnyStar(state, candidate, canonicalStars);
    default:
      // Unknown features default to false (conservative)
      console.warn(`Unknown constraint feature: ${featureName}`);
      return false;
  }
}

/**
 * Evaluate all constraint features for a candidate
 * Returns true if all features are satisfied
 */
export function evaluateAllFeatures(
  featureNames: string[],
  state: PuzzleState,
  candidate: Coords,
  canonicalStars?: Coords[]
): boolean {
  return featureNames.every((name) =>
    evaluateFeature(name, state, candidate, canonicalStars)
  );
}

/**
 * Check if candidate is on the outer ring (edge) of the board
 */
function candidateOnOuterRing(state: PuzzleState, candidate: Coords): boolean {
  const { size } = state.def;
  return (
    candidate.row === 0 ||
    candidate.row === size - 1 ||
    candidate.col === 0 ||
    candidate.col === size - 1
  );
}

/**
 * Check if candidate is in ring 1 (one cell away from edge)
 */
function candidateInRing1(state: PuzzleState, candidate: Coords): boolean {
  const { size } = state.def;
  return (
    (candidate.row === 1 || candidate.row === size - 2) &&
    candidate.col >= 1 &&
    candidate.col < size - 1
  ) || (
    (candidate.col === 1 || candidate.col === size - 2) &&
    candidate.row >= 1 &&
    candidate.row < size - 1
  );
}

/**
 * Check if candidate is in the same row as any of the canonical stars
 * (after they've been mapped to actual board positions)
 */
function candidateInSameRowAsAnyStar(
  state: PuzzleState,
  candidate: Coords,
  canonicalStars?: Coords[]
): boolean {
  if (!canonicalStars || canonicalStars.length === 0) {
    return false;
  }
  return canonicalStars.some((star) => star.row === candidate.row);
}

/**
 * Check if candidate is in the same column as any of the canonical stars
 * (after they've been mapped to actual board positions)
 */
function candidateInSameColAsAnyStar(
  state: PuzzleState,
  candidate: Coords,
  canonicalStars?: Coords[]
): boolean {
  if (!canonicalStars || canonicalStars.length === 0) {
    return false;
  }
  return canonicalStars.some((star) => star.col === candidate.col);
}
