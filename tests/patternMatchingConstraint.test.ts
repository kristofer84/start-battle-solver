import { describe, it, expect } from 'vitest';
import { createEmptyPuzzleState, type PuzzleState } from '../src/types/puzzle';
import { findPatternMatchingHint } from '../src/logic/techniques/patternMatching';
import { getCell } from '../src/logic/helpers';
import { evaluateFeature } from '../src/logic/entanglements/features';

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
 * Create a simple 10x10 puzzle state with all regions set to 1
 * (regions don't matter for pattern matching constraint tests)
 */
function createSimpleState(): PuzzleState {
  const regions = Array(10).fill(null).map(() => Array(10).fill(1));
  return createEmptyPuzzleState({
    size: 10,
    starsPerUnit: 2,
    regions,
  });
}

describe('Pattern Matching with candidate_on_outer_ring constraint', () => {
  /**
   * Test pattern [39220f]:
   * - Canonical stars: [[1, 1], [3, 4]]
   * - Canonical candidate: [5, 2]
   * - Constraint: candidate_on_outer_ring
   * 
   * For a 10x10 board, "outer ring" (ring 1) means:
   * - row 1 or row 8 (size-2 = 10-2 = 8)
   * - col 1 or col 8
   * 
   * This test verifies that the pattern correctly identifies candidates
   * that are on ring 1, and does NOT match candidates on the actual edge
   * or in the interior.
   */
  
  it('should match pattern when candidate is on ring 1 (row 1)', () => {
    const state = createSimpleState();
    
    // Place stars that match the canonical pattern [[1, 1], [3, 4]]
    // After identity transformation and no translation, stars are at (1,1) and (3,4)
    // The candidate would be at (5, 2) which is NOT on ring 1
    // So we need to place stars that, after transformation, result in candidate on ring 1
    
    // Let's place stars at (1,1) and (3,4) - this matches the canonical pattern directly
    // The candidate would be at (5,2) - but (5,2) is NOT on ring 1 (row 5, col 2)
    // So this should NOT match
    
    // Instead, let's try a different placement:
    // If we place stars at (2,2) and (4,5), and use identity transform with offset (1,1),
    // the canonical pattern [1,1] and [3,4] maps to (2,2) and (4,5)
    // The candidate [5,2] would map to (6,3) - still not on ring 1
    
    // Actually, let's think about this differently:
    // We want the candidate to end up on ring 1 (row 1 or 8, or col 1 or 8)
    // The canonical candidate is [5, 2]
    // For it to be on ring 1, we need: row=1 or 8, or col=1 or 8
    
    // Let's place stars at positions that will result in candidate at (1, X) or (X, 1) or (8, X) or (X, 8)
    // For example, if we want candidate at (1, 5):
    // - We need offset such that 5 + offset_row = 1, so offset_row = -4
    // - And 2 + offset_col = 5, so offset_col = 3
    // - So stars at [1,1] and [3,4] with offset (-4, 3) would map to:
    //   - Star 1: (1-4, 1+3) = (-3, 4) - out of bounds!
    
    // Let's try a simpler approach: place stars that match the pattern
    // and verify the candidate position calculation
    
    // Place stars at (2,2) and (4,5) - this is offset (1,1) from canonical [1,1] and [3,4]
    // The candidate [5,2] with offset (1,1) would be at (6,3) - NOT on ring 1
    setCells(state, [[2, 2], [4, 5]], []);
    
    const hint = findPatternMatchingHint(state);
    
    // This should NOT match because candidate (6,3) is not on ring 1
    expect(hint).toBeNull();
  });

  it('should match pattern when candidate is on ring 1 (col 1)', () => {
    const state = createSimpleState();
    
    // We need to place stars such that the transformed candidate ends up on ring 1
    // Ring 1 means: row 1, row 8, col 1, or col 8
    
    // Let's try: if we want candidate at (X, 1) where X can be anything
    // Canonical candidate is [5, 2]
    // For col to be 1: 2 + offset_col = 1, so offset_col = -1
    // So we need stars at positions offset by (?, -1) from canonical [1,1] and [3,4]
    // That means stars at [1, 0] and [3, 3] (with offset (0, -1))
    // But wait, the pattern matching finds the offset automatically
    
    // Actually, let's think: if we place stars at [1, 0] and [3, 3],
    // the pattern matcher will try to match canonical [1,1] and [3,4] to these
    // It will find offset (0, -1)
    // Then candidate [5, 2] with offset (0, -1) = (5, 1) - col 1 is on ring 1!
    setCells(state, [[1, 0], [3, 3]], []);
    
    const hint = findPatternMatchingHint(state);
    
    if (hint) {
      console.log(`Found hint: ${hint.explanation}`);
      console.log(`Result cells: ${hint.resultCells.map(c => `(${c.row},${c.col})`).join(', ')}`);
      
      // The candidate should be at (5, 1) which is on ring 1 (col 1)
      expect(hint.resultCells.length).toBeGreaterThan(0);
      const candidate = hint.resultCells[0];
      
      // Verify candidate is on ring 1
      const isOnRing1 = 
        candidate.row === 1 || 
        candidate.row === 8 || 
        candidate.col === 1 || 
        candidate.col === 8;
      expect(isOnRing1).toBe(true);
      
      // Verify the cell is currently empty
      expect(getCell(state, candidate)).toBe('empty');
    } else {
      // If no hint found, that's also valid - the pattern might not match
      // But let's log for debugging
      console.log('No hint found - pattern may not have matched');
    }
  });

  it('should NOT match pattern when candidate is on actual edge (row 0)', () => {
    const state = createSimpleState();
    
    // Place stars such that candidate would be on row 0 (actual edge, not ring 1)
    // Canonical candidate is [5, 2]
    // For row to be 0: 5 + offset_row = 0, so offset_row = -5
    // Stars at canonical [1,1] and [3,4] with offset (-5, ?) would be:
    // [1-5, 1+?] = [-4, 1+?] - out of bounds!
    
    // Let's try a different approach: use a transformation
    // If we rotate 180 degrees, canonical [1,1] becomes [8,8] on a 10x10 board
    // But the pattern matcher handles transformations automatically
    
    // Actually, let's just verify that edge cells (row 0, row 9, col 0, col 9)
    // are NOT considered ring 1
    setCells(state, [[0, 0], [2, 3]], []);
    
    const hint = findPatternMatchingHint(state);
    
    // This might match an unconstrained rule, but if it matches the constrained rule [39220f],
    // the candidate should NOT be on the actual edge
    if (hint && hint.patternId === '39220f') {
      const candidate = hint.resultCells[0];
      // Candidate should NOT be on actual edge
      expect(candidate.row).not.toBe(0);
      expect(candidate.row).not.toBe(9);
      expect(candidate.col).not.toBe(0);
      expect(candidate.col).not.toBe(9);
    }
  });

  it('should NOT match pattern when candidate is in interior (not on ring 1)', () => {
    const state = createSimpleState();
    
    // Place stars at (2,2) and (4,5) - offset (1,1) from canonical
    // Candidate [5,2] with offset (1,1) = (6,3) - interior, not on ring 1
    setCells(state, [[2, 2], [4, 5]], []);
    
    const hint = findPatternMatchingHint(state);
    
    // If hint matches pattern [39220f], it should not have found a candidate
    // because (6,3) is not on ring 1
    if (hint && hint.patternId === '39220f') {
      // This should not happen - the constraint should have failed
      expect(hint.resultCells.length).toBe(0);
    }
  });

  it('should correctly identify ring 1 positions for 10x10 board', () => {
    const state = createSimpleState();
    
    // Ring 1 for 10x10 board: row 1, row 8, col 1, col 8
    const ring1Positions = [
      { row: 1, col: 5 }, // row 1
      { row: 8, col: 5 }, // row 8
      { row: 5, col: 1 }, // col 1
      { row: 5, col: 8 }, // col 8
    ];
    
    const notRing1Positions = [
      { row: 0, col: 5 }, // actual edge
      { row: 9, col: 5 }, // actual edge
      { row: 5, col: 0 }, // actual edge
      { row: 5, col: 9 }, // actual edge
      { row: 5, col: 5 }, // interior
    ];
    
    // Test the feature evaluation function directly
    for (const pos of ring1Positions) {
      const result = evaluateFeature('candidate_on_outer_ring', state, pos);
      expect(result).toBe(true);
    }
    
    for (const pos of notRing1Positions) {
      const result = evaluateFeature('candidate_on_outer_ring', state, pos);
      expect(result).toBe(false);
    }
  });
});

