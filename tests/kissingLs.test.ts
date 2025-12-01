import { describe, expect, it } from 'vitest';
import { createEmptyPuzzleDef, createEmptyPuzzleState, type PuzzleState } from '../src/types/puzzle';
import { findKissingLsHint } from '../src/logic/techniques/kissingLs';

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

describe('Kissing Ls technique', () => {
  it('detects kissing Ls pattern and identifies forced cells', () => {
    const regionMap = Array(10).fill(null).map(() => Array(10).fill(1));
    
    // Create two L-shaped regions that "kiss" (touch diagonally)
    // Region 2: L-shape with corner at (3,3), horizontal arm right, vertical arm down
    regionMap[3][3] = 2; // corner
    regionMap[3][4] = 2; // horizontal arm
    regionMap[3][5] = 2; // horizontal arm
    regionMap[4][3] = 2; // vertical arm
    regionMap[5][3] = 2; // vertical arm
    
    // Region 3: L-shape with corner at (4,4), touching region 2 diagonally
    // horizontal arm right, vertical arm down
    regionMap[4][4] = 3; // corner (diagonally adjacent to region 2's corner)
    regionMap[4][5] = 3; // horizontal arm
    regionMap[4][6] = 3; // horizontal arm
    regionMap[5][4] = 3; // vertical arm
    regionMap[6][4] = 3; // vertical arm
    
    const state = makeStateWithCustomRegions(regionMap);
    const hint = findKissingLsHint(state);
    
    // The kissing Ls pattern should force some cells
    expect(hint).not.toBeNull();
    if (hint) {
      expect(hint.technique).toBe('kissing-ls');
      expect(hint.resultCells.length).toBeGreaterThan(0);
      
      // Verify hint highlights both L-shaped regions
      expect(hint.highlights?.regions).toBeDefined();
      expect(hint.highlights?.regions).toContain(2);
      expect(hint.highlights?.regions).toContain(3);
      
      // Verify explanation mentions the L-shape configuration
      expect(hint.explanation).toContain('L');
    }
  });

  it('identifies specific forced crosses in a concrete kissing Ls example', () => {
    /**
     * This test validates Requirements 16.1 and 16.3:
     * - Two L-shaped regions touch in a specific configuration
     * - The system identifies forced star placements based on the kissing L pattern
     * - The hint highlights both L-shaped regions and the forced cells
     * 
     * Scenario: Two L-shapes kiss at their corners. When one L's corner is adjacent
     * to cells in the other L's arms, placing a star in certain cells would block
     * too many cells in the adjacent L, making it impossible for that L to get 2 stars.
     */
    const regionMap = Array(10).fill(null).map(() => Array(10).fill(1));
    
    // Region 2: L-shape with corner at (2,2)
    // Horizontal arm extends right: (2,3), (2,4)
    // Vertical arm extends down: (3,2), (4,2)
    regionMap[2][2] = 2; // corner
    regionMap[2][3] = 2; // horizontal arm
    regionMap[2][4] = 2; // horizontal arm
    regionMap[3][2] = 2; // vertical arm
    regionMap[4][2] = 2; // vertical arm
    
    // Region 3: L-shape with corner at (3,3), kissing region 2
    // Horizontal arm extends right: (3,4), (3,5)
    // Vertical arm extends down: (4,3), (5,3)
    // Note: (3,3) is diagonally adjacent to region 2's corner (2,2)
    // and directly adjacent to region 2's cells (2,3) and (3,2)
    regionMap[3][3] = 3; // corner (touches region 2)
    regionMap[3][4] = 3; // horizontal arm
    regionMap[3][5] = 3; // horizontal arm
    regionMap[4][3] = 3; // vertical arm
    regionMap[5][3] = 3; // vertical arm
    
    const state = makeStateWithCustomRegions(regionMap);
    const hint = findKissingLsHint(state);
    
    // Should find forced cells due to the kissing configuration
    expect(hint).not.toBeNull();
    
    if (hint) {
      // Verify technique identification
      expect(hint.technique).toBe('kissing-ls');
      
      // Verify we have forced cells (either stars or crosses)
      expect(hint.resultCells).toBeDefined();
      expect(hint.resultCells.length).toBeGreaterThan(0);
      
      // Verify hint highlights both L-shaped regions (Requirement 16.3)
      expect(hint.highlights?.regions).toBeDefined();
      expect(hint.highlights?.regions).toHaveLength(2);
      expect(hint.highlights?.regions).toContain(2);
      expect(hint.highlights?.regions).toContain(3);
      
      // Verify hint highlights include the L-shape cells and forced cells (Requirement 16.3)
      expect(hint.highlights?.cells).toBeDefined();
      expect(hint.highlights?.cells!.length).toBeGreaterThanOrEqual(10); // At least both L-shapes (5+5)
      
      // Verify explanation describes the kissing L configuration (Requirement 16.1)
      expect(hint.explanation).toContain('L');
      expect(hint.explanation).toContain('kiss');
      expect(hint.explanation).toContain('2'); // region 2
      expect(hint.explanation).toContain('3'); // region 3
      
      // Verify the hint kind is valid
      expect(['place-star', 'place-cross']).toContain(hint.kind);
    }
  });

  it('returns null when no kissing Ls pattern exists', () => {
    const regionMap = Array(10).fill(null).map(() => Array(10).fill(1));
    
    // Create an L-shape but no second L to kiss it
    regionMap[3][3] = 2;
    regionMap[3][4] = 2;
    regionMap[3][5] = 2;
    regionMap[4][3] = 2;
    regionMap[5][3] = 2;
    
    const state = makeStateWithCustomRegions(regionMap);
    const hint = findKissingLsHint(state);
    
    expect(hint).toBeNull();
  });

  it('returns null when L-shapes do not touch', () => {
    const regionMap = Array(10).fill(null).map(() => Array(10).fill(1));
    
    // Two L-shapes that are far apart
    // Region 2: L-shape
    regionMap[1][1] = 2;
    regionMap[1][2] = 2;
    regionMap[1][3] = 2;
    regionMap[2][1] = 2;
    regionMap[3][1] = 2;
    
    // Region 3: L-shape far away
    regionMap[7][7] = 3;
    regionMap[7][8] = 3;
    regionMap[7][9] = 3;
    regionMap[8][7] = 3;
    regionMap[9][7] = 3;
    
    const state = makeStateWithCustomRegions(regionMap);
    const hint = findKissingLsHint(state);
    
    expect(hint).toBeNull();
  });
});
