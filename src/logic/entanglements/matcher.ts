/**
 * Pattern matching logic for entanglement rules
 * Maps canonical patterns to actual board positions
 */

import type { PuzzleState, Coords } from '../../types/puzzle';
import type {
  TripleRule,
  LoadedEntanglementSpec,
  CoordsTuple,
} from '../../types/entanglements';
import {
  transformCoordsList,
  transformCoords,
  translateCoords,
  allInBounds,
  tupleToCoords,
  coordsToTuple,
  ALL_D4_TRANSFORMATIONS,
  type D4Transformation,
} from './transformations';
import { evaluateAllFeatures } from './features';
import { getCell } from '../helpers';

/**
 * Get all placed stars from the puzzle state
 */
export function getAllPlacedStars(state: PuzzleState): Coords[] {
  const stars: Coords[] = [];
  for (let r = 0; r < state.def.size; r += 1) {
    for (let c = 0; c < state.def.size; c += 1) {
      if (state.cells[r][c] === 'star') {
        stars.push({ row: r, col: c });
      }
    }
  }
  return stars;
}

/**
 * Find all valid mappings of a canonical pattern to actual board stars
 */
export function findPatternMappings(
  canonicalStars: CoordsTuple[],
  actualStars: Coords[],
  boardSize: number
): Array<{
  transform: D4Transformation;
  offset: CoordsTuple;
  mappedStars: Coords[];
}> {
  const mappings: Array<{
    transform: D4Transformation;
    offset: CoordsTuple;
    mappedStars: Coords[];
  }> = [];

  if (canonicalStars.length === 0 || actualStars.length < canonicalStars.length) {
    return mappings;
  }

  // Try each D4 transformation
  for (const transform of ALL_D4_TRANSFORMATIONS) {
    const transformed = transformCoordsList(canonicalStars, transform);

    // Try each combination of actual stars that matches the count
    const combinations = getCombinations(actualStars, canonicalStars.length);

    for (const combo of combinations) {
      const actualTuples = combo.map(coordsToTuple);
      const offset = findTranslationOffset(transformed, actualTuples, boardSize);

      if (offset) {
        const mappedStars = transformed
          .map((c) => translateCoords(c, offset))
          .map(tupleToCoords);

        // Verify all mapped stars are in bounds and match actual stars
        if (allInBounds(transformed.map((c) => translateCoords(c, offset)), boardSize)) {
          mappings.push({
            transform,
            offset,
            mappedStars,
          });
        }
      }
    }
  }

  return mappings;
}

/**
 * Find translation offset between transformed canonical stars and actual stars
 */
function findTranslationOffset(
  transformed: CoordsTuple[],
  actual: CoordsTuple[],
  boardSize: number
): CoordsTuple | null {
  if (transformed.length !== actual.length) {
    return null;
  }

  // Try each transformed star as anchor with each actual star
  for (let i = 0; i < transformed.length; i += 1) {
    for (let j = 0; j < actual.length; j += 1) {
      const offset: CoordsTuple = [
        actual[j][0] - transformed[i][0],
        actual[j][1] - transformed[i][1],
      ];

      // Apply offset to all transformed stars
      const translated = transformed.map((c) => [
        c[0] + offset[0],
        c[1] + offset[1],
      ] as CoordsTuple);

      // Check if translated matches actual (order-independent)
      if (matchesStars(translated, actual, boardSize)) {
        return offset;
      }
    }
  }

  return null;
}

/**
 * Check if two sets of stars match (order-independent)
 */
function matchesStars(
  stars1: CoordsTuple[],
  stars2: CoordsTuple[],
  boardSize: number
): boolean {
  if (stars1.length !== stars2.length) return false;
  if (!allInBounds(stars1, boardSize)) return false;

  const set1 = new Set(stars1.map(([r, c]) => `${r},${c}`));
  const set2 = new Set(stars2.map(([r, c]) => `${r},${c}`));

  if (set1.size !== set2.size) return false;

  for (const key of set1) {
    if (!set2.has(key)) return false;
  }

  return true;
}

/**
 * Get all combinations of k elements from array
 */
function getCombinations<T>(array: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (k > array.length) return [];

  const combinations: T[][] = [];

  function combine(start: number, combo: T[]) {
    if (combo.length === k) {
      combinations.push([...combo]);
      return;
    }

    for (let i = start; i < array.length; i += 1) {
      combo.push(array[i]);
      combine(i + 1, combo);
      combo.pop();
    }
  }

  combine(0, []);
  return combinations;
}

/**
 * Apply a triple rule to find forced cells
 */
export function applyTripleRule(
  rule: TripleRule,
  state: PuzzleState,
  actualStars: Coords[]
): Coords[] {
  const forcedCells: Coords[] = [];
  const { size } = state.def;

  // Find all valid mappings of canonical stars to actual stars
  const mappings = findPatternMappings(
    rule.canonical_stars,
    actualStars,
    size
  );

  for (const mapping of mappings) {
    // Transform the canonical candidate using the same transformation and offset
    const transformedCandidate = transformCoords(rule.canonical_candidate, mapping.transform);

    // Apply the same translation offset
    const candidateTuple: CoordsTuple = [
      transformedCandidate[0] + mapping.offset[0],
      transformedCandidate[1] + mapping.offset[1],
    ];

    // Check bounds
    if (!allInBounds([candidateTuple], size)) {
      continue;
    }

    const candidate = tupleToCoords(candidateTuple);

    // Check if candidate is currently undecided
    if (getCell(state, candidate) !== 'empty') {
      continue;
    }

    // Evaluate constraint features
    const featuresSatisfied = evaluateAllFeatures(
      rule.constraint_features,
      state,
      candidate,
      mapping.mappedStars
    );

    if (featuresSatisfied) {
      // Rule applies - candidate is forced
      // Note: The rule.forced field indicates whether it's forced star or forced empty
      // For now, we'll treat it as forced empty (cross) based on typical entanglement semantics
      // This might need adjustment based on actual data format
      forcedCells.push(candidate);
    }
  }

  return forcedCells;
}
