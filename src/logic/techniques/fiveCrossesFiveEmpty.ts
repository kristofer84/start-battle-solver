import type { PuzzleState, Coords } from '../../types/puzzle';
import type { Hint } from '../../types/hints';
import {
  rowCells,
  colCells,
  emptyCells,
  countCrosses,
  formatRow,
  formatCol,
  getCell,
} from '../helpers';

let hintCounter = 0;

function nextHintId() {
  hintCounter += 1;
  return `five-crosses-five-empty-${hintCounter}`;
}

/**
 * Check if cells in a row are adjacent (contiguous horizontally)
 */
function areCellsAdjacentInRow(cells: Coords[]): boolean {
  if (cells.length === 0) return false;
  
  // All cells must be in the same row
  const row = cells[0].row;
  if (!cells.every(c => c.row === row)) return false;
  
  // Sort by column
  const sorted = [...cells].sort((a, b) => a.col - b.col);
  
  // Check if columns are consecutive
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].col !== sorted[i - 1].col + 1) {
      return false;
    }
  }
  
  return true;
}

/**
 * Check if cells in a column are adjacent (contiguous vertically)
 */
function areCellsAdjacentInCol(cells: Coords[]): boolean {
  if (cells.length === 0) return false;
  
  // All cells must be in the same column
  const col = cells[0].col;
  if (!cells.every(c => c.col === col)) return false;
  
  // Sort by row
  const sorted = [...cells].sort((a, b) => a.row - b.row);
  
  // Check if rows are consecutive
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].row !== sorted[i - 1].row + 1) {
      return false;
    }
  }
  
  return true;
}

/**
 * Find cells horizontally adjacent to specific cells
 * (cells in the same rows, but columns to the left and right)
 */
function findHorizontalAdjacentCells(state: PuzzleState, cells: Coords[]): Coords[] {
  const { size } = state.def;
  const adjacent: Coords[] = [];
  const seen = new Set<string>();
  
  for (const cell of cells) {
    // Left neighbor
    if (cell.col > 0) {
      const left = { row: cell.row, col: cell.col - 1 };
      const key = `${left.row},${left.col}`;
      if (!seen.has(key) && getCell(state, left) === 'empty') {
        seen.add(key);
        adjacent.push(left);
      }
    }
    
    // Right neighbor
    if (cell.col < size - 1) {
      const right = { row: cell.row, col: cell.col + 1 };
      const key = `${right.row},${right.col}`;
      if (!seen.has(key) && getCell(state, right) === 'empty') {
        seen.add(key);
        adjacent.push(right);
      }
    }
  }
  
  return adjacent;
}

/**
 * Find cells vertically adjacent to specific cells
 * (cells in the same columns, but rows above and below)
 */
function findVerticalAdjacentCells(state: PuzzleState, cells: Coords[]): Coords[] {
  const { size } = state.def;
  const adjacent: Coords[] = [];
  const seen = new Set<string>();
  
  for (const cell of cells) {
    // Top neighbor
    if (cell.row > 0) {
      const top = { row: cell.row - 1, col: cell.col };
      const key = `${top.row},${top.col}`;
      if (!seen.has(key) && getCell(state, top) === 'empty') {
        seen.add(key);
        adjacent.push(top);
      }
    }
    
    // Bottom neighbor
    if (cell.row < size - 1) {
      const bottom = { row: cell.row + 1, col: cell.col };
      const key = `${bottom.row},${bottom.col}`;
      if (!seen.has(key) && getCell(state, bottom) === 'empty') {
        seen.add(key);
        adjacent.push(bottom);
      }
    }
  }
  
  return adjacent;
}

/**
 * Find cells adjacent to specific cells (both horizontal and vertical)
 */
function findAdjacentCells(state: PuzzleState, cells: Coords[]): Coords[] {
  const horizontal = findHorizontalAdjacentCells(state, cells);
  const vertical = findVerticalAdjacentCells(state, cells);
  
  // Combine and deduplicate
  const all = [...horizontal, ...vertical];
  const seen = new Set<string>();
  const result: Coords[] = [];
  
  for (const cell of all) {
    const key = `${cell.row},${cell.col}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(cell);
    }
  }
  
  return result;
}

/**
 * Check if empty cells can be split into groups of 2 and 3
 * Returns the group of 3 if found, null otherwise
 * Rejects 4+1 or 1+4 splits - only allows 2+3 splits
 */
function findGroupOfThree(empties: Coords[], isRow: boolean): Coords[] | null {
  if (empties.length !== 5) return null;
  
  // Sort by position (column for rows, row for columns)
  const sorted = [...empties].sort((a, b) => {
    return isRow ? a.col - b.col : a.row - b.row;
  });
  
  // Try all possible ways to split into 2+3
  // Check if any group of 3 consecutive cells exists, with remaining 2 also adjacent
  for (let i = 0; i <= 2; i++) {
    const groupOfThree = sorted.slice(i, i + 3);
    const groupOfTwo = [...sorted.slice(0, i), ...sorted.slice(i + 3)];
    
    // Must have exactly 2 cells in the other group (rejects 4+1 and 1+4)
    if (groupOfTwo.length !== 2) continue;
    
    // Check if group of 3 is adjacent
    const isThreeAdjacent = isRow 
      ? areCellsAdjacentInRow(groupOfThree)
      : areCellsAdjacentInCol(groupOfThree);
    
    // Check if group of 2 is also adjacent (ensures proper 2+3 split, not 1+1+3 or other patterns)
    const isTwoAdjacent = isRow
      ? areCellsAdjacentInRow(groupOfTwo)
      : areCellsAdjacentInCol(groupOfTwo);
    
    // Both groups must be adjacent to form a valid 2+3 split
    if (isThreeAdjacent && isTwoAdjacent) {
      return groupOfThree;
    }
  }
  
  return null;
}

/**
 * Five Crosses Five Empty technique:
 * 
 * If a row or column has 5 crosses and 5 empty cells:
 * - If the 5 empty cells are adjacent, then crosses can be placed vertically or 
 *   horizontally adjacent to the 2nd and 4th empty spot (positions 1 and 3, 0-indexed)
 * - If the empty spots are split as 2 + 3, then crosses can be placed vertically 
 *   or horizontally adjacent to the middle empty in the group of 3
 */
export function findFiveCrossesFiveEmptyHint(state: PuzzleState): Hint | null {
  const { size } = state.def;
  
  // Check rows
  for (let r = 0; r < size; r += 1) {
    const row = rowCells(state, r);
    const empties = emptyCells(state, row);
    const crosses = countCrosses(state, row);
    
    // Check if this row has exactly 5 crosses and 5 empty cells
    if (crosses === 5 && empties.length === 5) {
      // Check if the 5 empty cells are adjacent
      if (areCellsAdjacentInRow(empties)) {
        // Sort by column to get positions
        const sorted = [...empties].sort((a, b) => a.col - b.col);
        
        // Get 2nd and 4th empty spots (indices 1 and 3)
        const secondEmpty = sorted[1];
        const fourthEmpty = sorted[3];
        
        // Find cells adjacent to these positions (vertically adjacent for rows)
        const adjacentCells = findVerticalAdjacentCells(state, [secondEmpty, fourthEmpty]);
        
        if (adjacentCells.length > 0) {
          return {
            id: nextHintId(),
            kind: 'place-cross',
            technique: 'five-crosses-five-empty',
            resultCells: adjacentCells,
            explanation: `${formatRow(r)} has 5 crosses and 5 adjacent empty cells. Crosses can be placed vertically adjacent to the 2nd and 4th empty spots.`,
            highlights: {
              rows: [r],
              cells: [...empties, ...adjacentCells],
            },
          };
        }
      } else {
        // Check if empty cells are split as 2 + 3
        const groupOfThree = findGroupOfThree(empties, true);
        if (groupOfThree) {
          // Sort the group of 3 to find the middle one
          const sorted = [...groupOfThree].sort((a, b) => a.col - b.col);
          const middleEmpty = sorted[1]; // Middle of the 3
          
          // Find cells adjacent to the middle empty (vertically adjacent for rows)
          const adjacentCells = findVerticalAdjacentCells(state, [middleEmpty]);
          
          if (adjacentCells.length > 0) {
            return {
              id: nextHintId(),
              kind: 'place-cross',
              technique: 'five-crosses-five-empty',
              resultCells: adjacentCells,
              explanation: `${formatRow(r)} has 5 crosses and 5 empty cells split as 2+3. Crosses can be placed vertically adjacent to the middle empty in the group of 3.`,
              highlights: {
                rows: [r],
                cells: [...empties, ...adjacentCells],
              },
            };
          }
        }
      }
    }
  }
  
  // Check columns
  for (let c = 0; c < size; c += 1) {
    const col = colCells(state, c);
    const empties = emptyCells(state, col);
    const crosses = countCrosses(state, col);
    
    // Check if this column has exactly 5 crosses and 5 empty cells
    if (crosses === 5 && empties.length === 5) {
      // Check if the 5 empty cells are adjacent
      if (areCellsAdjacentInCol(empties)) {
        // Sort by row to get positions
        const sorted = [...empties].sort((a, b) => a.row - b.row);
        
        // Get 2nd and 4th empty spots (indices 1 and 3)
        const secondEmpty = sorted[1];
        const fourthEmpty = sorted[3];
        
        // Find cells adjacent to these positions (horizontally adjacent for columns)
        const adjacentCells = findHorizontalAdjacentCells(state, [secondEmpty, fourthEmpty]);
        
        if (adjacentCells.length > 0) {
          return {
            id: nextHintId(),
            kind: 'place-cross',
            technique: 'five-crosses-five-empty',
            resultCells: adjacentCells,
            explanation: `${formatCol(c)} has 5 crosses and 5 adjacent empty cells. Crosses can be placed horizontally adjacent to the 2nd and 4th empty spots.`,
            highlights: {
              cols: [c],
              cells: [...empties, ...adjacentCells],
            },
          };
        }
      } else {
        // Check if empty cells are split as 2 + 3
        const groupOfThree = findGroupOfThree(empties, false);
        if (groupOfThree) {
          // Sort the group of 3 to find the middle one
          const sorted = [...groupOfThree].sort((a, b) => a.row - b.row);
          const middleEmpty = sorted[1]; // Middle of the 3
          
          // Find cells adjacent to the middle empty (horizontally adjacent for columns)
          const adjacentCells = findHorizontalAdjacentCells(state, [middleEmpty]);
          
          if (adjacentCells.length > 0) {
            return {
              id: nextHintId(),
              kind: 'place-cross',
              technique: 'five-crosses-five-empty',
              resultCells: adjacentCells,
              explanation: `${formatCol(c)} has 5 crosses and 5 empty cells split as 2+3. Crosses can be placed horizontally adjacent to the middle empty in the group of 3.`,
              highlights: {
                cols: [c],
                cells: [...empties, ...adjacentCells],
              },
            };
          }
        }
      }
    }
  }
  
  return null;
}
