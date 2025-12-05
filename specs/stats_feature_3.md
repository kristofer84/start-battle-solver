Here is a short, concrete request you can give to your code bot.

---

**Task: Add “forced 2×2 block” constraints to `stats.ts`**

Context: repo `star-battle-solver`, TypeScript.
The solver already has:

* `Constraint` with `{ cells, minStars, maxStars, source, description }` in `src/logic/stats.ts`.
* `Stats` with `rowConstraints`, `colConstraints`, `regionConstraints`, `regionBandConstraints`, `blockConstraints`.
* `computeStats(state: PuzzleState): Stats` and `allConstraints(stats: Stats): Constraint[]`.
* A technique `subsetConstraintSqueeze` that uses these constraints.

I want to add logic so that the stats layer can say:

> “This specific 2×2 block must contain exactly 1 star”

as a `Constraint` with `minStars = 1`, `maxStars = 1`, `source = 'block-forced'`.

This should then be usable by `subsetConstraintSqueeze` together with an existing `region-band` constraint (also with `minStars = maxStars = 1`) to eliminate all other cells in that band.

### Requirements

1. **Work in `src/logic/stats.ts`.**
   You can add helpers here, but do not change public types or exports except where needed to include the new constraints.

2. **Define a helper that infers “forced 2×2 blocks” from bands.**

   Implement a function like:

   ```ts
   function inferForcedBlocksFromBands(
     state: PuzzleState,
     supporting: SupportingConstraints, // row/col/region/regionBand constraints
   ): Constraint[] { ... }
   ```

   Behaviour:

   * Look at `supporting.regionBandConstraints`.

   * Filter bands `b` with:

     * `b.minStars === 1` and `b.maxStars === 1`,
     * `b.cells.length > 1` (more than one candidate).

   * For each such band:

     * Let `bandCandidates = b.cells`.

     * Compute all **individually legal** positions for the remaining star in this band:

       ```ts
       const placements = enumerateLegalBandPlacements(state, bandCandidates);
       ```

       where `enumerateLegalBandPlacements`:

       * Returns all `cell ∈ bandCandidates` that pass `isLegalSingleStarPlacement(state, cell)`.

       `isLegalSingleStarPlacement` should check, for that one hypothetical extra star:

       * Cell is currently empty.
       * Row is not already full (`starsPerUnit`).
       * Column is not already full.
       * Region is not already full.
       * No existing star is adjacent (8 neighbours).
       * Placing a star here does not make any 2×2 block contain more than 1 star (use existing `countStars` with appropriate 2×2 blocks).

     * If `placements.length === 0`, skip this band.

     * For each 2×2 block in the grid:

       ```ts
       const block: Coords[] = [
         { row: r, col: c },
         { row: r, col: c + 1 },
         { row: r + 1, col: c },
         { row: r + 1, col: c + 1 },
       ];
       ```

       * Consider only blocks that intersect the band:

         ```ts
         const blockBandCells = block.filter((bc) =>
           bandCandidates.some((b) => b.row === bc.row && b.col === bc.col),
         );
         if (blockBandCells.length === 0) continue;
         ```

       * Check if **every** placement lies inside this block:

         ```ts
         const allPlacementsInBlock = placements.every((p) =>
           block.some((bc) => bc.row === p.row && bc.col === p.col),
         );
         if (!allPlacementsInBlock) continue;
         ```

       * If `allPlacementsInBlock` is true, then this block is forced for that band.
         Create a `Constraint`:

         ```ts
         const cells = emptyCells(state, block).filter((c) =>
           bandCandidates.some((b) => b.row === c.row && b.col === c.col),
         );

         if (cells.length > 0) {
           results.push({
             cells,
             minStars: 1,
             maxStars: 1,
             source: 'block-forced',
             description: `Forced 2×2 block inside ${band.description}`,
           });
         }
         ```

   * Return the collected `Constraint[]`.

3. **Wire it into `computeStats`.**

   In `computeStats(state)`:

   * After computing `rowConstraints`, `colConstraints`, `regionConstraints`, and `regionBandConstraints`, construct a `SupportingConstraints` object.
   * Call the existing `blockConstraints(state, supporting)` (if present in the file).
   * Also call `inferForcedBlocksFromBands(state, supporting)` and append its results to `blockConstraints`.

   For example:

   ```ts
   const supporting: SupportingConstraints = {
     rowConstraints,
     colConstraints,
     regionConstraints,
     regionBandConstraints,
   };

   const blockConstraintsList = blockConstraints(state, supporting);
   const blockForcedFromBands = inferForcedBlocksFromBands(state, supporting);

   return {
     rowConstraints,
     colConstraints,
     regionConstraints,
     regionBandConstraints,
     blockConstraints: [...blockConstraintsList, ...blockForcedFromBands],
   };
   ```

4. **Do not change `subsetConstraintSqueeze`.**

   It already looks for pairs of constraints where:

   * `small.cells ⊆ large.cells`,
   * `small.minStars === large.maxStars > 0`.

   The new `block-forced` constraints (minStars = 1, maxStars = 1) should naturally pair with a matching `region-band` constraint (minStars = 1, maxStars = 1) and allow the technique to eliminate all other cells of that band.

5. **Make sure TypeScript compiles.**

   * Use existing types `PuzzleState` and `Coords`.
   * Use existing helpers: `emptyCells`, `countStars`, `rowCells`, `colCells`, `regionCells`, etc.

---

Please implement these functions and wiring so that the stats layer can now express “this 2×2 must contain exactly 1 star” as `block-forced` constraints, and the existing `subsetConstraintSqueeze` technique can use them.
