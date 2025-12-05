# Feature Request: Add Support for “Obligatory Block” Constraints (minStars > 0)

## Objective

Enable the solver to make deductions like:

> “Region R must place its only star (in a given row band) inside this specific 2×2 block,”
> and therefore eliminate all other candidates in that region/band.

This is currently **not found** because `blockConstraints` always have `minStars = 0`, so the `subset-constraint-squeeze` technique never receives a “small” constraint with a positive lower bound.

To fix this, the solver must be able to produce **block constraints where `minStars = 1`** (or higher) in specific situations.

---

## Required Additions

### 1. Introduce a mechanism for generating *obligatory* block constraints

Add a new way to produce a constraint of the form:

```ts
Constraint {
    cells: BitSet,
    minStars: 1,
    maxStars: 1,
    source: "block-forced",
}
```

for a 2×2 block (or block ∩ region) **when existing logic shows this block must contain a star**.

This “obligatory block” constraint is what allows the generic subset-squeeze engine to work.

---

## How this integrates with existing logic

### Existing:

* Region-band constraints can already produce `minStars = maxStars = 1` (e.g., “Region C in rows 1–3 has exactly one star”).
* `subset-constraint-squeeze` performs:

```ts
if (small.minStars === large.maxStars && small.minStars > 0)
    eliminate(large.cells \ small.cells)
```

### Missing:

* A 2×2 block is never `small.minStars > 0`, because `blockConstraints` are built with:

```ts
minStars = 0;
maxStars = 0 or 1;
```

Therefore, no block can currently serve as the “small” constraint.

### After implementation:

Once an obligatory block constraint is added:

* `small` = this block constraint (`minStars = 1`)
* `large` = region-band constraint (`maxStars = 1`)
* `small.cells ⊆ large.cells`

→ `subset-constraint-squeeze` will automatically eliminate all outside cells.

This produces the expected deduction for puzzles like the earlier example.

---

## Recommended Implementation Path

###  Extend `blockConstraints`

1. Keep the current “capacity ≤ 1” generation.
2. Add a second pass that:

   * Detects the pattern,
   * Upgrades selected blocks to `minStars = 1`, `maxStars = 1`.
3. Let the existing subset-squeeze technique consume those constraints automatically.


---

## Success Criterion

After implementing obligatory block constraints:

* For the example puzzle, the solver should:

  * Identify the 2×2 forced block,
  * Pair it with the region-band constraint,
  * Use subset-squeeze to eliminate all other candidate cells of that region in that band.

No further code in `subset-constraint-squeeze` must change.
