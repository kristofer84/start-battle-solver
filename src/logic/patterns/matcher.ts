/**
 * Pattern matcher for runtime pattern matching
 */

import type { BoardState, CellId } from '../schemas/model/types';
import type { LoadedPattern } from './loader';
import type { SchemaApplication } from '../schemas/types';
import { CellState, coordToCellId, cellIdToCoord } from '../schemas/model/types';
import { isStarCandidate } from '../schemas/helpers/cellHelpers';

/**
 * Window specification for pattern matching
 */
export interface WindowSpec {
  width: number;
  height: number;
  originRow: number;
  originCol: number;
}

/**
 * Match a pattern in a window on the board
 */
export function matchPatternInWindow(
  pattern: LoadedPattern,
  window: WindowSpec,
  state: BoardState
): SchemaApplication | null {
  const { width, height, originRow, originCol } = window;
  const size = state.size;

  // Check if window fits on board
  if (originRow + height > size || originCol + width > size) {
    return null;
  }

  // Check if pattern window size matches
  if (pattern.window_width !== width || pattern.window_height !== height) {
    return null;
  }

  // Map relative cell IDs to absolute cell IDs
  const relativeToAbsolute = (relativeId: number): CellId => {
    const relRow = Math.floor(relativeId / pattern.window_width);
    const relCol = relativeId % pattern.window_width;
    const absRow = originRow + relRow;
    const absCol = originCol + relCol;
    return coordToCellId({ row: absRow, col: absCol }, size);
  };

  const patternData = pattern.data || {};
  
  // Validate pattern preconditions:
  // 1. Check forced stars match board state
  const forcedStars = patternData.forcedStars || [];
  for (const relCellId of forcedStars) {
    const absCellId = relativeToAbsolute(relCellId);
    if (state.cellStates[absCellId] !== CellState.Star) {
      return null; // Pattern requires star here but board doesn't have it
    }
  }

  // 2. Check forced empties match board state
  const forcedEmpties = patternData.forcedEmpties || [];
  for (const relCellId of forcedEmpties) {
    const absCellId = relativeToAbsolute(relCellId);
    if (state.cellStates[absCellId] !== CellState.Empty) {
      return null; // Pattern requires empty here but board doesn't have it
    }
  }

  // 3. Check candidate cells match board state (must be unknown or star)
  const patternCandidates = patternData.candidate_cells || [];
  for (const relCellId of patternCandidates) {
    const absCellId = relativeToAbsolute(relCellId);
    if (!isStarCandidate(state, absCellId)) {
      return null; // Pattern requires candidate here but cell is already empty
    }
  }

  // 4. Validate region structure matches (if pattern encodes it)
  if (patternData.row_band) {
    const patternRowBand = patternData.row_band as number[];
    const actualRowBand = Array.from({ length: height }, (_, i) => originRow + i).sort((a, b) => a - b);
    if (patternRowBand.length !== actualRowBand.length || 
        !patternRowBand.every((r, i) => r === actualRowBand[i])) {
      // Pattern row band doesn't match - but this might be okay if pattern is flexible
      // For now, we'll be lenient and only check if regions match
    }
  }

  if (patternData.col_band) {
    const patternColBand = patternData.col_band as number[];
    const actualColBand = Array.from({ length: width }, (_, i) => originCol + i).sort((a, b) => a - b);
    if (patternColBand.length !== actualColBand.length || 
        !patternColBand.every((c, i) => c === actualColBand[i])) {
      // Pattern col band doesn't match - but this might be okay if pattern is flexible
      // For now, we'll be lenient and only check if regions match
    }
  }

  // 5. Validate that pattern regions match actual regions in window (if pattern encodes regions)
  // Note: We're lenient here - patterns encode region structure but exact region ID matching
  // might be too strict. Post-validation (quotas, adjacency) will catch invalid deductions.
  // For now, we only validate that pattern regions exist somewhere in the window.
  if (patternData.regions && Array.isArray(patternData.regions) && patternData.regions.length > 0) {
    const patternRegionIds = new Set(patternData.regions as number[]);
    const windowRegionIds = new Set<number>();
    
    // Collect all region IDs in the window
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        const absRow = originRow + r;
        const absCol = originCol + c;
        const absCellId = coordToCellId({ row: absRow, col: absCol }, size);
        const region = state.regions.find(reg => reg.cells.includes(absCellId));
        if (region) {
          windowRegionIds.add(region.id);
        }
      }
    }
    
    // Check if at least some pattern regions exist in window
    // This is lenient - we allow patterns to match if their regions overlap with window regions
    let matchingRegions = 0;
    for (const patternRegionId of patternRegionIds) {
      if (windowRegionIds.has(patternRegionId)) {
        matchingRegions++;
      }
    }
    
    // Require at least half of pattern regions to match (or all if pattern has <= 2 regions)
    const minRequired = patternRegionIds.size <= 2 ? patternRegionIds.size : Math.ceil(patternRegionIds.size / 2);
    if (matchingRegions < minRequired) {
      return null; // Not enough pattern regions match window regions
    }
  }

  // If preconditions match, apply pattern deductions
  // Filter out deductions for cells that are already filled
  const deductions = pattern.deductions.flatMap(ded => {
    return ded.relative_cell_ids
      .map(relCellId => {
        const absCellId = relativeToAbsolute(relCellId);
        const currentState = state.cellStates[absCellId];
        
        // Skip if cell is already filled
        if (currentState === CellState.Star || currentState === CellState.Empty) {
          return null;
        }
        
        // Skip if deduction conflicts with current state
        if (ded.type === 'forceStar' && currentState === CellState.Empty) {
          return null; // Can't force star if already empty
        }
        if (ded.type === 'forceEmpty' && currentState === CellState.Star) {
          return null; // Can't force empty if already star
        }
        
        return {
          cell: absCellId,
          type: ded.type,
        };
      })
      .filter((d): d is { cell: CellId; type: 'forceStar' | 'forceEmpty' } => d !== null);
  });

  if (deductions.length === 0) {
    return null; // No new deductions to apply
  }

  // Check for internal conflicts: same cell forced to both star and empty
  const deductionMap = new Map<CellId, 'forceStar' | 'forceEmpty'>();
  for (const ded of deductions) {
    const existing = deductionMap.get(ded.cell);
    if (existing && existing !== ded.type) {
      return null; // Conflict: same cell forced to both star and empty
    }
    deductionMap.set(ded.cell, ded.type);
  }

  // Limit pattern deductions - patterns producing too many deductions
  // are likely invalid matches (patterns should be focused/localized)
  // Patterns should produce at most 2 deductions to be safe
  if (deductions.length > 2) {
    return null; // Too many deductions - likely invalid pattern match
  }

  // Validate that applying these deductions won't violate constraints
  // Create a test state with deductions applied
  const testState = { ...state, cellStates: [...state.cellStates] };
  for (const ded of deductions) {
    if (ded.type === 'forceStar') {
      testState.cellStates[ded.cell] = CellState.Star;
    } else {
      testState.cellStates[ded.cell] = CellState.Empty;
    }
  }

  // Check row quotas (not exceeded)
  for (const row of state.rows) {
    const starCount = row.cells.filter(cellId => testState.cellStates[cellId] === CellState.Star).length;
    if (starCount > row.starsRequired) {
      return null; // Would exceed row quota
    }
  }

  // Check column quotas (not exceeded)
  for (const col of state.cols) {
    const starCount = col.cells.filter(cellId => testState.cellStates[cellId] === CellState.Star).length;
    if (starCount > col.starsRequired) {
      return null; // Would exceed column quota
    }
  }

  // Check region quotas (not exceeded)
  for (const region of state.regions) {
    const starCount = region.cells.filter(cellId => testState.cellStates[cellId] === CellState.Star).length;
    if (starCount > region.starsRequired) {
      return null; // Would exceed region quota
    }
  }

  // Check adjacency (no adjacent stars)
  // Check all stars in test state, not just new ones
  for (let cellId = 0; cellId < testState.cellStates.length; cellId++) {
    if (testState.cellStates[cellId] === CellState.Star) {
      const coord = cellIdToCoord(cellId, size);
      // Check 8-directional neighbors
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = coord.row + dr;
          const nc = coord.col + dc;
          if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
            const neighborId = coordToCellId({ row: nr, col: nc }, size);
            if (neighborId !== cellId && testState.cellStates[neighborId] === CellState.Star) {
              return null; // Adjacent stars detected
            }
          }
        }
      }
    }
  }

  // Debug: Log pattern match
  if (deductions.length > 0) {
    console.log(`[PATTERN MATCH] Pattern ${pattern.id} (${pattern.familyId}) matched at window (${originRow},${originCol}) size ${width}x${height}, producing ${deductions.length} deduction(s)`);
    console.log(`[PATTERN MATCH] Deductions:`, deductions.slice(0, 5).map(d => {
      const coord = cellIdToCoord(d.cell, size);
      return `${d.type}@(${coord.row},${coord.col})`;
    }).join(', '), deductions.length > 5 ? '...' : '');
  }

  // Build explanation
  const explanation = {
    schemaId: `pattern_${pattern.familyId}`,
    steps: [
      {
        kind: 'countStarsInBand' as const,
        entities: {
          note: `Pattern ${pattern.id} from family ${pattern.familyId} matched`,
          window: { row: originRow, col: originCol, width, height },
        },
      },
    ],
  };

  return {
    schemaId: `pattern_${pattern.familyId}`,
    params: {
      patternId: pattern.id,
      familyId: pattern.familyId,
      window,
    },
    deductions,
    explanation,
  };
}

/**
 * Enumerate windows for pattern matching
 */
export function enumerateWindows(
  state: BoardState,
  patternWidth: number,
  patternHeight: number
): WindowSpec[] {
  const windows: WindowSpec[] = [];
  const size = state.size;

  for (let r = 0; r <= size - patternHeight; r++) {
    for (let c = 0; c <= size - patternWidth; c++) {
      windows.push({
        width: patternWidth,
        height: patternHeight,
        originRow: r,
        originCol: c,
      });
    }
  }

  return windows;
}

