/**
 * Loader for entanglement pattern files
 * Discovers and parses JSON files from specs/entanglements/
 */

import type {
  PairEntanglementFile,
  TripleEntanglementFile,
  LoadedEntanglementSpec,
  EntanglementSpecMeta,
} from '../../types/entanglements';

/**
 * Discover and load all entanglement pattern files
 * In a browser environment, we need to use dynamic imports or fetch
 */
export async function loadEntanglementSpecs(): Promise<LoadedEntanglementSpec[]> {
  const specs: LoadedEntanglementSpec[] = [];

  try {
    // In a Vite environment, we can use import.meta.glob to discover files
    // This will work at build time and runtime
    // Use relative path from project root
    const files = import.meta.glob('../../specs/entanglements/*.json', {
      eager: false,
      import: 'default',
    });

    for (const [path, importFn] of Object.entries(files)) {
      try {
        const data = await importFn() as unknown;
        // Extract filename from path (handle both / and \ separators)
        const pathParts = path.split(/[/\\]/);
        const filename = pathParts[pathParts.length - 1] || path;
        const id = filename.replace('.json', '');

        const spec = parseEntanglementFile(id, data);
        if (spec) {
          specs.push(spec);
        }
      } catch (error) {
        console.warn(`Failed to load entanglement file ${path}:`, error);
      }
    }
  } catch (error) {
    console.warn('Failed to discover entanglement files:', error);
  }

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
