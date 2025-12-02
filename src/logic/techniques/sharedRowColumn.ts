import type { PuzzleState, Coords } from '../../types/puzzle';
import type { Hint } from '../../types/hints';
import { regionCells, rowCells, colCells, emptyCells, countStars, neighbors8, getCell, formatRow, formatCol, formatRegion } from '../helpers';

let hintCounter = 0;

function nextHintId() {
  hintCounter += 1;
  return `shared-row-column-${hintCounter}`;
}

/**
 * Shared Row/Column technique:
 * 
 * If two regions both need stars and all possible star placements for each region
 * are constrained to the same row or column, then that row/column will have at least
 * 2 stars (one from each region). Therefore, all other cells in that row/column
 * (from other regions) must be crosses.
 * 
 * Pattern:
 * - Region A needs at least 1 star, all possible placements are in row R (or col C)
 * - Region B needs at least 1 star, all possible placements are in row R (or col C)
 * - Therefore, row R (or col C) will have at least 2 stars
 * - All other cells in row R (or col C) from other regions must be crosses
 */
export function findSharedRowColumnHint(state: PuzzleState): Hint | null {
  const { size, starsPerUnit } = state.def;
  
  // Get all regions that need stars
  const allRegionIds = new Set<number>();
  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      allRegionIds.add(state.def.regions[r][c]);
    }
  }
  
  const regionsNeedingStars: Array<{ regionId: number; needsStars: number; possiblePlacements: Coords[] }> = [];
  
  // For each region, check if it needs stars and find possible placements
  for (const regionId of allRegionIds) {
    const region = regionCells(state, regionId);
    const regionStars = countStars(state, region);
    const regionEmpties = emptyCells(state, region);
    const needsStars = starsPerUnit - regionStars;
    
    if (needsStars > 0 && regionEmpties.length > 0) {
      // Find cells that can actually contain a star (not adjacent to existing stars)
      const possiblePlacements = regionEmpties.filter(cell => {
        const nbs = neighbors8(cell, size);
        return !nbs.some(nb => getCell(state, nb) === 'star');
      });
      
      if (possiblePlacements.length > 0) {
        regionsNeedingStars.push({
          regionId,
          needsStars,
          possiblePlacements,
        });
      }
    }
  }
  
  // Check all pairs of regions
  for (let i = 0; i < regionsNeedingStars.length; i += 1) {
    for (let j = i + 1; j < regionsNeedingStars.length; j += 1) {
      const reg1 = regionsNeedingStars[i];
      const reg2 = regionsNeedingStars[j];
      
      // Check if both regions' possible placements are constrained to the same row
      const reg1Rows = new Set(reg1.possiblePlacements.map(c => c.row));
      const reg2Rows = new Set(reg2.possiblePlacements.map(c => c.row));
      
      // Check if both are constrained to a single row and it's the same row
      if (reg1Rows.size === 1 && reg2Rows.size === 1) {
        const row1 = Array.from(reg1Rows)[0];
        const row2 = Array.from(reg2Rows)[0];
        
        if (row1 === row2) {
          // Both regions must place stars in the same row
          // Find all cells in this row that are NOT in reg1 or reg2
          const row = rowCells(state, row1);
          const forcedCrosses = row.filter(cell => {
            const cellRegionId = state.def.regions[cell.row][cell.col];
            return cellRegionId !== reg1.regionId && 
                   cellRegionId !== reg2.regionId &&
                   getCell(state, cell) === 'empty';
          });
          
          if (forcedCrosses.length > 0) {
            return {
              id: nextHintId(),
              kind: 'place-cross',
              technique: 'shared-row-column',
              resultCells: forcedCrosses,
              explanation: `${formatRegion(reg1.regionId)} and ${formatRegion(reg2.regionId)} both need stars, and all possible placements for each region are in ${formatRow(row1)}. Therefore, this row will have at least 2 stars (one from each region), so all other cells in this row must be crosses.`,
              highlights: {
                rows: [row1],
                regions: [reg1.regionId, reg2.regionId],
                cells: [...reg1.possiblePlacements, ...reg2.possiblePlacements, ...forcedCrosses],
              },
            };
          }
        }
      }
      
      // Check if both regions' possible placements are constrained to the same column
      const reg1Cols = new Set(reg1.possiblePlacements.map(c => c.col));
      const reg2Cols = new Set(reg2.possiblePlacements.map(c => c.col));
      
      // Check if both are constrained to a single column and it's the same column
      if (reg1Cols.size === 1 && reg2Cols.size === 1) {
        const col1 = Array.from(reg1Cols)[0];
        const col2 = Array.from(reg2Cols)[0];
        
        if (col1 === col2) {
          // Both regions must place stars in the same column
          // Find all cells in this column that are NOT in reg1 or reg2
          const col = colCells(state, col1);
          const forcedCrosses = col.filter(cell => {
            const cellRegionId = state.def.regions[cell.row][cell.col];
            return cellRegionId !== reg1.regionId && 
                   cellRegionId !== reg2.regionId &&
                   getCell(state, cell) === 'empty';
          });
          
          if (forcedCrosses.length > 0) {
            return {
              id: nextHintId(),
              kind: 'place-cross',
              technique: 'shared-row-column',
              resultCells: forcedCrosses,
              explanation: `${formatRegion(reg1.regionId)} and ${formatRegion(reg2.regionId)} both need stars, and all possible placements for each region are in ${formatCol(col1)}. Therefore, this column will have at least 2 stars (one from each region), so all other cells in this column must be crosses.`,
              highlights: {
                cols: [col1],
                regions: [reg1.regionId, reg2.regionId],
                cells: [...reg1.possiblePlacements, ...reg2.possiblePlacements, ...forcedCrosses],
              },
            };
          }
        }
      }
    }
  }
  
  return null;
}
