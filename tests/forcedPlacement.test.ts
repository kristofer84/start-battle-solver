import { describe, expect, it } from 'vitest';
import { createEmptyPuzzleState } from '../src/types/puzzle';
import { findForcedPlacementHint } from '../src/logic/techniques/forcedPlacement';

describe('Forced Placement', () => {
  it('detects forced star in region B when all placements include the cell (user scenario)', () => {
    // User's scenario: Region B (region 2) needs stars, and all possible placements
    // include a specific cell, so that cell must be a star.
    // The user mentioned that the most logical next step would be to place a star
    // in a cell that appears in all possible placements for region B.
    
    const regions = [
      [0, 0, 0, 1, 1, 1, 2, 2, 3, 3],
      [0, 0, 0, 1, 1, 1, 2, 2, 3, 3],
      [4, 4, 0, 0, 1, 2, 2, 2, 2, 3],
      [4, 0, 0, 0, 1, 2, 2, 2, 2, 3],
      [4, 0, 5, 0, 1, 7, 7, 3, 3, 3],
      [4, 0, 5, 1, 1, 7, 3, 3, 9, 3],
      [4, 5, 5, 5, 1, 7, 3, 8, 9, 3],
      [4, 4, 5, 5, 5, 5, 5, 8, 9, 9],
      [4, 4, 6, 6, 6, 5, 5, 8, 9, 9],
      [6, 6, 6, 5, 5, 5, 5, 8, 9, 9],
    ];

    const state = createEmptyPuzzleState({
      size: 10,
      starsPerUnit: 2,
      regions,
    });

    // Mark all cells as cross first
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        state.cells[r][c] = 'cross';
      }
    }

    // Region 2 (B) cells: {0,6}, {0,7}, {1,6}, {1,7}, {2,5}, {2,6}, {2,7}, {2,8}, {3,5}, {3,6}, {3,7}, {3,8}
    // Region 2 needs 2 stars, has 0 stars
    // Create constraints so that all valid placements include {0,6}
    
    // Place one existing star in region 2
    state.cells[2][5] = 'star';

    // Only one remaining empty cell is valid
    state.cells[0][6] = 'empty'; // {0,6} - should be forced

    // Exclude all other region 2 cells
    state.cells[0][7] = 'cross';
    state.cells[1][6] = 'cross';
    state.cells[1][7] = 'cross';
    state.cells[2][7] = 'cross';
    
    // Make {2,5} and {2,7} adjacent to each other (diagonal, so can't both be stars)
    // They're already adjacent
    
    // Now valid placements for 2 stars in region 2:
    // - {0,6} + {2,5} (not adjacent, valid)
    // - {0,6} + {2,7} (not adjacent, valid)
    // All valid placements include {0,6}, so it must be a star
    
    const hint = findForcedPlacementHint(state);
    
    expect(hint).not.toBeNull();
    expect(hint?.kind).toBe('place-star');
    expect(hint?.technique).toBe('forced-placement');
    expect(hint?.highlights?.regions).toContain(2);
    
    // Check that {0,6} is in the result
    const has06 = hint?.resultCells.some(c => c.row === 0 && c.col === 6);
    expect(has06).toBe(true);
  });

  it('detects forced star when all valid placements include a specific cell', () => {
    // Scenario: Region B (region 2) needs stars, and all possible valid placements
    // for those stars include a specific cell, so that cell must be a star.
    
    // Create a simple 10x10 puzzle with region 2 needing 1 star
    const regions = [
      [0, 0, 0, 1, 1, 1, 2, 2, 3, 3],
      [0, 0, 0, 1, 1, 1, 2, 2, 3, 3],
      [4, 4, 0, 0, 1, 2, 2, 2, 2, 3],
      [4, 0, 0, 0, 1, 2, 2, 2, 2, 3],
      [4, 0, 5, 0, 1, 7, 7, 3, 3, 3],
      [4, 0, 5, 1, 1, 7, 3, 3, 9, 3],
      [4, 5, 5, 5, 1, 7, 3, 8, 9, 3],
      [4, 4, 5, 5, 5, 5, 5, 8, 9, 9],
      [4, 4, 6, 6, 6, 5, 5, 8, 9, 9],
      [6, 6, 6, 5, 5, 5, 5, 8, 9, 9],
    ];

    const state = createEmptyPuzzleState({
      size: 10,
      starsPerUnit: 2,
      regions,
    });

    // Mark all cells as cross first
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        state.cells[r][c] = 'cross';
      }
    }

    // Region 2 (B) cells: {0,6}, {0,7}, {1,6}, {1,7}, {2,5}, {2,6}, {2,7}, {2,8}, {3,5}, {3,6}, {3,7}, {3,8}
    // Mark most region 2 cells as cross, leaving only a few as empty
    // We'll create a scenario where all valid placements for 1 star include {0,6}
    
    // Mark region 2 cells as empty
    state.cells[0][6] = 'empty'; // {0,6} - should be forced

    // Place an existing star to satisfy one of the quotas
    state.cells[2][5] = 'star';

    // Exclude other region cells directly
    state.cells[0][7] = 'cross';
    state.cells[1][6] = 'cross';
    state.cells[1][7] = 'cross';
    
    // Now region 2 needs 1 more star and {0,6} is the only available cell
    
    const hint = findForcedPlacementHint(state);
    
    expect(hint).not.toBeNull();
    expect(hint?.kind).toBe('place-star');
    expect(hint?.technique).toBe('forced-placement');
    
    // Check that {0,6} is in the result
    const has06 = hint?.resultCells.some(c => c.row === 0 && c.col === 6);
    expect(has06).toBe(true);
  });

  it('detects forced star in region when all placement sets include the cell', () => {
    // Create a scenario where region 2 needs 2 stars and all valid placement sets
    // include a specific cell
    
    const regions = [
      [0, 0, 0, 1, 1, 1, 2, 2, 3, 3],
      [0, 0, 0, 1, 1, 1, 2, 2, 3, 3],
      [4, 4, 0, 0, 1, 2, 2, 2, 2, 3],
      [4, 0, 0, 0, 1, 2, 2, 2, 2, 3],
      [4, 0, 5, 0, 1, 7, 7, 3, 3, 3],
      [4, 0, 5, 1, 1, 7, 3, 3, 9, 3],
      [4, 5, 5, 5, 1, 7, 3, 8, 9, 3],
      [4, 4, 5, 5, 5, 5, 5, 8, 9, 9],
      [4, 4, 6, 6, 6, 5, 5, 8, 9, 9],
      [6, 6, 6, 5, 5, 5, 5, 8, 9, 9],
    ];

    const state = createEmptyPuzzleState({
      size: 10,
      starsPerUnit: 2,
      regions,
    });

    // Mark all cells as cross first
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        state.cells[r][c] = 'cross';
      }
    }

    // Region 2 needs 2 stars, has 0 stars
    // Mark region 2 cells as empty: {0,6}, {0,7}, {1,6}, {1,7}, {2,5}, {2,6}, {2,7}, {2,8}
    // Constrain so that all valid 2-star placements include {0,6}
    
    state.cells[0][6] = 'empty'; // {0,6} - should be forced
    state.cells[2][5] = 'empty'; // {2,5}

    // Exclude other region cells directly
    state.cells[0][7] = 'cross';
    state.cells[1][6] = 'cross';
    state.cells[1][7] = 'cross';
    state.cells[2][7] = 'cross';
    
    // Now valid placements for 2 stars in region 2:
    // - {0,6} + {2,5} (not adjacent, valid)
    // - {0,6} + {2,7} (not adjacent, valid)
    // All valid placements include {0,6}, so it must be a star
    
    const hint = findForcedPlacementHint(state);
    
    expect(hint).not.toBeNull();
    expect(hint?.kind).toBe('place-star');
    expect(hint?.technique).toBe('forced-placement');
    
    const has06 = hint?.resultCells.some(c => c.row === 0 && c.col === 6);
    expect(has06).toBe(true);
  });

  it('returns null when no cell appears in all placement sets', () => {
    const regions = [
      [0, 0, 0, 1, 1, 1, 2, 2, 3, 3],
      [0, 0, 0, 1, 1, 1, 2, 2, 3, 3],
      [4, 4, 0, 0, 1, 2, 2, 2, 2, 3],
      [4, 0, 0, 0, 1, 2, 2, 2, 2, 3],
      [4, 0, 5, 0, 1, 7, 7, 3, 3, 3],
      [4, 0, 5, 1, 1, 7, 3, 3, 9, 3],
      [4, 5, 5, 5, 1, 7, 3, 8, 9, 3],
      [4, 4, 5, 5, 5, 5, 5, 8, 9, 9],
      [4, 4, 6, 6, 6, 5, 5, 8, 9, 9],
      [6, 6, 6, 5, 5, 5, 5, 8, 9, 9],
    ];

    const state = createEmptyPuzzleState({
      size: 10,
      starsPerUnit: 2,
      regions,
    });

    // Mark all cells as cross first
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        state.cells[r][c] = 'cross';
      }
    }

    // Region 2 needs 2 stars, has multiple valid placement options
    // where no single cell appears in all of them
    state.cells[0][6] = 'empty';
    state.cells[0][7] = 'empty';
    state.cells[1][6] = 'empty';
    state.cells[1][7] = 'empty';
    
    // Valid placements could be: {0,6}+{1,7} or {0,7}+{1,6}
    // No cell appears in all placements
    
    const hint = findForcedPlacementHint(state);
    
    expect(hint).toBeNull();
  });

  it('returns null when region has no empty cells', () => {
    const regions = [
      [0, 0, 0, 1, 1, 1, 2, 2, 3, 3],
      [0, 0, 0, 1, 1, 1, 2, 2, 3, 3],
      [4, 4, 0, 0, 1, 2, 2, 2, 2, 3],
      [4, 0, 0, 0, 1, 2, 2, 2, 2, 3],
      [4, 0, 5, 0, 1, 7, 7, 3, 3, 3],
      [4, 0, 5, 1, 1, 7, 3, 3, 9, 3],
      [4, 5, 5, 5, 1, 7, 3, 8, 9, 3],
      [4, 4, 5, 5, 5, 5, 5, 8, 9, 9],
      [4, 4, 6, 6, 6, 5, 5, 8, 9, 9],
      [6, 6, 6, 5, 5, 5, 5, 8, 9, 9],
    ];

    const state = createEmptyPuzzleState({
      size: 10,
      starsPerUnit: 2,
      regions,
    });

    // Mark all cells as cross
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        state.cells[r][c] = 'cross';
      }
    }

    const hint = findForcedPlacementHint(state);
    
    expect(hint).toBeNull();
  });

  it('returns null when region already has enough stars', () => {
    const regions = [
      [0, 0, 0, 1, 1, 1, 2, 2, 3, 3],
      [0, 0, 0, 1, 1, 1, 2, 2, 3, 3],
      [4, 4, 0, 0, 1, 2, 2, 2, 2, 3],
      [4, 0, 0, 0, 1, 2, 2, 2, 2, 3],
      [4, 0, 5, 0, 1, 7, 7, 3, 3, 3],
      [4, 0, 5, 1, 1, 7, 3, 3, 9, 3],
      [4, 5, 5, 5, 1, 7, 3, 8, 9, 3],
      [4, 4, 5, 5, 5, 5, 5, 8, 9, 9],
      [4, 4, 6, 6, 6, 5, 5, 8, 9, 9],
      [6, 6, 6, 5, 5, 5, 5, 8, 9, 9],
    ];

    const state = createEmptyPuzzleState({
      size: 10,
      starsPerUnit: 2,
      regions,
    });

    // Mark all cells as cross first
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        state.cells[r][c] = 'cross';
      }
    }

    // Region 2 already has 2 stars
    state.cells[0][6] = 'star';
    state.cells[1][7] = 'star';

    const hint = findForcedPlacementHint(state);
    
    expect(hint).toBeNull();
  });
});
