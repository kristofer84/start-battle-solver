import { describe, expect, it } from 'vitest';
import { createEmptyPuzzleDef, createEmptyPuzzleState } from '../src/types/puzzle';
import { findTwoByTwoHint } from '../src/logic/techniques/twoByTwo';

describe('two-by-two technique', () => {
  it('crosses remaining cells in a 2x2 block containing one star', () => {
    const def = createEmptyPuzzleDef();
    const state = createEmptyPuzzleState(def);
    // place a single star in a 2×2 at (0,0)
    state.cells[0][0] = 'star';

    const hint = findTwoByTwoHint(state);
    expect(hint).not.toBeNull();
    expect(hint?.kind).toBe('place-cross');
    // All proposed crosses should be in the 2×2 block and not the star cell itself.
    expect(
      hint?.resultCells.every(
        (c) => c.row >= 0 && c.row <= 1 && c.col >= 0 && c.col <= 1 && !(c.row === 0 && c.col === 0),
      ),
    ).toBe(true);
  });
});


