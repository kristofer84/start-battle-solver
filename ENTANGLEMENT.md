## 1. Folder and discovery

Create a folder (relative to the solver project root) that will contain all entanglement pattern files, for example:

* `specs/entanglements/`

At runtime, the app must:

1. Enumerate all `*.json` files in this folder.
2. For each file, read and inspect the JSON to understand:

   * board size,
   * stars per row/column,
   * number of initial stars the patterns were generated from,
   * whether it contains pair patterns, triple patterns, or both.

No hardcoded list of filenames. Everything is discovered from the JSON contents.

---

## 2. Coordinate conventions (shared by all files)

Across all entanglement files:

* Coordinates are **0-based**: `[row, col]`.
* `row = 0` is the top row; `col = 0` is the leftmost column.
* For **canonical** patterns, coordinates may be outside `[0, board_size-1]` because they represent relative shapes, not absolute board positions (e.g. `[-2, 6]`, `[0, -3]`).
* When using these patterns on a real board, the solver must:

  * Apply a D4 symmetry (rotation/reflection),
  * Apply a translation offset,
  * Check that all transformed coordinates are in bounds.

---

## 3. File type A: pair-based entanglement patterns

Example filename:
`10x10-2star-entanglements.json`

### 3.1. JSON structure

The top-level object has this shape: 

```json
{
  "board_size": 10,
  "stars_per_row": 2,
  "stars_per_column": 2,
  "initial_star_count": 2,
  "total_solutions": 146510,
  "patterns": [
    {
      "initial_stars": [[0, 0], [0, 3]],
      "compatible_solutions": 2143,
      "forced_empty": [[2, 6], [2, 8]],
      "forced_star": [[...], ...]      // optional; may be missing or empty
    },
    ...
  ]
}
```

Fields:

* `board_size: number`

  * The puzzle board is `board_size × board_size`.

* `stars_per_row: number`, `stars_per_column: number`

  * Number of stars per row/column for the puzzle (usually equal in Star Battle).

* `initial_star_count: number`

  * How many **initial** stars were fixed when generating these patterns (for this file, `2`).

* `total_solutions: number`

  * Total number of full puzzle solutions used for this analysis.

* `patterns: Pattern[]`

  * Each entry describes how a specific set of initial stars constrains the board.

`Pattern` structure:

```ts
interface PairEntanglementPattern {
  initial_stars: [number, number][];  // length = initial_star_count
  compatible_solutions: number;       // how many full solutions match these initial stars
  forced_empty?: [number, number][];  // cells that are always empty in those solutions
  forced_star?: [number, number][];   // cells that are always stars (optional)
}
```

Notes for the solver:

* `initial_stars` are **absolute** board coordinates (within `0..board_size-1`).
* `forced_empty` and `forced_star` are also absolute; they reflect deductions for this exact placement, not canonical shapes.
* This file type is useful for:

  * Diagnostic / visualization (“show me what this 2-star pattern implies”), and
  * Potentially seeding more advanced, canonical rules if needed.

---

## 4. File type B: triple entanglement patterns (canonical, triple-based)

Example filename:
`10x10-2star-entanglements-triple-entanglements.json` 

This file contains **canonical triple entanglements**:
Z initial stars + 1 candidate cell → forced or not, optionally with constraints.

### 4.1. JSON structure

Top-level object:

```json
{
  "board_size": 10,
  "initial_stars": 2,
  "unconstrained_rules": [ ... ],
  "constrained_rules": [ ... ]
}
```

Fields:

* `board_size: number`

  * Same meaning as above.

* `initial_stars: number`

  * Number of initial stars used in triple analysis (for this file, `2`).

* `unconstrained_rules: TripleRule[]`

  * Triple entanglements that are **always** forced whenever the canonical geometry fits on the board (no extra constraints).

* `constrained_rules: TripleRule[]`

  * Triple entanglements that are forced **only** under certain feature conditions (e.g. candidate cell in ring 1, etc.).
  * In the sample file, this array is currently empty, but the solver must be prepared to consume it.

### 4.2. `TripleRule` structure

Each rule in `unconstrained_rules` or `constrained_rules` has the same shape: 

```json
{
  "canonical_stars": [
    [0, 0],
    [2, 3]
  ],
  "canonical_candidate": [0, -3],
  "constraint_features": [],
  "forced": true,
  "occurrences": 128
}
```

Type:

```ts
interface TripleRule {
  canonical_stars: [number, number][]; // length = initial_stars
  canonical_candidate: [number, number];
  constraint_features: string[];       // empty for unconstrained rules
  forced: boolean;                     // always true in this context
  occurrences: number;                 // number of pattern instances that produced this rule
}
```

Semantics:

* `canonical_stars`

  * The relative geometry of the initial stars in a **canonical coordinate system**.
  * Can be used as a template: apply a rotation/reflection and translation to match actual stars on the board.

* `canonical_candidate`

  * The relative position (same canonical system) of the candidate cell that is forced by this geometry.

* `constraint_features`

  * Names of boolean features that must be true for the rule to apply.
  * For `unconstrained_rules`, this array is empty (`[]`).
  * For `constrained_rules`, it may contain entries such as:

    * `"candidate_on_outer_ring"`
    * `"candidate_in_ring_1"`
    * `"candidate_in_same_row_as_any_star"`
    * etc., depending on how the entanglement-calculator was configured.

* `forced`

  * Always `true` for entanglements (this candidate is forced empty/star in every compatible solution under those conditions).

* `occurrences`

  * How many instances in the raw data contributed to this canonical rule. Helps estimate reliability.

Notes for the solver:

* The solver does **not** recompute features; it only uses `constraint_features` as labels to evaluate the current board & candidate cell. It must implement feature functions with the same names used here.
* Canonical coordinates can be outside `[0, board_size-1]` and must be mapped via symmetry + translation to real board cells.

---

## 5. How the solver should use these formats

### 5.1. Discovery and metadata

For each JSON file in `specs/entanglements/`:

1. Parse the object.

2. If it has a `patterns` array → treat it as a **pair-pattern file** (File type A).

3. If it has `unconstrained_rules` and `constrained_rules` → treat it as a **triple-pattern file** (File type B).

4. Extract metadata:

   ```ts
   interface EntanglementSpecMeta {
     id: string;          // derived from filename
     boardSize: number;
     starsPerRow?: number;
     starsPerColumn?: number;
     initialStars: number; // from initial_star_count or initial_stars
     hasPairPatterns: boolean;
     hasTriplePatterns: boolean;
     tripleHasConstrained: boolean;
   }
   ```

5. Keep a mapping from `id` to the **raw parsed JSON** for later use.

### 5.2. Visualization / learning view

Using the above formats, the “Entanglements” view should:

* List all specs (`EntanglementSpecMeta`) and let the user pick one.
* For pair patterns (`patterns`):

  * Show the initial stars and their forced empties/stars on a 10×10 (or N×N) board.
* For triple rules (`unconstrained_rules` and `constrained_rules`):

  * Render a small preview:

    * Stars at `canonical_stars` (normalized into a compact grid).
    * Candidate cell at `canonical_candidate`.
    * Highlight constrained vs unconstrained rules, show `constraint_features` and `occurrences`.

### 5.3. Solver technique integration

The entanglement technique module must:

1. For the current puzzle (boardSize N, stars per row/col S), filter entanglement specs to those with:

   * `board_size === N`,
   * `stars_per_row === S` (if present),
   * appropriate `initial_star_count` / `initial_stars` (e.g. 2 for 2-star entanglements).

2. For each **triple** rule, try to map `canonical_stars` onto actual stars on the board via:

   * each D4 rotation/reflection,
   * each possible translation such that transformed stars:

     * match actual placed stars,
     * are in bounds.

3. For each valid mapping:

   * Transform `canonical_candidate` to an absolute cell.
   * Evaluate all named `constraint_features` for this candidate and the current board state.
   * If all constraints are satisfied and the candidate cell is currently undecided, treat it as a forced cell (empty or star, depending on the rule convention).

4. For pair patterns (optional, file type A):

   * If user has placed initial stars matching a `Pattern.initial_stars` configuration, apply that pattern’s `forced_empty` / `forced_star` to generate hints.
