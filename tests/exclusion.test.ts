import { describe, expect, it } from 'vitest';
import { createEmptyPuzzleDef, createEmptyPuzzleState } from '../src/types/puzzle';
import { findExclusionHint } from '../src/logic/techniques/exclusion';

describe('exclusion technique (basic counting)', () => {
  it('marks a cell as cross if a star there would exceed a row quota', () => {
    const def = createEmptyPuzzleDef();
    const state = createEmptyPuzzleState(def);

    // Row 0 already has two stars; all remaining empties in that row are impossible stars.
    state.cells[0][0] = 'star';
    state.cells[0][3] = 'star';

    const hint = findExclusionHint(state);
    expect(hint).not.toBeNull();
    expect(hint?.kind).toBe('place-cross');
    // The suggested cross must be on row 0, since any star there would give 3 in the row.
    expect(hint?.resultCells[0].row).toBe(0);
  });

  it('marks a cell as cross if a star there would leave too few slots in a column', () => {
    const def = createEmptyPuzzleDef();
    const state = createEmptyPuzzleState(def);

    // Column 0: this cell is the only empty; placing a star here would still
    // require a second star in the column, but there would be no empty cells left.
    for (let r = 1; r < def.size; r += 1) {
      state.cells[r][0] = 'cross';
    }
    // Row 0, col 0 remains empty.

    const hint = findExclusionHint(state);
    expect(hint).not.toBeNull();
    expect(hint?.kind).toBe('place-cross');
    expect(hint?.resultCells[0]).toEqual({ row: 0, col: 0 });
  });
});


