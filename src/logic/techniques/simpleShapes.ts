import type { PuzzleState, Coords } from '../../types/puzzle';
import type { Hint } from '../../types/hints';
import { regionCells } from '../helpers';

let hintCounter = 0;

function nextHintId() {
  hintCounter += 1;
  return `simple-shapes-${hintCounter}`;
}

/**
 * Simple shapes – 1×4 / 4×1 regions in 10×10 2★:
 *
 * In a 10×10 2★ puzzle, if a region consists of exactly four cells that form a
 * straight horizontal or vertical 1×4 (or 4×1), then:
 *
 * - Both stars of that region must lie in those four cells.
 * - Therefore the corresponding row (horizontal case) or column (vertical case)
 *   already contains its two stars and all other cells in that row/column are
 *   forced crosses.
 *
 * This technique places those forced crosses as a hint; it does not guess the
 * exact star locations inside the strip.
 */
export function findSimpleShapesHint(state: PuzzleState): Hint | null {
  const { size, starsPerUnit, regions } = state.def;

  // This rule is specific to 10×10 2★ puzzles.
  if (size !== 10 || starsPerUnit !== 2) return null;

  const maxRegionId = 10;

  for (let regionId = 1; regionId <= maxRegionId; regionId += 1) {
    const cells = regionCells(state, regionId);
    if (cells.length !== 4) continue;

    const rows = new Set(cells.map((c) => c.row));
    const cols = new Set(cells.map((c) => c.col));

    const forcedCrosses: Coords[] = [];

    // Horizontal 1×4 (all in same row, four contiguous columns)
    if (rows.size === 1) {
      const row = cells[0].row;
      const sortedCols = [...cols].sort((a, b) => a - b);
      if (sortedCols[3] - sortedCols[0] !== 3) continue; // not contiguous 1×4

      const [c0, c1, c2, c3] = sortedCols;

      // All other cells in this row must be crosses.
      for (let c = 0; c < size; c += 1) {
        if (c >= c0 && c <= c3) continue;
        if (state.cells[row][c] === 'empty') {
          forcedCrosses.push({ row, col: c });
        }
      }

      // Cells directly above and below the strip are adjacent to some star
      // for every valid 2-star placement in the 1×4, so they are also crosses.
      const neighborRows = [row - 1, row + 1];
      for (const nr of neighborRows) {
        if (nr < 0 || nr >= size) continue;
        for (let c = c0; c <= c3; c += 1) {
          if (state.cells[nr][c] === 'empty') {
            forcedCrosses.push({ row: nr, col: c });
          }
        }
      }
    }

    // Vertical 4×1 (all in same column, four contiguous rows)
    if (cols.size === 1) {
      const col = cells[0].col;
      const sortedRows = [...rows].sort((a, b) => a - b);
      if (sortedRows[3] - sortedRows[0] !== 3) continue; // not contiguous 4×1

      const [r0, r1, r2, r3] = sortedRows;

      // All other cells in this column must be crosses.
      for (let r = 0; r < size; r += 1) {
        if (r >= r0 && r <= r3) continue;
        if (state.cells[r][col] === 'empty') {
          forcedCrosses.push({ row: r, col });
        }
      }

      // Cells directly left and right of the strip are adjacent to some star
      // for every valid 2-star placement in the 4×1, so they are also crosses.
      const neighborCols = [col - 1, col + 1];
      for (const nc of neighborCols) {
        if (nc < 0 || nc >= size) continue;
        for (let r = r0; r <= r3; r += 1) {
          if (state.cells[r][nc] === 'empty') {
            forcedCrosses.push({ row: r, col: nc });
          }
        }
      }
    }

    if (forcedCrosses.length) {
      // Deduplicate
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
        technique: 'simple-shapes',
        resultCells: unique,
        explanation:
          'This region is a 1×4 (or 4×1) strip in a 10×10 2★ puzzle, so both of its stars must lie in the strip. The rest of the row/column and the cells directly next to the strip cannot contain stars and are crosses.',
        highlights: {
          regions: [regionId],
          cells: [...cells, ...unique],
        },
      };
    }
  }

  return null;
}


