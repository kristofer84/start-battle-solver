import type { PuzzleState, Coords } from '../../types/puzzle';
import type { Hint } from '../../types/hints';
import { findTShapes, getCell, emptyCells, countStars, neighbors8, rowCells, colCells } from '../helpers';

let hintCounter = 0;

function nextHintId() {
  hintCounter += 1;
  return `pressured-ts-${hintCounter}`;
}

/**
 * Pressured Ts technique:
 * 
 * When a T-shaped region is under pressure from surrounding constraints
 * (crosses, adjacent stars, or 2×2 blocks), the constraint that the region
 * needs 2 stars combined with the spatial pressure can force specific
 * star placements.
 * 
 * Key insight: The T-shape has a crossbar and a stem. When surrounding
 * constraints create pressure (limiting where stars can go), the need for
 * 2 stars in the region forces specific placements.
 */
export function findPressuredTsHint(state: PuzzleState): Hint | null {
  const tShapes = findTShapes(state);
  
  if (tShapes.length === 0) return null;
  
  // Analyze each T-shape for forced cells under pressure
  for (const tShape of tShapes) {
    const forcedCells = analyzePressuredT(state, tShape);
    
    if (forcedCells.length > 0) {
      return {
        id: nextHintId(),
        kind: forcedCells[0].kind,
        technique: 'pressured-ts',
        resultCells: forcedCells.map((fc) => fc.cell),
        explanation: `Region ${tShape.regionId} forms a T-shape. Surrounding constraints (crosses, adjacent stars, or 2×2 blocks) create pressure that limits where stars can be placed. Combined with the need for 2 stars in this region, specific placements are forced.`,
        highlights: {
          regions: [tShape.regionId],
          cells: [...tShape.cells, ...forcedCells.map((fc) => fc.cell)],
        },
      };
    }
  }
  
  return null;
}

interface ForcedCell {
  cell: Coords;
  kind: 'place-star' | 'place-cross';
}

/**
 * Analyze a T-shape under pressure to find forced cells
 */
function analyzePressuredT(
  state: PuzzleState,
  tShape: ReturnType<typeof findTShapes>[0]
): ForcedCell[] {
  const forcedCells: ForcedCell[] = [];
  
  const starsInRegion = countStars(state, tShape.cells);
  const emptiesInRegion = emptyCells(state, tShape.cells);
  const starsNeeded = state.def.starsPerUnit - starsInRegion;
  
  // If region is already satisfied or has no empties, no forcing
  if (starsNeeded === 0 || emptiesInRegion.length === 0) return [];
  
  // Strategy 1: If we need exactly as many stars as we have empties, all empties are stars
  if (starsNeeded === emptiesInRegion.length) {
    for (const cell of emptiesInRegion) {
      forcedCells.push({ cell, kind: 'place-star' });
    }
    return forcedCells;
  }
  
  // Strategy 2: Analyze pressure from surrounding constraints
  // Count how many viable positions exist for stars in different parts of the T
  
  // Separate empties into crossbar and stem
  const crossbarEmpties = emptiesInRegion.filter((cell) =>
    tShape.crossbar.some((c) => c.row === cell.row && c.col === cell.col)
  );
  
  const stemEmpties = emptiesInRegion.filter((cell) =>
    tShape.stem.some((c) => c.row === cell.row && c.col === cell.col)
  );
  
  // Strategy 3: Check for external pressure FIRST (prioritize forced stars)
  // If the crossbar or stem has limited viable positions due to external constraints,
  // we may be able to force placements
  
  // Get viable cells in crossbar and stem
  const viableCrossbarCells = getViableCells(state, crossbarEmpties, tShape);
  const viableStemCells = getViableCells(state, stemEmpties, tShape);
  
  // Total viable positions in the entire T-shape
  const totalViablePositions = viableCrossbarCells.length + viableStemCells.length;
  
  // If total viable positions equals stars needed, all viable positions must be stars
  if (totalViablePositions === starsNeeded && totalViablePositions > 0) {
    for (const cell of viableCrossbarCells) {
      if (!forcedCells.some((fc) => fc.cell.row === cell.row && fc.cell.col === cell.col)) {
        forcedCells.push({ cell, kind: 'place-star' });
      }
    }
    for (const cell of viableStemCells) {
      if (!forcedCells.some((fc) => fc.cell.row === cell.row && fc.cell.col === cell.col)) {
        forcedCells.push({ cell, kind: 'place-star' });
      }
    }
    return forcedCells; // Return early if we found forced stars
  }
  
  // If one part has no viable positions, all stars must go in the other part
  if (viableCrossbarCells.length === 0 && viableStemCells.length === starsNeeded) {
    for (const cell of viableStemCells) {
      if (!forcedCells.some((fc) => fc.cell.row === cell.row && fc.cell.col === cell.col)) {
        forcedCells.push({ cell, kind: 'place-star' });
      }
    }
    return forcedCells; // Return early
  }
  
  if (viableStemCells.length === 0 && viableCrossbarCells.length === starsNeeded) {
    for (const cell of viableCrossbarCells) {
      if (!forcedCells.some((fc) => fc.cell.row === cell.row && fc.cell.col === cell.col)) {
        forcedCells.push({ cell, kind: 'place-star' });
      }
    }
    return forcedCells; // Return early
  }
  
  // Strategy 4: Check if placing a star in certain cells would block too many others
  // (Only do this if we didn't find forced stars above)
  for (const emptyCell of emptiesInRegion) {
    // Count how many other empty cells would be blocked by placing a star here
    const blockedCells = emptiesInRegion.filter((other) => {
      if (other.row === emptyCell.row && other.col === emptyCell.col) return false;
      
      // Check if placing a star at emptyCell would force other to be a cross
      const neighbors = neighbors8(emptyCell, state.def.size);
      return neighbors.some((n) => n.row === other.row && n.col === other.col);
    });
    
    // If placing a star here would leave insufficient cells for remaining stars
    const remainingCells = emptiesInRegion.length - 1 - blockedCells.length;
    if (remainingCells < starsNeeded - 1) {
      forcedCells.push({ cell: emptyCell, kind: 'place-cross' });
    }
  }
  
  // Deduplicate forced cells
  const seen = new Set<string>();
  return forcedCells.filter((fc) => {
    const key = `${fc.cell.row},${fc.cell.col}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Count how many positions in the given cells are viable for placing stars
 * (not blocked by external constraints like row/column quota or adjacency)
 */
function countViablePositions(
  state: PuzzleState,
  cells: Coords[],
  tShape: ReturnType<typeof findTShapes>[0]
): number {
  let count = 0;
  
  for (const cell of cells) {
    if (isViablePosition(state, cell, tShape)) {
      count += 1;
    }
  }
  
  return count;
}

/**
 * Get all viable cells from the given list
 */
function getViableCells(
  state: PuzzleState,
  cells: Coords[],
  tShape: ReturnType<typeof findTShapes>[0]
): Coords[] {
  return cells.filter((cell) => isViablePosition(state, cell, tShape));
}

/**
 * Check if a position is viable for placing a star
 * (considering external pressure from row/column quotas and adjacency)
 */
function isViablePosition(
  state: PuzzleState,
  cell: Coords,
  tShape: ReturnType<typeof findTShapes>[0]
): boolean {
  // Check if placing a star here would violate row quota
  const rowCellsList = rowCells(state, cell.row);
  const starsInRow = countStars(state, rowCellsList);
  if (starsInRow >= state.def.starsPerUnit) return false;
  
  // Check if placing a star here would violate column quota
  const colCellsList = colCells(state, cell.col);
  const starsInCol = countStars(state, colCellsList);
  if (starsInCol >= state.def.starsPerUnit) return false;
  
  // Check if placing a star here would violate adjacency constraint
  const neighbors = neighbors8(cell, state.def.size);
  for (const neighbor of neighbors) {
    if (getCell(state, neighbor) === 'star') return false;
  }
  
  // Check if placing a star here would create a 2×2 block with existing stars
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
        
        // Count stars already in this block
        const starsInBlock = block.filter((c) => getCell(state, c) === 'star').length;
        if (starsInBlock >= 1) return false;
      }
    }
  }
  
  return true;
}
