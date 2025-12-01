import { describe, expect, it } from 'vitest';
import { createEmptyPuzzleDef, createEmptyPuzzleState, type PuzzleState } from '../src/types/puzzle';
import { findLShapes, findMShapes, findTShapes } from '../src/logic/helpers';

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

describe('L-shape detection', () => {
  it('detects a simple L-shape in bottom-left orientation', () => {
    // Create an L-shape: corner at (2,2), horizontal arm extending right, vertical arm extending down
    const regionMap = Array(10).fill(null).map(() => Array(10).fill(1));
    
    // Region 2 forms an L-shape
    regionMap[2][2] = 2; // corner
    regionMap[2][3] = 2; // horizontal arm
    regionMap[2][4] = 2; // horizontal arm
    regionMap[3][2] = 2; // vertical arm
    regionMap[4][2] = 2; // vertical arm
    
    const state = makeStateWithCustomRegions(regionMap);
    const lShapes = findLShapes(state);
    
    expect(lShapes.length).toBeGreaterThanOrEqual(1);
    
    const region2Shape = lShapes.find((s) => s.regionId === 2);
    expect(region2Shape).toBeDefined();
    expect(region2Shape!.cells).toHaveLength(5);
    expect(region2Shape!.corner).toEqual({ row: 2, col: 2 });
    expect(region2Shape!.arms.horizontal).toHaveLength(2);
    expect(region2Shape!.arms.vertical).toHaveLength(2);
  });

  it('detects an L-shape in top-right orientation', () => {
    const regionMap = Array(10).fill(null).map(() => Array(10).fill(1));
    
    // Region 3 forms an L-shape: corner at (1,5), horizontal arm left, vertical arm down
    regionMap[1][3] = 3; // horizontal arm
    regionMap[1][4] = 3; // horizontal arm
    regionMap[1][5] = 3; // corner
    regionMap[2][5] = 3; // vertical arm
    regionMap[3][5] = 3; // vertical arm
    
    const state = makeStateWithCustomRegions(regionMap);
    const lShapes = findLShapes(state);
    
    const region3Shape = lShapes.find((s) => s.regionId === 3);
    expect(region3Shape).toBeDefined();
    expect(region3Shape!.cells).toHaveLength(5);
    expect(region3Shape!.corner).toEqual({ row: 1, col: 5 });
  });

  it('does not detect L-shape for non-L regions', () => {
    const regionMap = Array(10).fill(null).map(() => Array(10).fill(1));
    
    // Region 4 is a square, not an L
    regionMap[0][0] = 4;
    regionMap[0][1] = 4;
    regionMap[1][0] = 4;
    regionMap[1][1] = 4;
    
    const state = makeStateWithCustomRegions(regionMap);
    const lShapes = findLShapes(state);
    
    const region4Shape = lShapes.find((s) => s.regionId === 4);
    expect(region4Shape).toBeUndefined();
  });

  it('handles regions with too few cells', () => {
    const regionMap = Array(10).fill(null).map(() => Array(10).fill(1));
    
    // Region 5 has only 2 cells
    regionMap[0][0] = 5;
    regionMap[0][1] = 5;
    
    const state = makeStateWithCustomRegions(regionMap);
    const lShapes = findLShapes(state);
    
    const region5Shape = lShapes.find((s) => s.regionId === 5);
    expect(region5Shape).toBeUndefined();
  });
});

describe('M-shape detection', () => {
  it('detects a simple M-shape with two peaks and a valley', () => {
    const regionMap = Array(10).fill(null).map(() => Array(10).fill(1));
    
    // Region 2 forms an M-shape
    // Column 2: peak at row 1
    regionMap[1][2] = 2;
    regionMap[2][2] = 2;
    
    // Column 3: valley at row 3
    regionMap[3][3] = 2;
    regionMap[4][3] = 2;
    
    // Column 4: peak at row 1
    regionMap[1][4] = 2;
    regionMap[2][4] = 2;
    
    const state = makeStateWithCustomRegions(regionMap);
    const mShapes = findMShapes(state);
    
    const region2Shape = mShapes.find((s) => s.regionId === 2);
    expect(region2Shape).toBeDefined();
    if (region2Shape) {
      expect(region2Shape.peaks).toHaveLength(2);
      expect(region2Shape.valley).toBeDefined();
    }
  });

  it('does not detect M-shape for regions with insufficient cells', () => {
    const regionMap = Array(10).fill(null).map(() => Array(10).fill(1));
    
    // Region 3 has only 3 cells
    regionMap[0][0] = 3;
    regionMap[0][1] = 3;
    regionMap[0][2] = 3;
    
    const state = makeStateWithCustomRegions(regionMap);
    const mShapes = findMShapes(state);
    
    const region3Shape = mShapes.find((s) => s.regionId === 3);
    expect(region3Shape).toBeUndefined();
  });

  it('does not detect M-shape for non-M patterns', () => {
    const regionMap = Array(10).fill(null).map(() => Array(10).fill(1));
    
    // Region 4 is a horizontal line, not an M
    regionMap[5][0] = 4;
    regionMap[5][1] = 4;
    regionMap[5][2] = 4;
    regionMap[5][3] = 4;
    regionMap[5][4] = 4;
    
    const state = makeStateWithCustomRegions(regionMap);
    const mShapes = findMShapes(state);
    
    const region4Shape = mShapes.find((s) => s.regionId === 4);
    expect(region4Shape).toBeUndefined();
  });
});

describe('T-shape detection', () => {
  it('detects a horizontal T-shape with vertical stem', () => {
    const regionMap = Array(10).fill(null).map(() => Array(10).fill(1));
    
    // Region 2 forms a T-shape: horizontal crossbar at row 2, vertical stem below
    regionMap[2][3] = 2; // crossbar
    regionMap[2][4] = 2; // crossbar (middle)
    regionMap[2][5] = 2; // crossbar
    regionMap[3][4] = 2; // stem
    regionMap[4][4] = 2; // stem
    
    const state = makeStateWithCustomRegions(regionMap);
    const tShapes = findTShapes(state);
    
    const region2Shape = tShapes.find((s) => s.regionId === 2);
    expect(region2Shape).toBeDefined();
    expect(region2Shape!.cells).toHaveLength(5);
    expect(region2Shape!.crossbar).toHaveLength(3);
    expect(region2Shape!.stem).toHaveLength(2);
  });

  it('detects a vertical T-shape with horizontal stem', () => {
    const regionMap = Array(10).fill(null).map(() => Array(10).fill(1));
    
    // Region 3 forms a T-shape: vertical crossbar at col 3, horizontal stem to the right
    regionMap[1][3] = 3; // crossbar
    regionMap[2][3] = 3; // crossbar (middle)
    regionMap[3][3] = 3; // crossbar
    regionMap[2][4] = 3; // stem
    regionMap[2][5] = 3; // stem
    
    const state = makeStateWithCustomRegions(regionMap);
    const tShapes = findTShapes(state);
    
    const region3Shape = tShapes.find((s) => s.regionId === 3);
    expect(region3Shape).toBeDefined();
    expect(region3Shape!.cells).toHaveLength(5);
    expect(region3Shape!.crossbar).toHaveLength(3);
    expect(region3Shape!.stem).toHaveLength(2);
  });

  it('does not detect T-shape for regions with too few cells', () => {
    const regionMap = Array(10).fill(null).map(() => Array(10).fill(1));
    
    // Region 4 has only 3 cells
    regionMap[0][0] = 4;
    regionMap[0][1] = 4;
    regionMap[1][0] = 4;
    
    const state = makeStateWithCustomRegions(regionMap);
    const tShapes = findTShapes(state);
    
    const region4Shape = tShapes.find((s) => s.regionId === 4);
    expect(region4Shape).toBeUndefined();
  });

  it('does not detect T-shape for non-contiguous crossbar', () => {
    const regionMap = Array(10).fill(null).map(() => Array(10).fill(1));
    
    // Region 5 has a gap in the crossbar
    regionMap[2][3] = 5;
    regionMap[2][4] = 5;
    // gap at [2][5]
    regionMap[2][6] = 5;
    regionMap[3][4] = 5; // stem
    
    const state = makeStateWithCustomRegions(regionMap);
    const tShapes = findTShapes(state);
    
    const region5Shape = tShapes.find((s) => s.regionId === 5);
    expect(region5Shape).toBeUndefined();
  });

  it('handles T-shape with longer crossbar', () => {
    const regionMap = Array(10).fill(null).map(() => Array(10).fill(1));
    
    // Region 6 forms a T-shape with 5-cell crossbar
    regionMap[1][2] = 6;
    regionMap[1][3] = 6;
    regionMap[1][4] = 6; // middle
    regionMap[1][5] = 6;
    regionMap[1][6] = 6;
    regionMap[2][4] = 6; // stem
    regionMap[3][4] = 6; // stem
    
    const state = makeStateWithCustomRegions(regionMap);
    const tShapes = findTShapes(state);
    
    const region6Shape = tShapes.find((s) => s.regionId === 6);
    expect(region6Shape).toBeDefined();
    expect(region6Shape!.crossbar).toHaveLength(5);
    expect(region6Shape!.stem).toHaveLength(2);
  });
});
