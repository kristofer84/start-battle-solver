import { describe, expect, it } from 'vitest';
import { createEmptyPuzzleState } from '../src/types/puzzle';
import { findSharedRowColumnHint } from '../src/logic/techniques/sharedRowColumn';

describe('Shared Row/Column', () => {
  it('detects forced crosses when two regions must place stars in the same row', () => {
    // Create a puzzle where:
    // - Region 1 needs 1 star, all possible placements are in row 0
    // - Region 2 needs 1 star, all possible placements are in row 0
    // - Row 0 will have at least 2 stars, so other cells in row 0 must be crosses

    const regions = [
      [1, 1, 1, 2, 2, 2, 3, 3, 3, 3],
      [1, 1, 1, 2, 2, 2, 3, 3, 3, 3],
      [4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
      [5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
      [6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
      [7, 7, 7, 7, 7, 7, 7, 7, 7, 7],
      [8, 8, 8, 8, 8, 8, 8, 8, 8, 8],
      [9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
      [10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
      [10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
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

    // Region 1 (cells in row 0, cols 0-2): mark only row 0 cells as empty
    // Region 1 needs 2 stars, has 0, so needs 2 stars
    // But we'll only leave one empty cell in region 1, row 0
    state.cells[0][0] = 'empty'; // Region 1, row 0
    state.cells[0][1] = 'empty'; // Region 1, row 0
    state.cells[1][0] = 'empty'; // Region 1, row 1 (but we want to constrain to row 0)
    // Actually, let me make it so region 1 only has empty cells in row 0
    state.cells[1][0] = 'cross'; // Remove this
    state.cells[1][1] = 'cross';
    state.cells[1][2] = 'cross';

    // Region 2 (cells in row 0, cols 3-5): mark only row 0 cells as empty
    state.cells[0][3] = 'empty'; // Region 2, row 0
    state.cells[0][4] = 'empty'; // Region 2, row 0
    state.cells[1][3] = 'cross'; // Region 2, row 1 - mark as cross
    state.cells[1][4] = 'cross';
    state.cells[1][5] = 'cross';

    // Region 3 (cells in row 0, cols 6-9): these should be forced crosses
    state.cells[0][6] = 'empty'; // Region 3, row 0 - should be forced cross
    state.cells[0][7] = 'empty'; // Region 3, row 0 - should be forced cross
    state.cells[0][8] = 'empty'; // Region 3, row 0 - should be forced cross
    state.cells[0][9] = 'empty'; // Region 3, row 0 - should be forced cross

    const hint = findSharedRowColumnHint(state);

    expect(hint).not.toBeNull();
    expect(hint?.kind).toBe('place-cross');
    expect(hint?.technique).toBe('shared-row-column');

    // Check that the forced crosses are in row 0, regions 3
    const resultCells = hint?.resultCells || [];
    expect(resultCells.length).toBeGreaterThan(0);
    
    // All result cells should be in row 0
    resultCells.forEach(cell => {
      expect(cell.row).toBe(0);
    });

    // Check that region 3 cells in row 0 are included
    const hasRegion3Cells = resultCells.some(c => 
      c.row === 0 && c.col >= 6 && c.col <= 9
    );
    expect(hasRegion3Cells).toBe(true);
  });

  it('detects forced crosses when two regions must place stars in the same column', () => {
    // Create a puzzle where:
    // - Region 1 needs 1 star, all possible placements are in column 0
    // - Region 2 needs 1 star, all possible placements are in column 0
    // - Column 0 will have at least 2 stars, so other cells in column 0 must be crosses

    const regions = [
      [1, 2, 3, 3, 3, 3, 3, 3, 3, 3],
      [1, 2, 3, 3, 3, 3, 3, 3, 3, 3],
      [1, 2, 4, 4, 4, 4, 4, 4, 4, 4],
      [1, 2, 4, 4, 4, 4, 4, 4, 4, 4],
      [5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
      [6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
      [7, 7, 7, 7, 7, 7, 7, 7, 7, 7],
      [8, 8, 8, 8, 8, 8, 8, 8, 8, 8],
      [9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
      [10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
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

    // Region 1 (cells in col 0, rows 0-3): mark only col 0 cells as empty
    state.cells[0][0] = 'empty'; // Region 1, col 0
    state.cells[1][0] = 'empty'; // Region 1, col 0
    state.cells[2][0] = 'empty'; // Region 1, col 0
    state.cells[3][0] = 'empty'; // Region 1, col 0
    // Mark other region 1 cells as cross
    state.cells[0][1] = 'cross';
    state.cells[1][1] = 'cross';

    // Region 2 (cells in col 0, rows 0-3): mark only col 0 cells as empty
    state.cells[0][1] = 'empty'; // Region 2, col 1 - wait, region 2 is in col 1
    // Actually, let me fix the regions - region 2 should also be in col 0
    // Looking at the regions: row 0 col 1 is region 2, row 1 col 1 is region 2
    // So region 2 is in col 1, not col 0. Let me adjust.

    // Actually, let me create a simpler scenario:
    // Region 1 spans rows 0-3, col 0
    // Region 2 spans rows 0-3, col 0 (but that's the same region)
    // Let me use a different layout where two different regions both have cells only in col 0

    // Recreate with better regions:
    const betterRegions = [
      [1, 1, 2, 2, 3, 3, 3, 3, 3, 3],
      [1, 1, 2, 2, 3, 3, 3, 3, 3, 3],
      [1, 1, 2, 2, 4, 4, 4, 4, 4, 4],
      [1, 1, 2, 2, 4, 4, 4, 4, 4, 4],
      [5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
      [6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
      [7, 7, 7, 7, 7, 7, 7, 7, 7, 7],
      [8, 8, 8, 8, 8, 8, 8, 8, 8, 8],
      [9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
      [10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
    ];

    const state2 = createEmptyPuzzleState({
      size: 10,
      starsPerUnit: 2,
      regions: betterRegions,
    });

    // Mark all cells as cross first
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        state2.cells[r][c] = 'cross';
      }
    }

    // Region 1 (rows 0-3, cols 0-1): only leave empty cells in col 0
    state2.cells[0][0] = 'empty'; // Region 1, col 0
    state2.cells[1][0] = 'empty'; // Region 1, col 0
    state2.cells[2][0] = 'empty'; // Region 1, col 0
    state2.cells[3][0] = 'empty'; // Region 1, col 0
    // Mark col 1 cells as cross (they're also region 1, but we want to constrain to col 0)
    state2.cells[0][1] = 'cross';
    state2.cells[1][1] = 'cross';
    state2.cells[2][1] = 'cross';
    state2.cells[3][1] = 'cross';

    // Region 2 (rows 0-3, cols 2-3): only leave empty cells in col 2
    // Wait, region 2 is cols 2-3, not col 0. Let me adjust the regions again.

    // Actually, the simplest: make region 1 and region 2 both have cells only in col 0
    // But they need to be different regions. Let me use a vertical split:
    const verticalRegions = [
      [1, 1, 1, 1, 1, 2, 2, 2, 2, 2],
      [1, 1, 1, 1, 1, 2, 2, 2, 2, 2],
      [1, 1, 1, 1, 1, 2, 2, 2, 2, 2],
      [1, 1, 1, 1, 1, 2, 2, 2, 2, 2],
      [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
      [4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
      [5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
      [6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
      [7, 7, 7, 7, 7, 7, 7, 7, 7, 7],
      [8, 8, 8, 8, 8, 8, 8, 8, 8, 8],
    ];

    const state3 = createEmptyPuzzleState({
      size: 10,
      starsPerUnit: 2,
      regions: verticalRegions,
    });

    // Mark all cells as cross first
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        state3.cells[r][c] = 'cross';
      }
    }

    // Region 1 (rows 0-3, cols 0-4): only leave empty cells in col 0
    state3.cells[0][0] = 'empty'; // Region 1, col 0
    state3.cells[1][0] = 'empty'; // Region 1, col 0
    state3.cells[2][0] = 'empty'; // Region 1, col 0
    state3.cells[3][0] = 'empty'; // Region 1, col 0

    // Region 2 (rows 0-3, cols 5-9): only leave empty cells in col 5
    // But wait, region 2 is cols 5-9, not col 0. They're not in the same column.

    // Let me think differently: I need two regions that both have cells in the same column.
    // Region 1: rows 0-3, cols 0-4 (but only empty cells in col 0)
    // Region 3: rows 4-9, cols 0-4 (but only empty cells in col 0)
    // These are different regions both constrained to col 0!

    // Region 3 (rows 4-9, cols 0-4): only leave empty cells in col 0
    state3.cells[4][0] = 'empty'; // Region 3, col 0
    state3.cells[5][0] = 'empty'; // Region 3, col 0
    state3.cells[6][0] = 'empty'; // Region 3, col 0
    state3.cells[7][0] = 'empty'; // Region 3, col 0

    // Region 1 and Region 3 both need stars and are constrained to col 0
    // So col 0 will have at least 2 stars
    // Other cells in col 0 from other regions should be forced crosses
    // But wait, region 1 and region 3 are the only regions in col 0 in this layout.

    // Let me add another region that also has cells in col 0:
    const finalRegions = [
      [1, 1, 1, 1, 1, 2, 2, 2, 2, 2],
      [1, 1, 1, 1, 1, 2, 2, 2, 2, 2],
      [1, 1, 1, 1, 1, 2, 2, 2, 2, 2],
      [1, 1, 1, 1, 1, 2, 2, 2, 2, 2],
      [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
      [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
      [4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
      [4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
      [5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
      [5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
    ];

    const state4 = createEmptyPuzzleState({
      size: 10,
      starsPerUnit: 2,
      regions: finalRegions,
    });

    // Mark all cells as cross first
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        state4.cells[r][c] = 'cross';
      }
    }

    // Region 1 (rows 0-3, cols 0-4): only leave empty cells in col 0
    state4.cells[0][0] = 'empty';
    state4.cells[1][0] = 'empty';
    state4.cells[2][0] = 'empty';
    state4.cells[3][0] = 'empty';

    // Region 3 (rows 4-5, cols 0-4): only leave empty cells in col 0
    state4.cells[4][0] = 'empty';
    state4.cells[5][0] = 'empty';

    // Region 4 (rows 6-7, cols 0-4): has cells in col 0 that should be forced crosses
    state4.cells[6][0] = 'empty'; // Should be forced cross
    state4.cells[7][0] = 'empty'; // Should be forced cross

    const hint = findSharedRowColumnHint(state4);

    expect(hint).not.toBeNull();
    expect(hint?.kind).toBe('place-cross');
    expect(hint?.technique).toBe('shared-row-column');

    // Check that the forced crosses are in col 0
    const resultCells = hint?.resultCells || [];
    expect(resultCells.length).toBeGreaterThan(0);
    
    // All result cells should be in col 0
    resultCells.forEach(cell => {
      expect(cell.col).toBe(0);
    });

    // Check that region 4 cells in col 0 are included
    const hasRegion4Cells = resultCells.some(c => 
      c.col === 0 && (c.row === 6 || c.row === 7)
    );
    expect(hasRegion4Cells).toBe(true);
  });

  it('returns null when no two regions share the same row/column constraint', () => {
    const regions = [
      [1, 1, 1, 2, 2, 2, 3, 3, 3, 3],
      [1, 1, 1, 2, 2, 2, 3, 3, 3, 3],
      [4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
      [5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
      [6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
      [7, 7, 7, 7, 7, 7, 7, 7, 7, 7],
      [8, 8, 8, 8, 8, 8, 8, 8, 8, 8],
      [9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
      [10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
      [10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
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

    // Region 1: empty cells in different rows
    state.cells[0][0] = 'empty';
    state.cells[1][0] = 'empty';

    // Region 2: empty cells in different rows
    state.cells[0][3] = 'empty';
    state.cells[1][3] = 'empty';

    // They're not constrained to the same row, so no hint
    const hint = findSharedRowColumnHint(state);
    expect(hint).toBeNull();
  });

  it('handles regions with stars already placed', () => {
    // Test that the technique correctly calculates remaining stars needed
    const regions = [
      [1, 1, 1, 2, 2, 2, 3, 3, 3, 3],
      [1, 1, 1, 2, 2, 2, 3, 3, 3, 3],
      [4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
      [5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
      [6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
      [7, 7, 7, 7, 7, 7, 7, 7, 7, 7],
      [8, 8, 8, 8, 8, 8, 8, 8, 8, 8],
      [9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
      [10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
      [10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
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

    // Region 1: has 1 star already, needs 1 more, all in row 0
    state.cells[0][0] = 'star'; // Already has 1 star
    state.cells[0][1] = 'empty'; // Needs 1 more, in row 0
    state.cells[0][2] = 'empty'; // Needs 1 more, in row 0

    // Region 2: has 0 stars, needs 2, all in row 0
    state.cells[0][3] = 'empty'; // Region 2, row 0
    state.cells[0][4] = 'empty'; // Region 2, row 0
    state.cells[0][5] = 'empty'; // Region 2, row 0

    // Region 3: cells in row 0 that should be forced crosses
    state.cells[0][6] = 'empty'; // Should be forced cross
    state.cells[0][7] = 'empty'; // Should be forced cross
    state.cells[0][8] = 'empty'; // Should be forced cross
    state.cells[0][9] = 'empty'; // Should be forced cross

    const hint = findSharedRowColumnHint(state);

    expect(hint).not.toBeNull();
    expect(hint?.kind).toBe('place-cross');
    expect(hint?.technique).toBe('shared-row-column');
  });
});
