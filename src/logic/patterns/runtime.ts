/**
 * Runtime pattern matching system
 */

import type { BoardState } from '../schemas/model/types';
import type { SchemaApplication, SchemaContext } from '../schemas/types';
import { loadPatterns, filterPatternsByPuzzle, getPatternsByFamily } from './loader';
import { matchPatternInWindow, enumerateWindows } from './matcher';

// Cache loaded patterns
let cachedPatterns: ReturnType<typeof loadPatterns> | null = null;

/**
 * Ensure patterns are loaded
 */
function ensurePatternsLoaded(): ReturnType<typeof loadPatterns> {
  if (cachedPatterns === null) {
    cachedPatterns = loadPatterns();
  }
  return cachedPatterns;
}

/**
 * Apply pattern library to board state
 * Returns true if any pattern matched (progress made)
 */
export function applyPatternLibrary(
  state: BoardState,
  explanations: any[]
): boolean {
  const patterns = ensurePatternsLoaded();

  if (patterns.length === 0) {
    return false; // No patterns loaded
  }

  // Filter patterns by puzzle parameters
  const matchingPatterns = filterPatternsByPuzzle(
    patterns,
    state.size,
    state.starsPerLine
  );

  if (matchingPatterns.length === 0) {
    return false;
  }

  // Group patterns by family for priority ordering
  const families = ['A1_rowBand_regionBudget', 'A2_colBand_regionBudget', 'C2_cages_regionQuota'];
  
  for (const familyId of families) {
    const familyPatterns = getPatternsByFamily(matchingPatterns, familyId);
    
    for (const pattern of familyPatterns) {
      // Enumerate windows for this pattern size
      const windows = enumerateWindows(
        state,
        pattern.window_width,
        pattern.window_height
      );

      for (const window of windows) {
        const application = matchPatternInWindow(pattern, window, state);
        
        if (application) {
          // Pattern matched - return first match
          // In full implementation, we'd collect all matches
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Get all pattern applications for a state
 */
export function getAllPatternApplications(
  ctx: SchemaContext
): SchemaApplication[] {
  const applications: SchemaApplication[] = [];
  const { state } = ctx;

  const patterns = ensurePatternsLoaded();
  const matchingPatterns = filterPatternsByPuzzle(
    patterns,
    state.size,
    state.starsPerLine
  );

  if (matchingPatterns.length === 0) {
    return applications;
  }

  // Try matching each pattern
  for (const pattern of matchingPatterns) {
    const windows = enumerateWindows(
      state,
      pattern.window_width,
      pattern.window_height
    );

    for (const window of windows) {
      const application = matchPatternInWindow(pattern, window, state);
      if (application) {
        applications.push(application);
        // For now, return first match per pattern
        // Full implementation might want all matches
        break;
      }
    }
  }

  return applications;
}

