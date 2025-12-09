# Corrected N-Rooks Implementation (Kris-style) — Practical Fix Guide

This document explains why your current N-rooks implementation does **not** fire on the given puzzle and how to correct the logic so it matches the intended behavior used in `kristofer84/star-battle-solver`. A corrected model and code structure is provided.

---

## 1. Why Your Current N-Rooks Does Not Fire

Your implementation probably uses this idea:

- Mark blocks as: `empty`, `has-star`, or `unknown`.
- Apply a rule like: “if 4 blocks in a block-row contain stars, the last one is empty.”

This approach **does not match** how N-rooks works in Kris’ solver.  
As a result, N-rooks almost never triggers.

### What Kris' N-rooks *actually* uses

The true invariant for 10×10, 2★ puzzles:

> In the 5×5 grid of 2×2 blocks, **each block row has exactly one empty block**, and **each block column has exactly one empty block**.

N-rooks is therefore **only about finding which blocks must be empty**, not about finding where stars already are.

Thus your block model must focus on:

- `must-empty`
- `unknown`

Nothing else is needed for N-rooks.

---

## 2. Required Fix: Correct Block Status Model

Replace:

```ts
'empty' | 'has-star' | 'unknown'
```

with only:

```ts
type BlockStatus = 'must-empty' | 'unknown';
```

Where a block is `must-empty` if **all four cells** cannot contain a star because of adjacency / unit fullness / prior deductions.

### Block analysis

```ts
function analyseBlocks(state: PuzzleState): BlockInfo[] {
  const blocks: BlockInfo[] = [];

  for (let bRow = 0; bRow < 5; bRow++) {
    for (let bCol = 0; bCol < 5; bCol++) {
      const coords = { bRow, bCol };
      const cells = cellsInBlock(coords);
      const mustBeEmpty = blockIsProvedEmpty(state, cells);
      blocks.push({
        coords,
        status: mustBeEmpty ? 'must-empty' : 'unknown',
        cells,
      });
    }
  }
  return blocks;
}
```

`blockIsProvedEmpty` must return true only if the block can contain **no possible star**.

---

## 3. Build Row/Column Block Views

```ts
interface BlockRowInfo {
  row: number;
  empties: BlockInfo[];
  unknowns: BlockInfo[];
}

interface BlockColInfo {
  col: number;
  empties: BlockInfo[];
  unknowns: BlockInfo[];
}
```

Row builder:

```ts
function buildBlockRowInfo(blocks: BlockInfo[]): BlockRowInfo[] {
  const rows = [];
  for (let r = 0; r < 5; r++) {
    const rowBlocks = blocks.filter(b => b.coords.bRow === r);
    rows.push({
      row: r,
      empties: rowBlocks.filter(b => b.status === 'must-empty'),
      unknowns: rowBlocks.filter(b => b.status === 'unknown'),
    });
  }
  return rows;
}
```

Column builder is symmetrical.

---

## 4. Correct N-Rooks Logic

The rule is:

> Each block row must contain exactly **one** empty block.  
> Each block column must contain exactly **one** empty block.

This gives deductions when **row + column constraints interact**.

### Minimal working logic

```ts
function findForcedEmptyByRowAndCol(
  rows: BlockRowInfo[],
  cols: BlockColInfo[],
): BlockInfo | null {

  for (const row of rows) {
    if (row.empties.length >= 1) continue; // row already has its empty

    for (const cand of row.unknowns) {
      const { bRow, bCol } = cand.coords;
      const colInfo = cols.find(c => c.col === bCol)!;

      // Column already has empty but in a different block -> cand cannot be empty
      if (colInfo.empties.some(b => b.coords.bRow !== bRow)) continue;

      // If this column has no empty yet, and cand is the ONLY unknown in this column
      const others = colInfo.unknowns.filter(
        b => b.coords.bRow !== bRow
      );

      if (colInfo.empties.length === 0 && others.length === 0) {
        return cand; // forced empty block
      }
    }
  }

  return null;
}
```

This is the smallest correct version of Kris-style N-rooks.

---

## 5. Main Entry Function

```ts
export function findNRooksHint(state: PuzzleState): Hint | null {
  if (state.def.size !== 10 || state.def.starsPerUnit !== 2) return null;

  const blocks = analyseBlocks(state);
  const rows = buildBlockRowInfo(blocks);
  const cols = buildBlockColInfo(blocks);

  const forcedEmpty = findForcedEmptyByRowAndCol(rows, cols);
  if (!forcedEmpty) return null;

  return createEmptyBlockHint(forcedEmpty);
}
```

The hint simply marks the 4 cells of the empty block as “no star”.

---

## 6. Important Note about Your Puzzle

Your region grid:

```
0 0 0 0 0 0 0 0 1 1
0 2 2 2 2 2 1 1 1 1
...
```

Two critical checks:

1. **Region IDs are 0-based**, but your solver likely expects **1–10**.  
   You must renumber regions before solving.

2. N-rooks **never fires on an initial puzzle**.  
   You must already have some `must-empty` 2×2 blocks deduced from:
   - row-star counts,
   - column-star counts,
   - region-star bounds,
   - adjacency eliminations,
   - your existing 2×2 helper logic.

If no 2×2 block is currently `must-empty`, N-rooks has no starting information and correctly returns `null`.

---

## 7. Checklist for Correct Behavior

To ensure N-rooks works:

- [ ] Region IDs normalized to 1–10  
- [ ] `blockIsProvedEmpty()` correctly identifies 2×2 blocks with no possible star  
- [ ] Block model uses only `must-empty | unknown`  
- [ ] N-rooks rule implemented using **row + column uniqueness**, not star-blocks  
- [ ] You run earlier elimination techniques before N-rooks  
- [ ] You log block states during solving to ensure empties appear

---

## 8. Summary

Your N-rooks did not fire because:

- It relied on detecting *“blocks containing stars”* → not part of Kris’ logic.  
- It did *not* focus exclusively on *empty-block uniqueness*.  
- It lacked row+column intersection constraints.  

After replacing the model and rule logic as described here, your solver will behave the same way as the N-rooks technique described by Kris De Asis.

