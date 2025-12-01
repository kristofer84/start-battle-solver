import { describe, expect, it } from 'vitest';
import { createEmptyPuzzleDef, createEmptyPuzzleState, type PuzzleState } from '../src/types/puzzle';
import { rowCells, colCells, regionCells, neighbors8 } from '../src/logic/helpers';

function makeStateWithRegions(): PuzzleState {
  const def = createEmptyPuzzleDef();
  // Simple striped regions: first five rows = region 1, next five = region 2, etc. just for testing.
  let regionId = 1;
  for (let r = 0; r < def.size; r += 1) {
    if (r > 0 && r % 5 === 0) regionId += 1;
    for (let c = 0; c < def.size; c += 1) {
      def.regions[r][c] = regionId;
    }
  }
  return createEmptyPuzzleState(def);
}

describe('helpers', () => {
  it('rowCells and colCells cover all coordinates in a row/column', () => {
    const state = makeStateWithRegions();
    const row = rowCells(state, 0);
    expect(row).toHaveLength(10);
    expect(row[0]).toEqual({ row: 0, col: 0 });
    expect(row[9]).toEqual({ row: 0, col: 9 });

    const col = colCells(state, 3);
    expect(col).toHaveLength(10);
    expect(col[0]).toEqual({ row: 0, col: 3 });
    expect(col[9]).toEqual({ row: 9, col: 3 });
  });

  it('regionCells returns only cells for the given region id', () => {
    const state = makeStateWithRegions();
    const region1 = regionCells(state, 1);
    const region2 = regionCells(state, 2);
    expect(region1.length).toBeGreaterThan(0);
    expect(region2.length).toBeGreaterThan(0);
    for (const c of region1) {
      expect(state.def.regions[c.row][c.col]).toBe(1);
    }
    for (const c of region2) {
      expect(state.def.regions[c.row][c.col]).toBe(2);
    }
  });

  it('neighbors8 returns only in-bounds neighbors', () => {
    const state = makeStateWithRegions();
    const size = state.def.size;
    const center = neighbors8({ row: 5, col: 5 }, size);
    expect(center).toHaveLength(8);

    const corner = neighbors8({ row: 0, col: 0 }, size);
    expect(corner.length).toBeLessThanOrEqual(3);
    for (const n of corner) {
      expect(n.row).toBeGreaterThanOrEqual(0);
      expect(n.col).toBeGreaterThanOrEqual(0);
      expect(n.row).toBeLessThan(size);
      expect(n.col).toBeLessThan(size);
    }
  });
});


