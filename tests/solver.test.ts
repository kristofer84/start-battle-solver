import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SIZE,
  DEFAULT_STARS_PER_UNIT,
  type PuzzleDef,
} from '../src/types/puzzle';
import { solvePuzzle } from '../src/logic/search';
import { validateState } from '../src/logic/validation';
import { TEST_REGIONS } from './testBoard';

function makeDef(): PuzzleDef {
  return {
    size: DEFAULT_SIZE,
    starsPerUnit: DEFAULT_STARS_PER_UNIT,
    regions: TEST_REGIONS,
  };
}

describe('backtracking solver on test board', () => {
  it(
    'finds a complete solution obeying all constraints',
    () => {
      const def = makeDef();
      const solution = solvePuzzle(def);
      expect(solution).not.toBeNull();
      if (!solution) return;

      // No validation errors (no adjacency or over-filled units).
      const issues = validateState(solution);
      expect(issues).toEqual([]);

      // Exactly two stars per row/column.
      for (let r = 0; r < def.size; r += 1) {
        let rowStars = 0;
        for (let c = 0; c < def.size; c += 1) {
          if (solution.cells[r][c] === 'star') rowStars += 1;
        }
        expect(rowStars).toBe(def.starsPerUnit);
      }

      for (let c = 0; c < def.size; c += 1) {
        let colStars = 0;
        for (let r = 0; r < def.size; r += 1) {
          if (solution.cells[r][c] === 'star') colStars += 1;
        }
        expect(colStars).toBe(def.starsPerUnit);
      }

      // Exactly two stars per region.
      for (let id = 1; id <= 10; id += 1) {
        let regStars = 0;
        for (let r = 0; r < def.size; r += 1) {
          for (let c = 0; c < def.size; c += 1) {
            if (def.regions[r][c] === id && solution.cells[r][c] === 'star') {
              regStars += 1;
            }
          }
        }
        expect(regStars).toBe(def.starsPerUnit);
      }
    },
    20_000,
  );
});


