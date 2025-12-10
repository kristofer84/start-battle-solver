import type { PuzzleState, Coords } from '../../types/puzzle';
import type { Hint } from '../../types/hints';
import type { TechniqueResult, Deduction, BlockDeduction } from '../../types/deductions';
import {
  rowCells,
  colCells,
  regionCells,
  countStars,
  emptyCells,
  getCell,
  formatRow,
  formatCol,
} from '../helpers';
import { canPlaceAllStars } from './undercounting';
import { canPlaceAllStarsSimultaneously } from '../constraints/placement';

let hintCounter = 0;

function nextHintId() {
  hintCounter += 1;
  return `square-counting-${hintCounter}`;
}

// Shared helpers
type BlockInfo = {
  cells: Coords[];
  placeable: Coords[];
};

function blocksOverlap(block1: Coords[], block2: Coords[]): boolean {
  // 2×2-blockar är små, dubbel loop är billigare än att skapa Set varje gång
  for (let i = 0; i < block1.length; i += 1) {
    const c1 = block1[i];
    for (let j = 0; j < block2.length; j += 1) {
      const c2 = block2[j];
      if (c1.row === c2.row && c1.col === c2.col) return true;
    }
  }
  return false;
}

function blockInfosOverlap(block1: BlockInfo, block2: BlockInfo): boolean {
  return blocksOverlap(block1.cells, block2.cells);
}

function cellKey(c: Coords): string {
  return `${c.row},${c.col}`;
}

function coordsKey(cells: Coords[]): string {
  // Sortera för att göra nyckeln ordningsoberoende (bra för cache)
  const sorted = [...cells].sort((a, b) =>
    a.row === b.row ? a.col - b.col : a.row - b.row,
  );
  return sorted.map(cellKey).join('|');
}

/**
 * Check if a cell is a star candidate (empty and can potentially be a star)
 */
function isStarCandidate(state: PuzzleState, cell: Coords, starsPerUnit: number): boolean {
  if (getCell(state, cell) !== 'empty') {
    return false;
  }
  // Check if placing a star here would be globally valid
  return canPlaceAllStarsSimultaneously(state, [cell], starsPerUnit) !== null;
}

/**
 * Find maximum number of non-overlapping blocks that can host a star simultaneously
 * This implements the C1 precondition check
 */
function findMaxNonOverlappingBlockSets(
  blocks: BlockInfo[],
  state: PuzzleState,
  starsPerUnit: number,
): { maxSize: number; maxSets: BlockInfo[][] } {
  if (blocks.length === 0) {
    return { maxSize: 0, maxSets: [] };
  }

  let maxSize = 0;
  const maxSets: BlockInfo[][] = [];

  const cache = new Map<string, boolean>();
  function canPlaceCached(cells: Coords[]): boolean {
    const key = coordsKey(cells);
    const cached = cache.get(key);
    if (cached !== undefined) return cached;
    const ok = canPlaceAllStarsSimultaneously(state, cells, starsPerUnit) !== null;
    cache.set(key, ok);
    return ok;
  }

  function backtrack(start: number, chosenBlocks: BlockInfo[], chosenCells: Coords[]): void {
    const chosenLen = chosenBlocks.length;

    if (chosenLen > 0) {
      // Verifiera att det finns en giltig placering: vi försöker lägga en stjärna i
      // varje block i ordning. chosenCells innehåller redan valda celler.
      const testPlacement: Coords[] = [];
      const localChosenCells = [...chosenCells]; // egna referenser

      for (const block of chosenBlocks) {
        let foundValid = false;
        for (const cell of block.placeable) {
          const trial = [...localChosenCells, cell];
          if (canPlaceCached(trial)) {
            localChosenCells.push(cell);
            testPlacement.push(cell);
            foundValid = true;
            break;
          }
        }
        if (!foundValid) {
          return; // denna blockmängd är inte globalt giltig
        }
      }

      if (chosenLen > maxSize) {
        maxSize = chosenLen;
        maxSets.length = 0;
        maxSets.push([...chosenBlocks]);
      } else if (chosenLen === maxSize && maxSize > 0) {
        maxSets.push([...chosenBlocks]);
      }
    }

    const n = blocks.length;

    // Övre gräns: om även om vi tar alla kvarvarande block inte kan slå maxSize, avbryt
    if (chosenBlocks.length + (n - start) <= maxSize) {
      return;
    }

    for (let i = start; i < n; i += 1) {
      const block = blocks[i];
      if (chosenBlocks.some(b => blockInfosOverlap(b, block))) continue;

      chosenBlocks.push(block);
      backtrack(i + 1, chosenBlocks, chosenCells);
      chosenBlocks.pop();
    }
  }

  backtrack(0, [], []);
  return { maxSize, maxSets };
}

/**
 * Enumerate all subsets of non-overlapping blocks of a given size
 */
function getNonOverlappingBlockSubsets(
  blocks: BlockInfo[],
  targetSize: number,
): BlockInfo[][] {
  const result: BlockInfo[][] = [];
  const n = blocks.length;

  function backtrack(start: number, chosen: BlockInfo[]): void {
    if (chosen.length === targetSize) {
      result.push([...chosen]);
      return;
    }

    // Om för få block återstår för att nå targetSize, avbryt
    if (chosen.length + (n - start) < targetSize) return;

    for (let i = start; i < n; i += 1) {
      const block = blocks[i];
      if (chosen.some(ch => blockInfosOverlap(ch, block))) continue;
      chosen.push(block);
      backtrack(i + 1, chosen);
      chosen.pop();
    }
  }

  backtrack(0, []);
  return result;
}

/**
 * Enumerate all ways to place stars in a set of blocks
 */
interface Arrangement {
  stars: Coords[];    // coordinates of stars placed in this band
}

function enumerateStarsInBlocks(
  state: PuzzleState,
  blocks: BlockInfo[],
  starsPerUnit: number,
  arrangements: Arrangement[],
): void {
  const chosen: Coords[] = [];

  const cache = new Map<string, boolean>();
  function canPlaceCached(cells: Coords[]): boolean {
    const key = coordsKey(cells);
    const cached = cache.get(key);
    if (cached !== undefined) return cached;
    const ok = canPlaceAllStarsSimultaneously(state, cells, starsPerUnit) !== null;
    cache.set(key, ok);
    return ok;
  }

  function backtrack(index: number): void {
    if (index === blocks.length) {
      if (canPlaceCached(chosen)) {
        arrangements.push({ stars: [...chosen] });
      }
      return;
    }

    const block = blocks[index];

    for (const cell of block.placeable) {
      chosen.push(cell);
      if (canPlaceCached(chosen)) {
        backtrack(index + 1);
      }
      chosen.pop();
    }
  }

  backtrack(0);
}

/**
 * For one band (two rows), enumerate all globally valid ways to place
 * `remainingStarsInBand` stars using 2×2 blocks.
 */
function enumerateBandArrangements(
  state: PuzzleState,
  blocks: BlockInfo[],
  remainingStarsInBand: number,
  starsPerUnit: number,
): Arrangement[] {
  const arrangements: Arrangement[] = [];

  // 1. Enumerate subsets of non-overlapping blocks of size remainingStarsInBand
  const allBlockSubsets = getNonOverlappingBlockSubsets(blocks, remainingStarsInBand);

  for (const blockSet of allBlockSubsets) {
    // 2. Within this subset, pick one candidate cell per block
    enumerateStarsInBlocks(state, blockSet, starsPerUnit, arrangements);
  }

  return arrangements;
}

function buildRowBlocks(
  state: PuzzleState,
  startRow: number,
  placeableFn: (block: Coords[]) => Coords[],
): BlockInfo[] {
  const { size } = state.def;
  const allValidBlocks: BlockInfo[] = [];

  for (let c = 0; c < size - 1; c += 1) {
    const blockCells: Coords[] = [
      { row: startRow, col: c },
      { row: startRow, col: c + 1 },
      { row: startRow + 1, col: c },
      { row: startRow + 1, col: c + 1 },
    ];

    if (blockCells.some(cell => getCell(state, cell) === 'star')) continue;

    const placeable = placeableFn(blockCells);
    if (placeable.length === 0) continue;

    allValidBlocks.push({ cells: blockCells, placeable });
  }

  return allValidBlocks;
}

function buildColumnBlocks(
  state: PuzzleState,
  startCol: number,
  placeableFn: (block: Coords[]) => Coords[],
): BlockInfo[] {
  const { size } = state.def;
  const allValidBlocks: BlockInfo[] = [];

  for (let r = 0; r < size - 1; r += 1) {
    const blockCells: Coords[] = [
      { row: r, col: startCol },
      { row: r, col: startCol + 1 },
      { row: r + 1, col: startCol },
      { row: r + 1, col: startCol + 1 },
    ];

    if (blockCells.some(cell => getCell(state, cell) === 'star')) continue;

    const placeable = placeableFn(blockCells);
    if (placeable.length === 0) continue;

    allValidBlocks.push({ cells: blockCells, placeable });
  }

  return allValidBlocks;
}

/**
 * 2x2 Square Counting technique:
 *
 * For consecutive rows (or columns), if the number of valid 2x2 blocks equals
 * the number of remaining stars needed, then each block must contain exactly one star.
 * If a block has only one empty cell, that cell must be the star.
 */
export function findSquareCountingHint(state: PuzzleState): Hint | null {
  const { size, starsPerUnit } = state.def;
  let bestHint: { hint: Hint; score: number } | null = null;

  const rowPlaceable = (block: Coords[]): Coords[] =>
    emptyCells(state, block).filter(
      cell => canPlaceAllStarsSimultaneously(state, [cell], starsPerUnit) !== null,
    );

  const colPlaceable = (block: Coords[]): Coords[] =>
    emptyCells(state, block).filter(cell => canPlaceAllStars(state, [cell]));

  // enkel cache för star-candidate inom ett anrop
  const starCandidateCache = new Map<string, boolean>();
  function isStarCandidateCached(cell: Coords): boolean {
    const k = cellKey(cell);
    const cached = starCandidateCache.get(k);
    if (cached !== undefined) return cached;
    const ok = isStarCandidate(state, cell, starsPerUnit);
    starCandidateCache.set(k, ok);
    return ok;
  }

  // Check consecutive pairs of rows
  for (let startRow = 0; startRow <= size - 2; startRow += 1) {
    const rows = [startRow, startRow + 1];

    // Count stars needed in these rows
    let totalStarsNeeded = 0;
    let totalStarsPlaced = 0;
    for (const r of rows) {
      const row = rowCells(state, r);
      const rowStars = countStars(state, row);
      totalStarsNeeded += starsPerUnit;
      totalStarsPlaced += rowStars;
    }

    const remainingStarsInBand = totalStarsNeeded - totalStarsPlaced;
    if (remainingStarsInBand <= 0) continue;

    // Build all valid 2×2 blocks for this band
    const rowBlocks = buildRowBlocks(state, startRow, rowPlaceable);

    // Step 1: C1 precondition check - compute maximum set of non-overlapping blocks
    const { maxSize } = findMaxNonOverlappingBlockSets(rowBlocks, state, starsPerUnit);

    // If maximum number of non-overlapping blocks is less than remaining stars, skip
    if (maxSize < remainingStarsInBand) {
      continue;
    }

    // Step 2: Exhaustively enumerate all globally valid arrangements
    const arrangements = enumerateBandArrangements(
      state,
      rowBlocks,
      remainingStarsInBand,
      starsPerUnit,
    );

    if (arrangements.length === 0) {
      continue;
    }

    // Step 3: Derive forced stars and crosses from all arrangements
    const starCountByCell = new Map<string, number>();
    const total = arrangements.length;

    // Count how often each cell is a star
    for (const arr of arrangements) {
      for (const c of arr.stars) {
        const k = cellKey(c);
        starCountByCell.set(k, (starCountByCell.get(k) ?? 0) + 1);
      }
    }

    // Collect all cells from all blocks for highlighting
    const allBlockCells: Coords[] = [];
    for (const block of rowBlocks) {
      allBlockCells.push(...block.cells);
    }

    const forcedStars: Coords[] = [];
    const forcedEmpties: Coords[] = [];

    // Check each empty cell in the band rows
    for (const r of rows) {
      const rowCoords = rowCells(state, r);

      for (const cellCoords of rowCoords) {
        if (getCell(state, cellCoords) !== 'empty') continue;

        // If this cell is not even a star candidate, skip
        if (!isStarCandidateCached(cellCoords)) continue;

        const k = cellKey(cellCoords);
        const count = starCountByCell.get(k) ?? 0;

        if (count === total) {
          // This cell is a star in every valid arrangement
          forcedStars.push(cellCoords);
        } else if (count === 0) {
          // This cell is never a star in any valid arrangement
          // But only mark as forced empty if it's within a block that could host a star
          const isInAnyBlock = rowBlocks.some(block =>
            block.cells.some(
              bc => bc.row === cellCoords.row && bc.col === cellCoords.col,
            ),
          );
          if (isInAnyBlock) {
            forcedEmpties.push(cellCoords);
          }
        }
      }
    }

    // Om du senare använder forcedEmpties kan de läggas in i hint/result, logik här lämnas oförändrad

    if (forcedStars.length > 0) {
      const explanation =
        `Row ${formatRow(rows[0])} and Row ${formatRow(rows[1])} ` +
        `need ${remainingStarsInBand} more star(s). ` +
        `Every feasible arrangement of ${remainingStarsInBand} non-overlapping 2×2 block(s) ` +
        `forces star(s) at ${forcedStars
          .map(c => `(${formatRow(c.row)}, ${formatCol(c.col)})`)
          .join(', ')}.`;

      const candidateHint: Hint = {
        id: nextHintId(),
        kind: 'place-star',
        technique: 'square-counting',
        resultCells: forcedStars,
        explanation,
        highlights: {
          rows,
          cells: allBlockCells,
        },
      };

      const score = forcedStars.length * 100 + remainingStarsInBand;
      if (!bestHint || score > bestHint.score) {
        bestHint = { hint: candidateHint, score };
      }
    }
  }

  // Check consecutive pairs of columns (similar logic)
  for (let startCol = 0; startCol <= size - 2; startCol += 1) {
    const cols = [startCol, startCol + 1];

    // Count stars needed in these columns
    let totalStarsNeeded = 0;
    let totalStarsPlaced = 0;
    for (const c of cols) {
      const col = colCells(state, c);
      const colStars = countStars(state, col);
      totalStarsNeeded += starsPerUnit;
      totalStarsPlaced += colStars;
    }

    const remainingStars = totalStarsNeeded - totalStarsPlaced;
    if (remainingStars <= 0) continue;

    const allValidBlocks = buildColumnBlocks(state, startCol, colPlaceable);
    if (allValidBlocks.length < remainingStars) continue;

    const allNonOverlappingSets = findNonOverlappingSetsLimited(
      allValidBlocks,
      remainingStars,
      2,
    );

    if (allNonOverlappingSets.length !== 1) continue;

    const validBlocks = allNonOverlappingSets[0];
    if (validBlocks.length !== remainingStars) continue;

    const allBlockCells: Coords[] = validBlocks.flatMap(block => block.cells);

    const forcedStars: Coords[] = [];
    for (const block of validBlocks) {
      if (block.placeable.length === 1) {
        const forcedStar = block.placeable[0];

        // Verify this cell can actually have a star (not adjacent to existing stars)
        let hasAdjacentStar = false;
        for (let dr = -1; dr <= 1; dr += 1) {
          for (let dc = -1; dc <= 1; dc += 1) {
            if (dr === 0 && dc === 0) continue;
            const nr = forcedStar.row + dr;
            const nc = forcedStar.col + dc;
            if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
              // Skip if it's in the same block
              if (block.cells.some(c => c.row === nr && c.col === nc)) continue;
              if (getCell(state, { row: nr, col: nc }) === 'star') {
                hasAdjacentStar = true;
                break;
              }
            }
          }
          if (hasAdjacentStar) break;
        }

        if (!hasAdjacentStar) {
          // Also check row/column/region quotas
          const row = rowCells(state, forcedStar.row);
          const col = colCells(state, forcedStar.col);
          const regionId = state.def.regions[forcedStar.row][forcedStar.col];
          const region = regionCells(state, regionId);

          if (
            countStars(state, row) < starsPerUnit &&
            countStars(state, col) < starsPerUnit &&
            countStars(state, region) < starsPerUnit
          ) {
            forcedStars.push(forcedStar);
          }
        }
      }
    }

    if (forcedStars.length > 0) {
      const explanation = `${formatUnitList(cols, formatCol)} need ${remainingStars} more star(s), and there are exactly ${validBlocks.length} non-overlapping 2×2 block(s) where stars can be placed. Each block must contain exactly one star. ${
        forcedStars.length === 1
          ? 'This block has only one empty cell, so it must be a star.'
          : `${forcedStars.length} of these blocks have only one empty cell each, so those cells must be stars.`
      }`;

      const candidateHint: Hint = {
        id: nextHintId(),
        kind: 'place-star',
        technique: 'square-counting',
        resultCells: forcedStars,
        explanation,
        highlights: {
          cols,
          cells: allBlockCells,
        },
      };

      const score = forcedStars.length * 100 + remainingStars;
      if (!bestHint || score > bestHint.score) {
        bestHint = { hint: candidateHint, score };
      }
    }
  }

  return bestHint?.hint ?? null;
}

function formatUnitList(indices: number[], formatter: (n: number) => string): string {
  if (indices.length === 0) return '';
  if (indices.length === 1) return formatter(indices[0]);
  if (indices.length === 2) return `${formatter(indices[0])} and ${formatter(indices[1])}`;
  const last = indices[indices.length - 1];
  const rest = indices.slice(0, -1);
  return `${rest.map(formatter).join(', ')}, and ${formatter(last)}`;
}

/**
 * Find non-overlapping subsets of blocks of a given size, up to maxSets results.
 * Used by the "result" variant of the technique to detect a unique block-set.
 */
function findNonOverlappingSetsLimited(
  blocks: BlockInfo[],
  targetSize: number,
  maxSets: number,
): BlockInfo[][] {
  const result: BlockInfo[][] = [];
  const n = blocks.length;

  function backtrack(start: number, chosen: BlockInfo[]): void {
    if (chosen.length === targetSize) {
      result.push([...chosen]);
      return;
    }
    if (start === n || result.length >= maxSets) return;

    // Pruning: om det inte finns tillräckligt många block kvar, avbryt
    if (chosen.length + (n - start) < targetSize) return;

    for (let i = start; i < n; i += 1) {
      if (result.length >= maxSets) return;

      const block = blocks[i];
      if (chosen.some(ch => blockInfosOverlap(ch, block))) continue;
      chosen.push(block);
      backtrack(i + 1, chosen);
      chosen.pop();
    }
  }

  backtrack(0, []);
  return result;
}

/**
 * Find result with deductions support
 * Returns block deductions when pattern is detected but no forced stars can be placed
 */
export function findSquareCountingResult(state: PuzzleState): TechniqueResult {
  const { size, starsPerUnit } = state.def;
  const deductions: Deduction[] = [];

  const rowPlaceable = (block: Coords[]): Coords[] => emptyCells(state, block);
  const colPlaceable = (block: Coords[]): Coords[] => emptyCells(state, block);

  // Check consecutive pairs of rows
  for (let startRow = 0; startRow <= size - 2; startRow += 1) {
    const rows = [startRow, startRow + 1];

    // Count stars needed in these rows
    let totalStarsNeeded = 0;
    let totalStarsPlaced = 0;
    for (const r of rows) {
      const row = rowCells(state, r);
      const rowStars = countStars(state, row);
      totalStarsNeeded += starsPerUnit;
      totalStarsPlaced += rowStars;
    }

    const remainingStars = totalStarsNeeded - totalStarsPlaced;
    if (remainingStars <= 0) continue;

    const allValidBlocks = buildRowBlocks(state, startRow, rowPlaceable);
    if (allValidBlocks.length < remainingStars) continue;

    const allNonOverlappingSets = findNonOverlappingSetsLimited(
      allValidBlocks,
      remainingStars,
      2,
    );

    if (allNonOverlappingSets.length === 1) {
      const validBlocks = allNonOverlappingSets[0];
      if (validBlocks.length === remainingStars) {
        for (const block of validBlocks) {
          const blockDeduction: BlockDeduction = {
            kind: 'block',
            technique: 'square-counting',
            block: { bRow: block.cells[0].row, bCol: block.cells[0].col },
            starsRequired: 1,
            explanation: `${formatUnitList(
              rows,
              formatRow,
            )} need ${remainingStars} more star(s), and there are exactly ${allNonOverlappingSets.length} set(s) of ${remainingStars} non-overlapping 2×2 block(s) where stars can be placed. Each block must contain exactly one star.`,
          };
          deductions.push(blockDeduction);
        }
      }
    }
  }

  // Check consecutive pairs of columns (similar logic)
  for (let startCol = 0; startCol <= size - 2; startCol += 1) {
    const cols = [startCol, startCol + 1];

    // Count stars needed in these columns
    let totalStarsNeeded = 0;
    let totalStarsPlaced = 0;
    for (const c of cols) {
      const col = colCells(state, c);
      const colStars = countStars(state, col);
      totalStarsNeeded += starsPerUnit;
      totalStarsPlaced += colStars;
    }

    const remainingStars = totalStarsNeeded - totalStarsPlaced;
    if (remainingStars <= 0) continue;

    const allValidBlocks = buildColumnBlocks(state, startCol, colPlaceable);
    if (allValidBlocks.length < remainingStars) continue;

    const allNonOverlappingSets = findNonOverlappingSetsLimited(
      allValidBlocks,
      remainingStars,
      2,
    );

    if (allNonOverlappingSets.length === 1) {
      const validBlocks = allNonOverlappingSets[0];
      if (validBlocks.length === remainingStars) {
        for (const block of validBlocks) {
          const blockDeduction: BlockDeduction = {
            kind: 'block',
            technique: 'square-counting',
            block: { bRow: block.cells[0].row, bCol: block.cells[0].col },
            starsRequired: 1,
            explanation: `${formatUnitList(
              cols,
              formatCol,
            )} need ${remainingStars} more star(s), and there are exactly ${allNonOverlappingSets.length} set(s) of ${remainingStars} non-overlapping 2×2 block(s) where stars can be placed. Each block must contain exactly one star.`,
          };
          deductions.push(blockDeduction);
        }
      }
    }
  }

  const hint = findSquareCountingHint(state);
  if (hint) {
    return { type: 'hint', hint, deductions: deductions.length > 0 ? deductions : undefined };
  }

  if (deductions.length > 0) {
    return { type: 'deductions', deductions };
  }

  return { type: 'none' };
}
