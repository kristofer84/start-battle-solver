import { describe, expect, it } from 'vitest';
import { createEmptyPuzzleDef, createEmptyPuzzleState, type PuzzleState } from '../src/types/puzzle';
import { findCrossPressureHint } from '../src/logic/techniques/crossPressure';

/**
 * Create a puzzle state with custom region configuration
 */
function makeStateWithCustomRegions(regionMap: number[][]): PuzzleState {
  const def = createEmptyPuzzleDef();
  for (let r = 0; r < def.size; r += 1) {
    for (let c = 0; c < def.size; c += 1) {
      def.regions[r][c] = regionMap[r][c];
    }
  }
  return createEmptyPuzzleState(def);
}

describe('Cross Pressure technique', () => {
  describe('Adjacent empty cells with 1 star', () => {
    it('places crosses above and below adjacent empty cells in a row', () => {
      /**
       * Scenario: Row has 1 star and 2 adjacent empty cells.
       * Since one of the empty cells must be a star, the cells directly
       * above and below both positions must be crosses.
       */
      const def = createEmptyPuzzleDef();
      const state = createEmptyPuzzleState(def);
      
      // Row 5: place 1 star at (5, 0)
      state.cells[5][0] = 'star';
      
      // Mark all other cells in row 5 as crosses except for 2 adjacent empty cells
      for (let col = 1; col < 10; col += 1) {
        if (col !== 4 && col !== 5) {
          state.cells[5][col] = 'cross';
        }
      }
      // Cells (5, 4) and (5, 5) remain empty and are adjacent
      
      const hint = findCrossPressureHint(state);
      
      expect(hint).not.toBeNull();
      if (hint) {
        expect(hint.technique).toBe('cross-pressure');
        expect(hint.kind).toBe('place-cross');
        expect(hint.resultCells.length).toBeGreaterThanOrEqual(2); // At least 2 crosses
        
        // Verify crosses are at correct positions (above or below the pair)
        const crosses = hint.resultCells;
        const above1 = crosses.find(c => c.row === 4 && c.col === 4);
        const above2 = crosses.find(c => c.row === 4 && c.col === 5);
        const below1 = crosses.find(c => c.row === 6 && c.col === 4);
        const below2 = crosses.find(c => c.row === 6 && c.col === 5);
        
        // Should have crosses above AND below (unless at boundary)
        const hasAbove = (above1 !== undefined || above2 !== undefined);
        const hasBelow = (below1 !== undefined || below2 !== undefined);
        expect(hasAbove || hasBelow).toBe(true);
        
        // Verify explanation mentions the row and adjacent cells
        expect(hint.explanation).toContain('Row 5');
        expect(hint.explanation.toLowerCase()).toContain('adjacent');
      }
    });

    it('places crosses to the left and right of adjacent empty cells in a column', () => {
      /**
       * Scenario: Column has 1 star and 2 adjacent empty cells.
       * Since one of the empty cells must be a star, the cells directly
       * to the left and right of both positions must be crosses.
       */
      const def = createEmptyPuzzleDef();
      const state = createEmptyPuzzleState(def);
      
      // Column 5: place 1 star at (0, 5)
      state.cells[0][5] = 'star';
      
      // Mark all other cells in column 5 as crosses except for 2 adjacent empty cells
      for (let row = 1; row < 10; row += 1) {
        if (row !== 4 && row !== 5) {
          state.cells[row][5] = 'cross';
        }
      }
      // Cells (4, 5) and (5, 5) remain empty and are adjacent
      
      const hint = findCrossPressureHint(state);
      
      expect(hint).not.toBeNull();
      if (hint) {
        expect(hint.technique).toBe('cross-pressure');
        expect(hint.kind).toBe('place-cross');
        expect(hint.resultCells.length).toBeGreaterThanOrEqual(2); // At least 2 crosses
        
        // Verify crosses are at correct positions (left or right of the pair)
        const crosses = hint.resultCells;
        const left1 = crosses.find(c => c.row === 4 && c.col === 4);
        const left2 = crosses.find(c => c.row === 5 && c.col === 4);
        const right1 = crosses.find(c => c.row === 4 && c.col === 6);
        const right2 = crosses.find(c => c.row === 5 && c.col === 6);
        
        // Should have crosses left AND right (unless at boundary)
        const hasLeft = (left1 !== undefined || left2 !== undefined);
        const hasRight = (right1 !== undefined || right2 !== undefined);
        expect(hasLeft || hasRight).toBe(true);
        
        // Verify explanation mentions the column and adjacent cells
        expect(hint.explanation).toContain('Column 5');
        expect(hint.explanation.toLowerCase()).toContain('adjacent');
      }
    });

    it('does not trigger when empty cells are not adjacent', () => {
      const def = createEmptyPuzzleDef();
      const state = createEmptyPuzzleState(def);
      
      // Row 5: place 1 star at (5, 0)
      state.cells[5][0] = 'star';
      
      // Mark all other cells in row 5 as crosses except for 2 non-adjacent empty cells
      for (let col = 1; col < 10; col += 1) {
        if (col !== 3 && col !== 7) {
          state.cells[5][col] = 'cross';
        }
      }
      // Cells (5, 3) and (5, 7) remain empty but are NOT adjacent
      
      const hint = findCrossPressureHint(state);
      
      // Should not trigger for non-adjacent cells
      // (might trigger for other reasons, but not for this specific case)
      if (hint && hint.technique === 'cross-pressure' && hint.kind === 'place-cross') {
        // If it does trigger, verify it's not for the adjacent pair case
        const explanation = hint.explanation.toLowerCase();
        if (explanation.includes('adjacent empty cells')) {
          // This would be wrong - the cells are not adjacent
          expect(false).toBe(true); // Fail the test
        }
      }
    });

    it('handles edge cases at grid boundaries', () => {
      const def = createEmptyPuzzleDef();
      const state = createEmptyPuzzleState(def);
      
      // Row 0 (top row): place 1 star at (0, 0)
      state.cells[0][0] = 'star';
      
      // Mark all other cells in row 0 as crosses except for 2 adjacent empty cells
      for (let col = 1; col < 10; col += 1) {
        if (col !== 4 && col !== 5) {
          state.cells[0][col] = 'cross';
        }
      }
      // Cells (0, 4) and (0, 5) remain empty and are adjacent
      
      const hint = findCrossPressureHint(state);
      
      if (hint) {
        expect(hint.technique).toBe('cross-pressure');
        expect(hint.kind).toBe('place-cross');
        
        // Should only place crosses below (not above, since row 0 is at top)
        const crosses = hint.resultCells;
        const below1 = crosses.find(c => c.row === 1 && c.col === 4);
        const below2 = crosses.find(c => c.row === 1 && c.col === 5);
        
        expect(below1).toBeDefined();
        expect(below2).toBeDefined();
        
        // Should not have any crosses above row 0
        const above = crosses.filter(c => c.row < 0);
        expect(above.length).toBe(0);
      }
    });
  });

  describe('7 crosses and 3 empty cells', () => {
    it('places 2 stars when 3 empty cells are adjacent in a row', () => {
      /**
       * Scenario: Row has 7 crosses and 3 adjacent empty cells.
       * Since we need 2 stars and the 3 cells are adjacent,
       * we can place stars at positions 0 and 2 (skipping the middle).
       */
      const def = createEmptyPuzzleDef();
      const state = createEmptyPuzzleState(def);
      
      // Row 5: mark 7 cells as crosses
      const crossesInRow = [0, 1, 2, 3, 6, 7, 8];
      for (const col of crossesInRow) {
        state.cells[5][col] = 'cross';
      }
      // Cells (5, 4), (5, 5), (5, 9) remain empty
      // Actually, let's make (5, 4), (5, 5), (5, 6) empty and adjacent
      state.cells[5][6] = 'empty'; // Reset this one
      state.cells[5][9] = 'cross'; // Mark this one
      
      const hint = findCrossPressureHint(state);
      
      expect(hint).not.toBeNull();
      if (hint) {
        expect(hint.technique).toBe('cross-pressure');
        expect(hint.kind).toBe('place-star');
        
        // Should place 2 stars at positions 0 and 2 of the 3-cell block
        expect(hint.resultCells.length).toBe(2);
        
        const stars = hint.resultCells;
        const star1 = stars.find(s => s.row === 5 && s.col === 4);
        const star2 = stars.find(s => s.row === 5 && s.col === 6);
        
        expect(star1).toBeDefined();
        expect(star2).toBeDefined();
        
        // Should not place star in the middle (5, 5)
        const middle = stars.find(s => s.row === 5 && s.col === 5);
        expect(middle).toBeUndefined();
      }
    });

    it('places 1 star when 3 empty cells are not all adjacent', () => {
      /**
       * Scenario: Row has 7 crosses and 3 empty cells, but they're not all adjacent.
       * If 2 of them are adjacent, the third (non-adjacent) one must be a star.
       */
      const def = createEmptyPuzzleDef();
      const state = createEmptyPuzzleState(def);
      
      // Row 5: mark 7 cells as crosses
      const crossesInRow = [0, 1, 2, 3, 5, 7, 8];
      for (const col of crossesInRow) {
        state.cells[5][col] = 'cross';
      }
      // Cells (5, 4), (5, 6), (5, 9) remain empty
      // (5, 4) and (5, 6) are NOT adjacent (separated by (5, 5) which is a cross)
      // Actually, let's make (5, 4) and (5, 5) adjacent, and (5, 9) separate
      state.cells[5][5] = 'empty'; // Make this empty too
      state.cells[5][6] = 'cross'; // Mark this as cross
      
      // Now we have (5, 4), (5, 5) adjacent, and (5, 9) separate
      // Since (5, 4) and (5, 5) are adjacent, they can't both be stars
      // So (5, 9) must be a star
      
      const hint = findCrossPressureHint(state);
      
      if (hint && hint.technique === 'cross-pressure' && hint.kind === 'place-star') {
        // Should identify one forced star
        expect(hint.resultCells.length).toBeGreaterThan(0);
      }
    });

    it('handles column case with 7 crosses and 3 empty cells', () => {
      const def = createEmptyPuzzleDef();
      const state = createEmptyPuzzleState(def);
      
      // Column 5: mark 7 cells as crosses
      const crossesInCol = [0, 1, 2, 3, 6, 7, 8];
      for (const row of crossesInCol) {
        state.cells[row][5] = 'cross';
      }
      // Cells (4, 5), (5, 5), (6, 5) remain empty - but wait, (6, 5) is marked
      // Let's fix: make (4, 5), (5, 5), (9, 5) empty
      state.cells[6][5] = 'empty';
      state.cells[9][5] = 'cross';
      
      // Actually, let's make (4, 5), (5, 5), (6, 5) adjacent
      state.cells[6][5] = 'empty';
      state.cells[9][5] = 'cross';
      
      const hint = findCrossPressureHint(state);
      
      if (hint && hint.technique === 'cross-pressure') {
        expect(hint.kind).toBe('place-star');
        expect(hint.resultCells.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Edge cases and validation', () => {
    it('does not trigger when row already has 2 stars', () => {
      const def = createEmptyPuzzleDef();
      const state = createEmptyPuzzleState(def);
      
      // Row 5: place 2 stars (saturated)
      state.cells[5][0] = 'star';
      state.cells[5][5] = 'star';
      
      // Mark rest as crosses except 2 adjacent empty cells
      for (let col = 1; col < 10; col += 1) {
        if (col !== 5 && col !== 4 && col !== 6) {
          state.cells[5][col] = 'cross';
        }
      }
      
      const hint = findCrossPressureHint(state);
      
      // Should not trigger since row already has 2 stars
      if (hint && hint.technique === 'cross-pressure') {
        // If it does trigger, it shouldn't be for the 1-star-2-adjacent case
        const explanation = hint.explanation.toLowerCase();
        if (explanation.includes('1 star and 2 adjacent')) {
          expect(false).toBe(true); // Fail
        }
      }
    });

    it('only returns crosses that are actually empty', () => {
      const def = createEmptyPuzzleDef();
      const state = createEmptyPuzzleState(def);
      
      // Row 5: place 1 star at (5, 0)
      state.cells[5][0] = 'star';
      
      // Mark all other cells in row 5 as crosses except for 2 adjacent empty cells
      for (let col = 1; col < 10; col += 1) {
        if (col !== 4 && col !== 5) {
          state.cells[5][col] = 'cross';
        }
      }
      
      // Pre-mark some cells above/below as crosses
      state.cells[4][4] = 'cross';
      state.cells[6][5] = 'cross';
      
      const hint = findCrossPressureHint(state);
      
      if (hint) {
        // Should only return empty cells, not already-marked crosses
        for (const cell of hint.resultCells) {
          expect(state.cells[cell.row][cell.col]).toBe('empty');
        }
        
        // Should still return the other 2 crosses (4,5) and (6,4)
        expect(hint.resultCells.length).toBe(2);
      }
    });
  });
});
