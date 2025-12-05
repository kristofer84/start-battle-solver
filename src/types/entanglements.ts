/**
 * Type definitions for entanglement pattern files
 */

export type CoordsTuple = [number, number];

/**
 * File Type A: Pair-based entanglement patterns
 */
export interface PairEntanglementPattern {
  initial_stars: CoordsTuple[]; // length = initial_star_count
  compatible_solutions: number; // how many full solutions match these initial stars
  forced_empty?: CoordsTuple[]; // cells that are always empty in those solutions
  forced_star?: CoordsTuple[]; // cells that are always stars (optional)
}

export interface PairEntanglementFile {
  board_size: number;
  stars_per_row: number;
  stars_per_column: number;
  initial_star_count: number;
  total_solutions: number;
  patterns: PairEntanglementPattern[];
}

/**
 * File Type B: Triple entanglement patterns (canonical)
 */
export interface TripleRule {
  canonical_stars: CoordsTuple[]; // length = initial_stars
  canonical_candidate: CoordsTuple;
  constraint_features: string[]; // empty for unconstrained rules
  forced: boolean; // always true in this context
  occurrences: number; // number of pattern instances that produced this rule
}

export interface TripleEntanglementFile {
  board_size: number;
  initial_stars: number;
  unconstrained_rules: TripleRule[];
  constrained_rules: TripleRule[];
}

/**
 * Metadata extracted from an entanglement spec file
 */
export interface EntanglementSpecMeta {
  id: string; // derived from filename
  boardSize: number;
  starsPerRow?: number;
  starsPerColumn?: number;
  initialStars: number; // from initial_star_count or initial_stars
  hasPairPatterns: boolean;
  hasTriplePatterns: boolean;
  tripleHasConstrained: boolean;
}

/**
 * Loaded entanglement spec with raw data
 */
export interface LoadedEntanglementSpec extends EntanglementSpecMeta {
  pairData?: PairEntanglementFile;
  tripleData?: TripleEntanglementFile;
}
