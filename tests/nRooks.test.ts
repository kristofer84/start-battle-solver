import { describe, expect, it } from 'vitest';
import { createEmptyPuzzleDef, createEmptyPuzzleState, type PuzzleState } from '../src/types/puzzle';
import { findNRooksHint } from '../src/logic/techniques/nRooks';

/**
 * Helper to set cell states in a puzzle
 */
function setCells(state: PuzzleState, stars: [number, number][], crosses: [number, number][]) {
  for (const [r, c] of stars) {
    state.cells[r][c] = 'star';
  }
  for (const [r, c] of crosses) {
    state.cells[r][c] = 'cross';
  }
}

/**
 * Helper to set up a custom region configuration
 */
function setRegions(state: PuzzleState, regionMap: number[][]) {
  for (let r = 0; r < 10; r += 1) {
    for (let c = 0; c < 10; c += 1) {
      state.def.regions[r][c] = regionMap[r][c];
    }
  }
}

describe('N-Rooks technique', () => {
  /**
   * Test specific example of N-rooks (2-rooks pattern)
   * Validates Requirements 20.1 and 20.3:
   * - WHEN N cells in N different rows and columns must all contain stars THEN the System SHALL identify forced star placements using N-rooks logic
   * - WHEN the System provides an N-rooks hint THEN the System SHALL highlight the N cells forming the rook pattern
   */
  it('detects 2-rooks pattern with forced cells', () => {
    /**
     * Scenario: 2-rooks pattern
     * 
     * Setup:
     * - Row 3 has 1 star already at (3,0), needs 1 more, and only (3,5) is empty
     * - Column 7 has 1 star already at (0,7), needs 1 more, and only (6,7) is empty
     * 
     * These two cells (3,5) and (6,7) are in different rows and different columns,
     * forming a rook pattern. Both must be stars.
     */
    const state = createEmptyPuzzleState(createEmptyPuzzleDef());
    
    // Row 3: place 1 star at (3,0), mark all other cells as crosses except (3,5)
    setCells(state, [[3, 0]], [
      [3, 1], [3, 2], [3, 3], [3, 4], [3, 6], [3, 7], [3, 8], [3, 9]
    ]);
    
    // Column 7: place 1 star at (0,7), mark all other cells as crosses except (6,7)
    setCells(state, [[0, 7]], [
      [1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [7, 7], [8, 7], [9, 7]
    ]);
    
    const hint = findNRooksHint(state);
    
    expect(hint).not.toBeNull();
    
    if (hint) {
      // Verify technique identification
      expect(hint.technique).toBe('n-rooks');
      expect(hint.kind).toBe('place-star');
      
      // Verify we have exactly 2 result cells
      expect(hint.resultCells).toBeDefined();
      expect(hint.resultCells.length).toBe(2);
      
      // Verify the cells are (3,5) and (6,7)
      const cellStrings = hint.resultCells.map(c => `${c.row},${c.col}`);
      expect(cellStrings).toContain('3,5');
      expect(cellStrings).toContain('6,7');
      
      // Verify they are in different rows
      const rows = hint.resultCells.map(c => c.row);
      expect(new Set(rows).size).toBe(2);
      
      // Verify they are in different columns
      const cols = hint.resultCells.map(c => c.col);
      expect(new Set(cols).size).toBe(2);
      
      // Verify hint highlights the cells - Requirement 20.3
      expect(hint.highlights?.cells).toBeDefined();
      expect(hint.highlights?.cells?.length).toBe(2);
      
      // Verify hint highlights the rows - Requirement 20.3
      expect(hint.highlights?.rows).toBeDefined();
      expect(hint.highlights?.rows).toContain(3);
      expect(hint.highlights?.rows).toContain(6);
      
      // Verify hint highlights the columns - Requirement 20.3
      expect(hint.highlights?.cols).toBeDefined();
      expect(hint.highlights?.cols).toContain(5);
      expect(hint.highlights?.cols).toContain(7);
      
      // Verify explanation mentions N-rooks and the pattern - Requirement 20.1
      expect(hint.explanation.toLowerCase()).toContain('rook');
      expect(hint.explanation).toContain('row');
      expect(hint.explanation).toContain('column');
    }
  });

  it('detects 3-rooks pattern with forced cells', () => {
    /**
     * Scenario: 3-rooks pattern
     * 
     * Setup:
     * - Row 1 has 1 star, needs 1 more, only (1,4) is empty
     * - Row 5 has 1 star, needs 1 more, only (5,2) is empty
     * - Column 8 has 1 star, needs 1 more, only (7,8) is empty
     * 
     * These three cells form a rook pattern (all different rows and columns).
     */
    const state = createEmptyPuzzleState(createEmptyPuzzleDef());
    
    // Row 1: 1 star at (1,0), crosses everywhere except (1,4)
    setCells(state, [[1, 0]], [
      [1, 1], [1, 2], [1, 3], [1, 5], [1, 6], [1, 7], [1, 8], [1, 9]
    ]);
    
    // Row 5: 1 star at (5,0), crosses everywhere except (5,2)
    setCells(state, [[5, 0]], [
      [5, 1], [5, 3], [5, 4], [5, 5], [5, 6], [5, 7], [5, 8], [5, 9]
    ]);
    
    // Column 8: 1 star at (0,8), crosses everywhere except (7,8)
    setCells(state, [[0, 8]], [
      [1, 8], [2, 8], [3, 8], [4, 8], [5, 8], [6, 8], [8, 8], [9, 8]
    ]);
    
    const hint = findNRooksHint(state);
    
    expect(hint).not.toBeNull();
    
    if (hint) {
      expect(hint.technique).toBe('n-rooks');
      expect(hint.kind).toBe('place-star');
      
      // Verify we have exactly 3 result cells
      expect(hint.resultCells.length).toBe(3);
      
      // Verify the cells are (1,4), (5,2), and (7,8)
      const cellStrings = hint.resultCells.map(c => `${c.row},${c.col}`);
      expect(cellStrings).toContain('1,4');
      expect(cellStrings).toContain('5,2');
      expect(cellStrings).toContain('7,8');
      
      // Verify they are in different rows
      const rows = hint.resultCells.map(c => c.row);
      expect(new Set(rows).size).toBe(3);
      
      // Verify they are in different columns
      const cols = hint.resultCells.map(c => c.col);
      expect(new Set(cols).size).toBe(3);
      
      // Verify highlights
      expect(hint.highlights?.cells?.length).toBe(3);
      expect(hint.highlights?.rows?.length).toBe(3);
      expect(hint.highlights?.cols?.length).toBe(3);
    }
  });

  it('detects N-rooks with region-forced cells', () => {
    /**
     * Scenario: N-rooks pattern with region constraints
     * 
     * Setup:
     * - Region 3 has 1 star, needs 1 more, only (2,6) is empty in that region
     * - Row 8 has 1 star, needs 1 more, only (8,3) is empty
     * 
     * These cells form a 2-rooks pattern.
     */
    const state = createEmptyPuzzleState(createEmptyPuzzleDef());
    
    // Set up a custom region where region 3 contains specific cells
    const regions = Array(10).fill(null).map(() => Array(10).fill(1));
    // Make region 3 contain cells around (2,6)
    regions[2][6] = 3;
    regions[2][7] = 3;
    regions[3][6] = 3;
    regions[3][7] = 3;
    setRegions(state, regions);
    
    // Region 3: place 1 star at (2,7), mark other region cells as crosses except (2,6)
    setCells(state, [[2, 7]], [
      [3, 6], [3, 7]
    ]);
    
    // Row 8: place 1 star at (8,0), mark all other cells as crosses except (8,3)
    setCells(state, [[8, 0]], [
      [8, 1], [8, 2], [8, 4], [8, 5], [8, 6], [8, 7], [8, 8], [8, 9]
    ]);
    
    const hint = findNRooksHint(state);
    
    expect(hint).not.toBeNull();
    
    if (hint) {
      expect(hint.technique).toBe('n-rooks');
      expect(hint.kind).toBe('place-star');
      
      // Verify we have 2 result cells
      expect(hint.resultCells.length).toBe(2);
      
      // Verify they form a rook pattern (different rows and columns)
      const rows = hint.resultCells.map(c => c.row);
      const cols = hint.resultCells.map(c => c.col);
      expect(new Set(rows).size).toBe(2);
      expect(new Set(cols).size).toBe(2);
      
      // Verify explanation mentions region
      expect(hint.explanation.toLowerCase()).toContain('region');
    }
  });

  it('returns null when forced cells do not form rook pattern', () => {
    /**
     * Scenario: Forced cells in same row (not a rook pattern)
     * 
     * Setup:
     * - Row 2 has 1 star, needs 1 more, only (2,5) is empty
     * - Column 5 has 1 star, needs 1 more, only (2,5) is empty (same cell!)
     * 
     * This is the same cell, not a rook pattern.
     */
    const state = createEmptyPuzzleState(createEmptyPuzzleDef());
    
    // Row 2: 1 star at (2,0), crosses everywhere except (2,5)
    setCells(state, [[2, 0]], [
      [2, 1], [2, 2], [2, 3], [2, 4], [2, 6], [2, 7], [2, 8], [2, 9]
    ]);
    
    // Column 5: 1 star at (0,5), crosses everywhere except (2,5)
    setCells(state, [[0, 5]], [
      [1, 5], [3, 5], [4, 5], [5, 5], [6, 5], [7, 5], [8, 5], [9, 5]
    ]);
    
    const hint = findNRooksHint(state);
    
    // Should not find N-rooks because it's the same cell
    expect(hint).toBeNull();
  });

  it('returns null when there are not enough forced cells', () => {
    /**
     * Scenario: Only one forced cell
     * 
     * N-rooks requires at least 2 cells.
     */
    const state = createEmptyPuzzleState(createEmptyPuzzleDef());
    
    // Row 4: 1 star at (4,0), crosses everywhere except (4,7)
    setCells(state, [[4, 0]], [
      [4, 1], [4, 2], [4, 3], [4, 4], [4, 5], [4, 6], [4, 8], [4, 9]
    ]);
    
    const hint = findNRooksHint(state);
    
    expect(hint).toBeNull();
  });

  it('returns null when forced cells share a row', () => {
    /**
     * Scenario: Two forced cells in the same row
     * 
     * Setup:
     * - Column 2 has 1 star, needs 1 more, only (5,2) is empty
     * - Column 8 has 1 star, needs 1 more, only (5,8) is empty
     * 
     * Both cells are in row 5, so they don't form a rook pattern.
     */
    const state = createEmptyPuzzleState(createEmptyPuzzleDef());
    
    // Column 2: 1 star at (0,2), crosses everywhere except (5,2)
    setCells(state, [[0, 2]], [
      [1, 2], [2, 2], [3, 2], [4, 2], [6, 2], [7, 2], [8, 2], [9, 2]
    ]);
    
    // Column 8: 1 star at (0,8), crosses everywhere except (5,8)
    setCells(state, [[0, 8]], [
      [1, 8], [2, 8], [3, 8], [4, 8], [6, 8], [7, 8], [8, 8], [9, 8]
    ]);
    
    const hint = findNRooksHint(state);
    
    // Should not find N-rooks because both cells are in the same row
    expect(hint).toBeNull();
  });

  it('returns null when forced cells share a column', () => {
    /**
     * Scenario: Two forced cells in the same column
     * 
     * Setup:
     * - Row 1 has 1 star, needs 1 more, only (1,4) is empty
     * - Row 6 has 1 star, needs 1 more, only (6,4) is empty
     * 
     * Both cells are in column 4, so they don't form a rook pattern.
     */
    const state = createEmptyPuzzleState(createEmptyPuzzleDef());
    
    // Row 1: 1 star at (1,0), crosses everywhere except (1,4)
    setCells(state, [[1, 0]], [
      [1, 1], [1, 2], [1, 3], [1, 5], [1, 6], [1, 7], [1, 8], [1, 9]
    ]);
    
    // Row 6: 1 star at (6,0), crosses everywhere except (6,4)
    setCells(state, [[6, 0]], [
      [6, 1], [6, 2], [6, 3], [6, 5], [6, 6], [6, 7], [6, 8], [6, 9]
    ]);
    
    const hint = findNRooksHint(state);
    
    // Should not find N-rooks because both cells are in the same column
    expect(hint).toBeNull();
  });

  it('returns null when puzzle is complete', () => {
    const state = createEmptyPuzzleState(createEmptyPuzzleDef());
    
    // Fill the entire puzzle with stars and crosses
    for (let r = 0; r < 10; r += 1) {
      for (let c = 0; c < 10; c += 1) {
        if (c === r || c === (r + 5) % 10) {
          state.cells[r][c] = 'star';
        } else {
          state.cells[r][c] = 'cross';
        }
      }
    }
    
    const hint = findNRooksHint(state);
    
    expect(hint).toBeNull();
  });
});
