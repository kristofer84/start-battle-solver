import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SIZE,
  DEFAULT_STARS_PER_UNIT,
  type PuzzleDef,
  createEmptyPuzzleState,
} from '../src/types/puzzle';
import { findSimpleShapesHint } from '../src/logic/techniques/simpleShapes';

function makeHorizontalStripDef(): PuzzleDef {
  const regions: number[][] = [];
  for (let r = 0; r < DEFAULT_SIZE; r += 1) {
    const row: number[] = [];
    for (let c = 0; c < DEFAULT_SIZE; c += 1) {
      row.push(1);
    }
    regions.push(row);
  }
  // Make region 1 a horizontal 1×4 at row 4, columns 3..6
  for (let r = 0; r < DEFAULT_SIZE; r += 1) {
    for (let c = 0; c < DEFAULT_SIZE; c += 1) {
      regions[r][c] = 2; // default region
    }
  }
  const stripRow = 4;
  for (let c = 3; c <= 6; c += 1) {
    regions[stripRow][c] = 1;
  }

  return {
    size: DEFAULT_SIZE,
    starsPerUnit: DEFAULT_STARS_PER_UNIT,
    regions,
  };
}

describe('simple-shapes technique – 1×4 / 4×1 regions', () => {
  it('marks outside cells for a horizontal 1×4 region as crosses', () => {
    const def = makeHorizontalStripDef();
    const state = createEmptyPuzzleState(def);

    const hint = findSimpleShapesHint(state);
    expect(hint).not.toBeNull();
    if (!hint) return;

    expect(hint.kind).toBe('place-cross');

    const stripRow = 4;
    const inStripCols = new Set([3, 4, 5, 6]);

    // Every suggested cross in the stripRow must be outside the 1×4.
    for (const c of hint.resultCells) {
      if (c.row === stripRow) {
        expect(inStripCols.has(c.col)).toBe(false);
      }
    }

    // The 1×4 cells themselves should not be in resultCells.
    for (let c = 3; c <= 6; c += 1) {
      expect(
        hint.resultCells.some((rc) => rc.row === stripRow && rc.col === c),
      ).toBe(false);
    }
  });
});


