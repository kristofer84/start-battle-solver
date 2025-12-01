import { describe, expect, it } from 'vitest';
import { createEmptyPuzzleDef, createEmptyPuzzleState } from '../src/types/puzzle';
import { findTrivialMarksHint } from '../src/logic/techniques/trivialMarks';

describe('trivial-marks technique', () => {
  it('marks remaining cells in a full row as crosses', () => {
    const def = createEmptyPuzzleDef();
    const state = createEmptyPuzzleState(def);
    // Put two stars in row 0, columns 0 and 3
    state.cells[0][0] = 'star';
    state.cells[0][3] = 'star';

    const hint = findTrivialMarksHint(state);
    expect(hint).not.toBeNull();
    expect(hint?.kind).toBe('place-cross');
    // All other cells in row 0 should be proposed as crosses
    expect(hint?.resultCells.every((c) => c.row === 0 && c.col !== 0 && c.col !== 3)).toBe(true);
  });

  it('forces neighbors of a star to crosses', () => {
    const def = createEmptyPuzzleDef();
    const state = createEmptyPuzzleState(def);
    state.cells[4][4] = 'star';

    const hint = findTrivialMarksHint(state);
    expect(hint).not.toBeNull();
    expect(hint?.kind).toBe('place-cross');
    // At least one neighbor should be included.
    expect(hint?.resultCells.length ?? 0).toBeGreaterThan(0);
  });
});


