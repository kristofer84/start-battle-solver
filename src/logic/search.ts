import type { PuzzleDef, PuzzleState } from '../types/puzzle';
import { createEmptyPuzzleState } from '../types/puzzle';

/**
 * Specialized row-by-row solver for 10×10, 2★ Star Battle puzzles.
 * This is used only in tests; it assumes size === 10 and starsPerUnit === 2.
 */
export function solvePuzzle(def: PuzzleDef): PuzzleState | null {
  if (def.size !== 10 || def.starsPerUnit !== 2) {
    return null;
  }

  const size = def.size;
  const starsPerUnit = def.starsPerUnit;

  // Column and region star counts accumulated as we go.
  const colCounts = new Array(size).fill(0);
  const regionCounts = new Map<number, number>();

  // Store chosen star columns for each row to materialize the solution later.
  const rowStars: [number, number][] = new Array(size);

  function rowHasCapacityAfter(r: number, colIndex: number): boolean {
    // For columns, ensure that with remaining rows we can still reach 2 stars.
    for (let c = 0; c < size; c += 1) {
      const remainingRows = size - (r + 1);
      if (colCounts[c] > starsPerUnit) return false;
      if (colCounts[c] + remainingRows < starsPerUnit) return false;
    }
    return true;
  }

  function solveRow(row: number, prevCols: number[]): boolean {
    if (row === size) {
      // All rows assigned; verify exact quotas.
      for (let c = 0; c < size; c += 1) {
        if (colCounts[c] !== starsPerUnit) return false;
      }
      for (let id = 1; id <= 10; id += 1) {
        if ((regionCounts.get(id) ?? 0) !== starsPerUnit) return false;
      }
      return true;
    }

    // Try all column pairs (c1,c2) with |c1-c2| >= 2 for this row.
    for (let c1 = 0; c1 < size; c1 += 1) {
      for (let c2 = c1 + 2; c2 < size; c2 += 1) {
        const cols = [c1, c2];

        // Check adjacency with previous row's stars.
        let ok = true;
        for (const pc of prevCols) {
          for (const cc of cols) {
            if (Math.abs(pc - cc) <= 1) {
              ok = false;
              break;
            }
          }
          if (!ok) break;
        }
        if (!ok) continue;

        // Column and region quota checks for this row.
        for (const cc of cols) {
          if (colCounts[cc] >= starsPerUnit) {
            ok = false;
            break;
          }
          const regionId = def.regions[row][cc];
          const currentRegionCount = regionCounts.get(regionId) ?? 0;
          if (currentRegionCount >= starsPerUnit) {
            ok = false;
            break;
          }
        }
        if (!ok) continue;

        // Apply this row's stars.
        for (const cc of cols) {
          colCounts[cc] += 1;
          const regionId = def.regions[row][cc];
          regionCounts.set(regionId, (regionCounts.get(regionId) ?? 0) + 1);
        }
        rowStars[row] = [c1, c2];

        // Feasibility check with remaining rows.
        if (rowHasCapacityAfter(row, 0) && solveRow(row + 1, cols)) {
          return true;
        }

        // Undo.
        for (const cc of cols) {
          colCounts[cc] -= 1;
          const regionId = def.regions[row][cc];
          regionCounts.set(regionId, (regionCounts.get(regionId) ?? 0) - 1);
        }
      }
    }

    return false;
  }

  const success = solveRow(0, []);
  if (!success) return null;

  const state = createEmptyPuzzleState(def);
  for (let r = 0; r < size; r += 1) {
    const [c1, c2] = rowStars[r];
    state.cells[r][c1] = 'star';
    state.cells[r][c2] = 'star';
  }

  return state;
}


