/**
 * D4 symmetry transformations (rotations and reflections)
 * Used to map canonical patterns to actual board positions
 */

import type { CoordsTuple } from '../../types/entanglements';
import type { Coords } from '../../types/puzzle';

/**
 * D4 symmetry group transformations
 * Identity, 90°, 180°, 270° rotations, and 4 reflections
 */
export type D4Transformation =
  | 'identity'
  | 'rotate90'
  | 'rotate180'
  | 'rotate270'
  | 'reflectH' // horizontal reflection (across vertical axis)
  | 'reflectV' // vertical reflection (across horizontal axis)
  | 'reflectD1' // diagonal reflection (main diagonal)
  | 'reflectD2'; // diagonal reflection (anti-diagonal)

/**
 * All D4 transformations
 */
export const ALL_D4_TRANSFORMATIONS: D4Transformation[] = [
  'identity',
  'rotate90',
  'rotate180',
  'rotate270',
  'reflectH',
  'reflectV',
  'reflectD1',
  'reflectD2',
];

/**
 * Apply a D4 transformation to a coordinate
 * Assumes coordinates are relative (can be negative)
 */
export function transformCoords(
  coord: CoordsTuple,
  transform: D4Transformation
): CoordsTuple {
  const [r, c] = coord;

  switch (transform) {
    case 'identity':
      return [r, c];
    case 'rotate90':
      return [c, -r];
    case 'rotate180':
      return [-r, -c];
    case 'rotate270':
      return [-c, r];
    case 'reflectH':
      return [r, -c];
    case 'reflectV':
      return [-r, c];
    case 'reflectD1':
      return [c, r];
    case 'reflectD2':
      return [-c, -r];
    default:
      return [r, c];
  }
}

/**
 * Apply a transformation to multiple coordinates
 */
export function transformCoordsList(
  coords: CoordsTuple[],
  transform: D4Transformation
): CoordsTuple[] {
  return coords.map((coord) => transformCoords(coord, transform));
}

/**
 * Translate coordinates by an offset
 */
export function translateCoords(
  coord: CoordsTuple,
  offset: CoordsTuple
): CoordsTuple {
  return [coord[0] + offset[0], coord[1] + offset[1]];
}

/**
 * Translate multiple coordinates by an offset
 */
export function translateCoordsList(
  coords: CoordsTuple[],
  offset: CoordsTuple
): CoordsTuple[] {
  return coords.map((coord) => translateCoords(coord, offset));
}

/**
 * Check if coordinates are within board bounds
 */
export function isInBounds(
  coord: CoordsTuple,
  boardSize: number
): boolean {
  const [r, c] = coord;
  return r >= 0 && r < boardSize && c >= 0 && c < boardSize;
}

/**
 * Check if all coordinates are within bounds
 */
export function allInBounds(
  coords: CoordsTuple[],
  boardSize: number
): boolean {
  return coords.every((coord) => isInBounds(coord, boardSize));
}

/**
 * Find translation offset to map canonical stars to actual stars
 * Returns null if no valid translation exists
 */
export function findTranslationOffset(
  canonicalStars: CoordsTuple[],
  actualStars: CoordsTuple[],
  boardSize: number
): CoordsTuple | null {
  if (canonicalStars.length !== actualStars.length) {
    return null;
  }

  // Try each canonical star paired with each actual star as the anchor
  for (let i = 0; i < canonicalStars.length; i += 1) {
    for (let j = 0; j < actualStars.length; j += 1) {
      const canonicalAnchor = canonicalStars[i];
      const actualAnchor = actualStars[j];

      // Calculate offset
      const offset: CoordsTuple = [
        actualAnchor[0] - canonicalAnchor[0],
        actualAnchor[1] - canonicalAnchor[1],
      ];

      // Apply offset to all canonical stars
      const translated = translateCoordsList(canonicalStars, offset);

      // Check if translated stars match actual stars (order-independent)
      if (matchesStars(translated, actualStars, boardSize)) {
        return offset;
      }
    }
  }

  return null;
}

/**
 * Check if two sets of stars match (order-independent, within bounds)
 */
function matchesStars(
  stars1: CoordsTuple[],
  stars2: CoordsTuple[],
  boardSize: number
): boolean {
  if (stars1.length !== stars2.length) return false;

  // Check all stars are in bounds
  if (!allInBounds(stars1, boardSize)) return false;

  // Create sets for comparison
  const set1 = new Set(stars1.map(([r, c]) => `${r},${c}`));
  const set2 = new Set(stars2.map(([r, c]) => `${r},${c}`));

  if (set1.size !== set2.size) return false;

  for (const key of set1) {
    if (!set2.has(key)) return false;
  }

  return true;
}

/**
 * Convert CoordsTuple to Coords
 */
export function tupleToCoords(tuple: CoordsTuple): Coords {
  return { row: tuple[0], col: tuple[1] };
}

/**
 * Convert Coords to CoordsTuple
 */
export function coordsToTuple(coords: Coords): CoordsTuple {
  return [coords.row, coords.col];
}
