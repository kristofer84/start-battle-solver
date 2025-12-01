import type { PuzzleState, Coords } from '../../types/puzzle';
import type { Hint } from '../../types/hints';
import {
  rowCells,
  colCells,
  regionCells,
  countStars,
  emptyCells,
  getCell,
  neighbors8,
  intersection,
} from '../helpers';

let hintCounter = 0;

function nextHintId() {
  hintCounter += 1;
  return `squeeze-${hintCounter}`;
}

/**
 * Squeeze technique:
 * 
 * Identifies situations where stars must fit into constrained spaces due to
 * crosses and 2×2 blocks. When multiple units intersect and their combined
 * constraints force specific placements, this technique identifies those forced cells.
 * 
 * The technique looks for:
 * - Intersections of units (row+region, col+region) that need stars
 * - Valid placements within those intersections (avoiding crosses, adjacency, 2×2 violations)
 * - Situations where the number of valid placements equals the stars needed
 * 
 * Key difference from undercounting: Squeeze considers the spatial constraints
 * (adjacency, 2×2) that reduce valid placements, not just counting arguments.
 */
export function findSqueezeHint(state: PuzzleState): Hint | null {
  const { size, starsPerUnit } = state.def;

  // Strategy: Look for intersections of units where valid placements are squeezed
  // by spatial constraints (crosses, adjacency, 2×2 blocks)
  
  // Try intersections of rows with regions
  for (let r = 0; r < size; r += 1) {
    const row = rowCells(state, r);
    const rowStars = countStars(state, row);
    const rowRemaining = starsPerUnit - rowStars;
    
    if (rowRemaining <= 0) continue;
    
    for (let regionId = 1; regionId <= size; regionId += 1) {
      const region = regionCells(state, regionId);
      const regionStars = countStars(state, region);
      const regionRemaining = starsPerUnit - regionStars;
      
      if (regionRemaining <= 0) continue;
      
      // Find intersection of row and region
      const shape = intersection(row, region);
      if (shape.length === 0) continue;
      
      const empties = emptyCells(state, shape);
      if (empties.length === 0) continue;
      
      // Find valid placements (cells where a star can be placed without immediate violations)
      const validPlacements = empties.filter(cell => isValidPlacement(state, cell));
      
      if (validPlacements.length === 0) continue;
      
      // Squeeze pattern: The number of stars needed equals the number of valid placements
      const starsNeeded = Math.max(rowRemaining, regionRemaining);
      
      if (validPlacements.length === starsNeeded && validPlacements.length > 0) {
        // Verify this doesn't violate other unit constraints
        const safeCell = findSafeCellToPlace(state, validPlacements, starsPerUnit);
        if (!safeCell) continue;
        
        const explanation = `Row ${r + 1} needs ${rowRemaining} star(s) and region ${regionId} needs ${regionRemaining} star(s). Due to crosses and 2×2 constraints, their intersection has only ${validPlacements.length} valid placement(s), so all must be stars.`;
        
        return {
          id: nextHintId(),
          kind: 'place-star',
          technique: 'squeeze',
          resultCells: [safeCell],
          explanation,
          highlights: {
            rows: [r],
            regions: [regionId],
            cells: validPlacements,
          },
        };
      }
    }
  }
  
  // Try intersections of columns with regions
  for (let c = 0; c < size; c += 1) {
    const col = colCells(state, c);
    const colStars = countStars(state, col);
    const colRemaining = starsPerUnit - colStars;
    
    if (colRemaining <= 0) continue;
    
    for (let regionId = 1; regionId <= size; regionId += 1) {
      const region = regionCells(state, regionId);
      const regionStars = countStars(state, region);
      const regionRemaining = starsPerUnit - regionStars;
      
      if (regionRemaining <= 0) continue;
      
      // Find intersection of column and region
      const shape = intersection(col, region);
      if (shape.length === 0) continue;
      
      const empties = emptyCells(state, shape);
      if (empties.length === 0) continue;
      
      // Find valid placements (cells where a star can be placed without immediate violations)
      const validPlacements = empties.filter(cell => isValidPlacement(state, cell));
      
      if (validPlacements.length === 0) continue;
      
      // Squeeze pattern: The number of stars needed equals the number of valid placements
      const starsNeeded = Math.max(colRemaining, regionRemaining);
      
      if (validPlacements.length === starsNeeded && validPlacements.length > 0) {
        // Verify this doesn't violate other unit constraints
        const safeCell = findSafeCellToPlace(state, validPlacements, starsPerUnit);
        if (!safeCell) continue;
        
        const explanation = `Column ${c + 1} needs ${colRemaining} star(s) and region ${regionId} needs ${regionRemaining} star(s). Due to crosses and 2×2 constraints, their intersection has only ${validPlacements.length} valid placement(s), so all must be stars.`;
        
        return {
          id: nextHintId(),
          kind: 'place-star',
          technique: 'squeeze',
          resultCells: [safeCell],
          explanation,
          highlights: {
            cols: [c],
            regions: [regionId],
            cells: validPlacements,
          },
        };
      }
    }
  }
  
  // Try single units with narrow corridors
  // Check rows
  for (let r = 0; r < size; r += 1) {
    const row = rowCells(state, r);
    const rowStars = countStars(state, row);
    const rowRemaining = starsPerUnit - rowStars;
    
    if (rowRemaining <= 0) continue;
    
    const empties = emptyCells(state, row);
    if (empties.length === 0) continue;
    
    const validPlacements = empties.filter(cell => isValidPlacement(state, cell));
    
    if (validPlacements.length === rowRemaining && validPlacements.length > 0) {
      const safeCell = findSafeCellToPlace(state, validPlacements, starsPerUnit);
      if (!safeCell) continue;
      
      const explanation = `Row ${r + 1} needs ${rowRemaining} star(s). Due to crosses and 2×2 constraints, only ${validPlacements.length} cell(s) can contain stars, so all must be stars.`;
      
      return {
        id: nextHintId(),
        kind: 'place-star',
        technique: 'squeeze',
        resultCells: [safeCell],
        explanation,
        highlights: {
          rows: [r],
          cells: validPlacements,
        },
      };
    }
  }
  
  // Check columns
  for (let c = 0; c < size; c += 1) {
    const col = colCells(state, c);
    const colStars = countStars(state, col);
    const colRemaining = starsPerUnit - colStars;
    
    if (colRemaining <= 0) continue;
    
    const empties = emptyCells(state, col);
    if (empties.length === 0) continue;
    
    const validPlacements = empties.filter(cell => isValidPlacement(state, cell));
    
    if (validPlacements.length === colRemaining && validPlacements.length > 0) {
      const safeCell = findSafeCellToPlace(state, validPlacements, starsPerUnit);
      if (!safeCell) continue;
      
      const explanation = `Column ${c + 1} needs ${colRemaining} star(s). Due to crosses and 2×2 constraints, only ${validPlacements.length} cell(s) can contain stars, so all must be stars.`;
      
      return {
        id: nextHintId(),
        kind: 'place-star',
        technique: 'squeeze',
        resultCells: [safeCell],
        explanation,
        highlights: {
          cols: [c],
          cells: validPlacements,
        },
      };
    }
  }
  
  // Check regions
  for (let regionId = 1; regionId <= size; regionId += 1) {
    const region = regionCells(state, regionId);
    const regionStars = countStars(state, region);
    const regionRemaining = starsPerUnit - regionStars;
    
    if (regionRemaining <= 0) continue;
    
    const empties = emptyCells(state, region);
    if (empties.length === 0) continue;
    
    const validPlacements = empties.filter(cell => isValidPlacement(state, cell));
    
    if (validPlacements.length === regionRemaining && validPlacements.length > 0) {
      const safeCell = findSafeCellToPlace(state, validPlacements, starsPerUnit);
      if (!safeCell) continue;
      
      const explanation = `Region ${regionId} needs ${regionRemaining} star(s). Due to crosses and 2×2 constraints, only ${validPlacements.length} cell(s) can contain stars, so all must be stars.`;
      
      return {
        id: nextHintId(),
        kind: 'place-star',
        technique: 'squeeze',
        resultCells: [safeCell],
        explanation,
        highlights: {
          regions: [regionId],
          cells: validPlacements,
        },
      };
    }
  }

  return null;
}

/**
 * Find a safe cell to place from the valid placements.
 * Returns the first cell that doesn't violate any unit constraints.
 */
function findSafeCellToPlace(
  state: PuzzleState,
  validPlacements: Coords[],
  starsPerUnit: number
): Coords | null {
  for (const cell of validPlacements) {
    // Check if this cell is not adjacent to any existing stars
    const nbs = neighbors8(cell, state.def.size);
    const hasAdjacentStar = nbs.some(nb => getCell(state, nb) === 'star');
    if (hasAdjacentStar) continue;
    
    // Check if placing a star here would violate row/column/region constraints
    const cellRow = rowCells(state, cell.row);
    const cellCol = colCells(state, cell.col);
    const cellRegionId = state.def.regions[cell.row][cell.col];
    const cellRegion = regionCells(state, cellRegionId);
    
    const rowStarsCount = countStars(state, cellRow);
    const colStarsCount = countStars(state, cellCol);
    const regionStarsCount = countStars(state, cellRegion);
    
    if (rowStarsCount >= starsPerUnit || colStarsCount >= starsPerUnit || regionStarsCount >= starsPerUnit) {
      continue;
    }
    
    return cell;
  }
  
  return null;
}

/**
 * Check if a cell is a valid placement for a star (doesn't immediately violate constraints)
 */
function isValidPlacement(state: PuzzleState, cell: Coords): boolean {
  // Cell must be empty
  if (getCell(state, cell) !== 'empty') return false;
  
  // Check if placing a star here would create a 2×2 block with another star
  for (let dr = -1; dr <= 0; dr += 1) {
    for (let dc = -1; dc <= 0; dc += 1) {
      const blockTopLeft = { row: cell.row + dr, col: cell.col + dc };
      if (
        blockTopLeft.row >= 0 &&
        blockTopLeft.col >= 0 &&
        blockTopLeft.row < state.def.size - 1 &&
        blockTopLeft.col < state.def.size - 1
      ) {
        const block: Coords[] = [
          blockTopLeft,
          { row: blockTopLeft.row, col: blockTopLeft.col + 1 },
          { row: blockTopLeft.row + 1, col: blockTopLeft.col },
          { row: blockTopLeft.row + 1, col: blockTopLeft.col + 1 },
        ];
        
        // Count stars in this block (excluding the candidate cell)
        const starsInBlock = block.filter((c) => 
          (c.row !== cell.row || c.col !== cell.col) && getCell(state, c) === 'star'
        ).length;
        
        if (starsInBlock >= 1) {
          return false; // Would create 2×2 with multiple stars
        }
      }
    }
  }
  
  // Check if any adjacent cell has a star
  const adjacent = neighbors8(cell, state.def.size);
  for (const adj of adjacent) {
    if (getCell(state, adj) === 'star') {
      return false; // Would be adjacent to a star
    }
  }
  
  return true;
}
