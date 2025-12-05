/**
 * Loader for entanglement pattern files
 * Loads JSON files from src/specs/entanglements/ via explicit imports
 */

import type {
  PairEntanglementFile,
  TripleEntanglementFile,
  LoadedEntanglementSpec,
  EntanglementSpecMeta,
} from '../../types/entanglements';
import { entanglementFiles } from '../../specs/entanglements';

/**
 * Discover and load all entanglement pattern files
 * Uses explicit imports from the index file for reliable loading
 */
export async function loadEntanglementSpecs(): Promise<LoadedEntanglementSpec[]> {
  const startTime = performance.now();
  const specs: LoadedEntanglementSpec[] = [];

  console.log('[ENTANGLEMENT DEBUG] Loading entanglement specs from src/specs/entanglements/...');
  console.log(`[ENTANGLEMENT DEBUG] Found ${entanglementFiles.length} entanglement file(s) to load`);

  let loadedCount = 0;
  let pairCount = 0;
  let tripleCount = 0;

  for (const { id, data } of entanglementFiles) {
    try {
      const fileStartTime = performance.now();
      const spec = parseEntanglementFile(id, data as unknown);
      
      if (spec) {
        specs.push(spec);
        loadedCount += 1;
        if (spec.hasPairPatterns) pairCount += 1;
        if (spec.hasTriplePatterns) tripleCount += 1;
        
        const fileTime = performance.now() - fileStartTime;
        console.log(`[ENTANGLEMENT DEBUG] Loaded ${id}: ${spec.boardSize}x${spec.boardSize}, ${spec.hasPairPatterns ? 'pair' : ''}${spec.hasPairPatterns && spec.hasTriplePatterns ? '+' : ''}${spec.hasTriplePatterns ? 'triple' : ''} patterns (${fileTime.toFixed(2)}ms)`);
      } else {
        console.warn(`[ENTANGLEMENT DEBUG] Failed to parse ${id}: unrecognized format`);
      }
    } catch (error) {
      console.warn(`[ENTANGLEMENT DEBUG] Failed to load entanglement file ${id}:`, error);
    }
  }

  const totalTime = performance.now() - startTime;
  console.log(`[ENTANGLEMENT DEBUG] Spec loading complete: ${loadedCount}/${entanglementFiles.length} files loaded (${pairCount} with pairs, ${tripleCount} with triples) in ${totalTime.toFixed(2)}ms`);

  return specs;
}

/**
 * Parse a raw JSON object into a LoadedEntanglementSpec
 */
function parseEntanglementFile(
  id: string,
  data: unknown
): LoadedEntanglementSpec | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const obj = data as Record<string, unknown>;

  // Check if it's a pair pattern file (has 'patterns' array)
  if (Array.isArray(obj.patterns)) {
    return parsePairFile(id, obj as unknown as PairEntanglementFile);
  }

  // Check if it's a triple pattern file (has 'unconstrained_rules' and 'constrained_rules')
  if (
    Array.isArray(obj.unconstrained_rules) &&
    Array.isArray(obj.constrained_rules)
  ) {
    return parseTripleFile(id, obj as unknown as TripleEntanglementFile);
  }

  return null;
}

/**
 * Parse a pair-based entanglement file
 */
function parsePairFile(
  id: string,
  data: PairEntanglementFile
): LoadedEntanglementSpec {
  const meta: EntanglementSpecMeta = {
    id,
    boardSize: data.board_size,
    starsPerRow: data.stars_per_row,
    starsPerColumn: data.stars_per_column,
    initialStars: data.initial_star_count,
    hasPairPatterns: true,
    hasTriplePatterns: false,
    tripleHasConstrained: false,
  };

  return {
    ...meta,
    pairData: data,
  };
}

/**
 * Parse a triple-based entanglement file
 */
function parseTripleFile(
  id: string,
  data: TripleEntanglementFile
): LoadedEntanglementSpec {
  const meta: EntanglementSpecMeta = {
    id,
    boardSize: data.board_size,
    initialStars: data.initial_stars,
    hasPairPatterns: false,
    hasTriplePatterns: true,
    tripleHasConstrained: data.constrained_rules.length > 0,
  };

  return {
    ...meta,
    tripleData: data,
  };
}

/**
 * Filter specs by puzzle parameters
 */
export function filterSpecsByPuzzle(
  specs: LoadedEntanglementSpec[],
  boardSize: number,
  starsPerUnit: number,
  initialStarCount?: number
): LoadedEntanglementSpec[] {
  return specs.filter((spec) => {
    if (spec.boardSize !== boardSize) return false;
    if (spec.starsPerRow !== undefined && spec.starsPerRow !== starsPerUnit) {
      return false;
    }
    if (
      spec.starsPerColumn !== undefined &&
      spec.starsPerColumn !== starsPerUnit
    ) {
      return false;
    }
    if (
      initialStarCount !== undefined &&
      spec.initialStars !== initialStarCount
    ) {
      return false;
    }
    return true;
  });
}

