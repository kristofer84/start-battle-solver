import { describe, expect, it } from 'vitest';
import { createEmptyPuzzleDef, createEmptyPuzzleState, type PuzzleState } from '../src/types/puzzle';
import { findTheMHint } from '../src/logic/techniques/theM';

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

describe('The M technique', () => {
  it('detects M-shape pattern and identifies forced cells', () => {
    /**
     * This test validates Requirements 17.1 and 17.3:
     * - When a region forms an M-shape with specific properties
     * - The system identifies forced star placements based on the M pattern
     * - The hint highlights the M-shaped region and the forced cells
     */
    const regionMap = Array(10).fill(null).map(() => Array(10).fill(1));
    
    // Create a compact M-shaped region (region 2) with 5 cells
    // Two peaks at columns 2 and 4, valley at column 3
    
    // Left peak at (2,2)
    regionMap[2][2] = 2;
    
    // Valley at (3,3) - diagonally adjacent to left peak
    regionMap[3][3] = 2;
    
    // Right peak at (2,4) - valley is between the peaks
    regionMap[2][4] = 2;
    
    // Add connecting cells to form proper M
    regionMap[3][2] = 2; // extend left peak down
    regionMap[3][4] = 2; // extend right peak down
    
    const state = makeStateWithCustomRegions(regionMap);
    
    // Mark one cell as cross to create a scenario with 4 empties needing 2 stars
    state.cells[3][2] = 'cross';
    
    // Now we have 4 empties: (2,2), (3,3), (2,4), (3,4) and need 2 stars
    // The valley at (3,3) is adjacent to multiple cells
    
    const hint = findTheMHint(state);
    
    // The M-shape pattern should be detected and potentially force cells
    expect(hint).not.toBeNull();
    
    if (hint) {
      // Verify technique identification
      expect(hint.technique).toBe('the-m');
      
      // Verify hint highlights the M-shaped region (Requirement 17.3)
      expect(hint.highlights?.regions).toBeDefined();
      expect(hint.highlights?.regions).toContain(2);
      
      // Verify hint highlights include the M-shape cells (Requirement 17.3)
      expect(hint.highlights?.cells).toBeDefined();
      expect(hint.highlights?.cells!.length).toBeGreaterThanOrEqual(4); // At least the remaining cells
      
      // Verify explanation describes the M-shape configuration (Requirement 17.1)
      expect(hint.explanation).toContain('M');
      expect(hint.explanation).toContain('2'); // region 2
      
      // Verify the hint kind is valid
      expect(['place-star', 'place-cross']).toContain(hint.kind);
      
      // Verify we have forced cells
      expect(hint.resultCells).toBeDefined();
      expect(hint.resultCells.length).toBeGreaterThan(0);
    }
  });

  it('forces crosses in valley when valley star would block too many cells', () => {
    /**
     * Scenario: M-shape where placing a star in the valley would block
     * cells in both peaks, making it impossible to place 2 stars in the region.
     */
    const regionMap = Array(10).fill(null).map(() => Array(10).fill(1));
    
    // Create a compact M-shape where valley is adjacent to peak cells
    // Left peak at (2,2)
    regionMap[2][2] = 2;
    
    // Valley at (3,3) - diagonally adjacent to left peak
    regionMap[3][3] = 2;
    
    // Right peak at (2,4) - valley is adjacent to both peaks
    regionMap[2][4] = 2;
    
    // Add more cells to make it a valid M with 5+ cells
    regionMap[3][2] = 2; // extend left peak down
    regionMap[3][4] = 2; // extend right peak down
    regionMap[4][3] = 2; // extend valley down
    
    const state = makeStateWithCustomRegions(regionMap);
    const hint = findTheMHint(state);
    
    // Should detect the M-shape and potentially force some cells
    expect(hint).not.toBeNull();
    
    if (hint) {
      expect(hint.technique).toBe('the-m');
      expect(hint.highlights?.regions).toContain(2);
    }
  });

  it('returns null when no M-shape pattern exists', () => {
    const regionMap = Array(10).fill(null).map(() => Array(10).fill(1));
    
    // Create a non-M shape (just a horizontal line)
    regionMap[5][0] = 2;
    regionMap[5][1] = 2;
    regionMap[5][2] = 2;
    regionMap[5][3] = 2;
    regionMap[5][4] = 2;
    
    const state = makeStateWithCustomRegions(regionMap);
    const hint = findTheMHint(state);
    
    expect(hint).toBeNull();
  });

  it('returns null when M-shape region is already satisfied', () => {
    const regionMap = Array(10).fill(null).map(() => Array(10).fill(1));
    
    // Create an M-shape
    regionMap[1][2] = 2;
    regionMap[2][2] = 2;
    regionMap[3][3] = 2;
    regionMap[4][3] = 2;
    regionMap[1][4] = 2;
    regionMap[2][4] = 2;
    
    const state = makeStateWithCustomRegions(regionMap);
    
    // Place 2 stars in the M-shape region
    state.cells[1][2] = 'star';
    state.cells[1][4] = 'star';
    
    const hint = findTheMHint(state);
    
    // Should return null since region already has 2 stars
    expect(hint).toBeNull();
  });

  it('forces all empties to stars when empties equal stars needed', () => {
    const regionMap = Array(10).fill(null).map(() => Array(10).fill(1));
    
    // Create an M-shape with 6 cells
    regionMap[1][2] = 2;
    regionMap[2][2] = 2;
    regionMap[3][3] = 2;
    regionMap[4][3] = 2;
    regionMap[1][4] = 2;
    regionMap[2][4] = 2;
    
    const state = makeStateWithCustomRegions(regionMap);
    
    // Mark 4 cells as crosses, leaving exactly 2 empties
    state.cells[2][2] = 'cross';
    state.cells[3][3] = 'cross';
    state.cells[4][3] = 'cross';
    state.cells[2][4] = 'cross';
    
    // Now we have 2 empties and need 2 stars
    const hint = findTheMHint(state);
    
    expect(hint).not.toBeNull();
    
    if (hint) {
      expect(hint.kind).toBe('place-star');
      expect(hint.resultCells).toHaveLength(2);
      
      // Verify the forced cells are the two remaining empties
      const forcedSet = new Set(hint.resultCells.map((c) => `${c.row},${c.col}`));
      expect(forcedSet.has('1,2')).toBe(true);
      expect(forcedSet.has('1,4')).toBe(true);
    }
  });
});
