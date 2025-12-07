/**
 * 2×2 block (cage) helper functions
 */

import type { BoardState, Block2x2, Group, CellId, Region, RowBand, ColumnBand } from '../model/types';
import { CellState } from '../model/types';
import { isStarCandidate } from './cellHelpers';

/**
 * Enumerate all 2×2 blocks in the board
 * (Already done in state construction, but provided for completeness)
 */
export function enumerateBlocks2x2(state: BoardState): Block2x2[] {
  return state.blocks2x2;
}

/**
 * Get valid blocks in a band (blocks that overlap band and have at least one candidate)
 */
export function getValidBlocksInBand(
  band: RowBand | ColumnBand,
  state: BoardState
): Block2x2[] {
  const bandCellSet = new Set(band.cells);
  
  return state.blocks2x2.filter(block => {
    // Block must overlap band
    const overlapsBand = block.cells.some(cellId => bandCellSet.has(cellId));
    if (!overlapsBand) return false;
    
    // Block must have at least one candidate cell in the band
    const hasCandidateInBand = block.cells.some(
      cellId => bandCellSet.has(cellId) && isStarCandidate(state, cellId)
    );
    
    return hasCandidateInBand;
  });
}

/**
 * Get valid blocks in a region (blocks completely inside region)
 */
export function getValidBlocksInRegion(
  region: Region,
  state: BoardState
): Block2x2[] {
  const regionCellSet = new Set(region.cells);
  
  return state.blocks2x2.filter(block => {
    // All 4 cells of block must be in region
    const allInRegion = block.cells.every(cellId => regionCellSet.has(cellId));
    if (!allInRegion) return false;
    
    // Block must have at least one candidate cell
    return block.cells.some(cellId => isStarCandidate(state, cellId));
  });
}

/**
 * Check if a block is valid (has at least one candidate cell)
 */
export function isBlockValid(block: Block2x2, state: BoardState): boolean {
  return block.cells.some(cellId => isStarCandidate(state, cellId));
}

/**
 * Get all groups (rows, columns, regions) that intersect with given cells
 */
export function getGroupsIntersectingCells(
  state: BoardState,
  cells: CellId[]
): Group[] {
  const cellSet = new Set(cells);
  const groups: Group[] = [];
  
  // Add rows
  for (const row of state.rows) {
    if (row.cells.some(cellId => cellSet.has(cellId))) {
      groups.push({
        kind: 'row',
        id: `row_${row.rowIndex}`,
        cells: row.cells,
        starsRequired: row.starsRequired,
      });
    }
  }
  
  // Add columns
  for (const col of state.cols) {
    if (col.cells.some(cellId => cellSet.has(cellId))) {
      groups.push({
        kind: 'column',
        id: `col_${col.colIndex}`,
        cells: col.cells,
        starsRequired: col.starsRequired,
      });
    }
  }
  
  // Add regions
  for (const region of state.regions) {
    if (region.cells.some(cellId => cellSet.has(cellId))) {
      groups.push({
        kind: 'region',
        id: `region_${region.id}`,
        cells: region.cells,
        starsRequired: region.starsRequired,
      });
    }
  }
  
  return groups;
}

/**
 * Get quota (number of stars) a group must place in a block
 */
export function getQuotaInBlock(
  group: Group,
  block: Block2x2,
  state: BoardState
): number {
  const blockCellSet = new Set(block.cells);
  const groupCellsInBlock = group.cells.filter(cellId => blockCellSet.has(cellId));
  
  if (groupCellsInBlock.length === 0) return 0;
  
  // Count current stars in block from this group
  const currentStars = groupCellsInBlock.filter(
    cellId => state.cellStates[cellId] === CellState.Star
  ).length;
  
  // If group has remaining stars and block is the only place, return 1
  // This is simplified - full implementation would check if group must place star in block
  const remainingStars = group.starsRequired !== undefined
    ? Math.max(0, group.starsRequired - getStarCountInGroup(group, state))
    : 0;
  
  // For now, return 0 (no quota) - full implementation needs more sophisticated logic
  // This would check if group is forced to place a star in this block
  return 0;
}

/**
 * Helper to get star count in group
 */
function getStarCountInGroup(group: Group, state: BoardState): number {
  return group.cells.filter(cellId => state.cellStates[cellId] === CellState.Star).length;
}

/**
 * Get star count in region
 */
function getStarCountInRegion(region: Region, state: BoardState): number {
  return region.cells.filter(cellId => state.cellStates[cellId] === CellState.Star).length;
}

