# Make schema-based hints sound, fast, and fully explained

This repo’s **schema-based technique** can produce valuable hints, but it can also:
- take too long (heavy analysis), and
- emit *unsound* “forced” placements (a move that is valid, but **not logically forced**).

This plan converts schema-based hints into **(1) candidate proposals + (2) main-solver verification with a proof**.
The result is:
- **No faulty forced hints**
- **Consistent user-facing explanations for every hint**
- **Better performance** (verify only a small number of candidate cells; cache proofs)

All steps below are written to be implementable without placeholders.

---

## 0) Goal and definitions

A **forced** deduction means:

- “Cell X must be a star” is true **iff** there are **zero** valid puzzle completions when you assume “X is NOT a star”.
- “Cell X must be empty” is true **iff** there are **zero** valid puzzle completions when you assume “X IS a star”.

Verification must be **sound**:
- If the search times out or stops early, you must treat it as **inconclusive** and NOT emit a forced hint.

---

## 1) Add a verifier module for schema candidates

### 1.1 Create a new file

Create:

`src/logic/schemas/verification/schemaHintVerifier.ts`

Add the following types and functions **exactly**.

#### Types

```ts
import type { PuzzleState } from '../../../types/puzzle';
import type { Hint, HintHighlight } from '../../../types/hints';
import type { SchemaApplication } from '../types';
import { countSolutions } from '../../search';

export type VerifiedCellAssignment = {
  row: number;
  col: number;
  value: 'star' | 'cross';
};

export type VerificationStatus =
  | 'proved'          // contradiction proven, exhaustive in the configured bounds
  | 'disproved'       // opposite assumption still allows at least one completion
  | 'inconclusive';   // timeout/cap reached, cannot conclude

export type ProofStep =
  | {
      kind: 'assumption';
      cell: { row: number; col: number };
      assumed: 'star' | 'cross';
    }
  | {
      kind: 'search-result';
      solutionsFound: number;
      timedOut: boolean;
      cappedAtMax: boolean;
      timeoutMs: number;
      maxCount: number;
    }
  | {
      kind: 'conclusion';
      conclusion: 'forced-star' | 'forced-cross' | 'not-forced';
      cell: { row: number; col: number };
    };

export type VerifiedCandidate = {
  status: VerificationStatus;
  assignment: VerifiedCellAssignment;
  proof: ProofStep[];
};

export type VerifySchemaHintOptions = {
  /** Timeout per opposite-assumption check. Keep small, e.g. 150–400ms. */
  perCheckTimeoutMs: number;
  /** Count at most this many solutions. For forcedness you only need 1. */
  maxSolutionsToFind: number; // should be 1
};
```

#### Helper: apply a single assumption to a state

```ts
function cloneCells(cells: PuzzleState['cells']): PuzzleState['cells'] {
  return cells.map(row => [...row]);
}

function applyAssumption(
  state: PuzzleState,
  cell: { row: number; col: number },
  assumed: 'star' | 'cross'
): PuzzleState | null {
  const next = cloneCells(state.cells);
  const cur = next[cell.row][cell.col];
  if (cur === assumed) return { ...state, cells: next };
  if (cur !== 'empty') return null; // conflict: already opposite mark
  next[cell.row][cell.col] = assumed;
  return { ...state, cells: next };
}
```

#### Core: verify one cell assignment by checking the opposite

```ts
export function verifyForcedCell(
  state: PuzzleState,
  assignment: VerifiedCellAssignment,
  options: VerifySchemaHintOptions
): VerifiedCandidate {
  const oppositeAssumed: 'star' | 'cross' =
    assignment.value === 'star' ? 'cross' : 'star';

  const proof: ProofStep[] = [
    { kind: 'assumption', cell: { row: assignment.row, col: assignment.col }, assumed: oppositeAssumed },
  ];

  const assumedState = applyAssumption(
    state,
    { row: assignment.row, col: assignment.col },
    oppositeAssumed
  );

  if (!assumedState) {
    // Opposite assumption immediately conflicts with current marks => forced.
    proof.push({
      kind: 'search-result',
      solutionsFound: 0,
      timedOut: false,
      cappedAtMax: false,
      timeoutMs: options.perCheckTimeoutMs,
      maxCount: options.maxSolutionsToFind,
    });
    proof.push({
      kind: 'conclusion',
      conclusion: assignment.value === 'star' ? 'forced-star' : 'forced-cross',
      cell: { row: assignment.row, col: assignment.col },
    });
    return { status: 'proved', assignment, proof };
  }

  const res = countSolutions(assumedState, {
    timeoutMs: options.perCheckTimeoutMs,
    maxCount: options.maxSolutionsToFind,
  });

  proof.push({
    kind: 'search-result',
    solutionsFound: res.count,
    timedOut: res.timedOut,
    cappedAtMax: res.cappedAtMax,
    timeoutMs: options.perCheckTimeoutMs,
    maxCount: options.maxSolutionsToFind,
  });

  // Soundness rules:
  // - Only conclude forced if we found 0 solutions AND we did NOT time out AND did NOT cap.
  if (res.count === 0 && !res.timedOut && !res.cappedAtMax) {
    proof.push({
      kind: 'conclusion',
      conclusion: assignment.value === 'star' ? 'forced-star' : 'forced-cross',
      cell: { row: assignment.row, col: assignment.col },
    });
    return { status: 'proved', assignment, proof };
  }

  // If we found at least one solution under the opposite assumption, it is not forced.
  if (res.count > 0) {
    proof.push({
      kind: 'conclusion',
      conclusion: 'not-forced',
      cell: { row: assignment.row, col: assignment.col },
    });
    return { status: 'disproved', assignment, proof };
  }

  // Otherwise it was inconclusive (timeout/cap with count==0)
  proof.push({
    kind: 'conclusion',
    conclusion: 'not-forced',
    cell: { row: assignment.row, col: assignment.col },
  });
  return { status: 'inconclusive', assignment, proof };
}
```

#### Verify a whole schema application and convert to a final Hint

We will only surface **proved** deductions.

```ts
export type VerifySchemaApplicationResult =
  | { kind: 'no-verified-deductions' }
  | { kind: 'verified-hint'; hint: Hint };

export function verifyAndBuildSchemaHint(
  state: PuzzleState,
  app: SchemaApplication,
  baseExplanation: string,
  baseHighlights: HintHighlight | undefined,
  options: VerifySchemaHintOptions
): VerifySchemaApplicationResult {
  const size = state.def.size;

  // Convert schema deductions to row/col + proposed value
  const proposed: VerifiedCellAssignment[] = app.deductions.map(d => {
    const row = Math.floor(d.cell / size);
    const col = d.cell % size;
    return { row, col, value: d.type === 'forceStar' ? 'star' : 'cross' };
  });

  // Deduplicate identical assignments and drop anything that conflicts with current state.
  const key = (a: VerifiedCellAssignment) => `${a.row},${a.col}:${a.value}`;
  const seen = new Set<string>();
  const filtered: VerifiedCellAssignment[] = [];
  for (const a of proposed) {
    const cur = state.cells[a.row][a.col];
    if (cur === a.value) continue;         // already satisfied
    if (cur !== 'empty') continue;         // conflicts with current marks, drop
    const k = key(a);
    if (seen.has(k)) continue;
    seen.add(k);
    filtered.push(a);
  }

  if (filtered.length === 0) return { kind: 'no-verified-deductions' };

  // IMPORTANT: verifying every deduction can be expensive if a schema yields many.
  // Strategy: verify in order and stop after the first proved deduction.
  // (You can extend to verify more later.)
  for (const a of filtered) {
    const verified = verifyForcedCell(state, a, options);
    if (verified.status !== 'proved') {
      continue;
    }

    // Build user-facing explanation:
    // - schema narrative (already exists)
    // - appended proof summary (always present)
    const proofLine = buildProofSummaryLine(verified.proof, a);

    const hint: Hint = {
      id: `schema-verified-${app.schemaId}-${Date.now()}`,
      kind: a.value === 'star' ? 'place-star' : 'place-cross',
      technique: 'schema-based',
      resultCells: [{ row: a.row, col: a.col }],
      explanation: `${baseExplanation}\n\nProof:\n${proofLine}`,
      highlights: mergeHighlights(baseHighlights, { cells: [{ row: a.row, col: a.col }] }),
    };

    return { kind: 'verified-hint', hint };
  }

  return { kind: 'no-verified-deductions' };
}
```

Add the two small helper functions referenced above:

```ts
function mergeHighlights(
  a: HintHighlight | undefined,
  b: HintHighlight | undefined
): HintHighlight | undefined {
  if (!a && !b) return undefined;
  const out: HintHighlight = {
    cells: [],
    rows: [],
    cols: [],
    regions: [],
  };
  for (const src of [a, b]) {
    if (!src) continue;
    if (src.cells) out.cells!.push(...src.cells);
    if (src.rows) out.rows!.push(...src.rows);
    if (src.cols) out.cols!.push(...src.cols);
    if (src.regions) out.regions!.push(...src.regions);
  }
  // drop empties
  if (!out.cells!.length) delete out.cells;
  if (!out.rows!.length) delete out.rows;
  if (!out.cols!.length) delete out.cols;
  if (!out.regions!.length) delete out.regions;
  return out.cells || out.rows || out.cols || out.regions ? out : undefined;
}

function buildProofSummaryLine(proof: ProofStep[], a: VerifiedCellAssignment): string {
  const sr = proof.find(p => p.kind === 'search-result') as Extract<ProofStep, {kind:'search-result'}> | undefined;
  const assumed = proof.find(p => p.kind === 'assumption') as Extract<ProofStep, {kind:'assumption'}> | undefined;

  const assumedText =
    assumed
      ? `Assume (${assumed.cell.row},${assumed.cell.col}) is ${assumed.assumed}.`
      : `Assume the opposite.`;

  if (!sr) return `${assumedText} No valid completion exists, so it is forced.`;

  // Always explain timeouts explicitly.
  if (sr.timedOut || sr.cappedAtMax) {
    // This should not happen for proved hints (we guard against it), but keep the text correct.
    return `${assumedText} Search was inconclusive (timeout/cap).`;
  }

  if (sr.solutionsFound === 0) {
    const forcedText = a.value === 'star' ? 'a star' : 'a cross';
    return `${assumedText} The solver found 0 valid completions, therefore (${a.row},${a.col}) must be ${forcedText}.`;
  }

  return `${assumedText} At least one completion exists, so it is not forced.`;
}
```

---

## 2) Integrate verifier into the schema-based technique

### 2.1 Modify schema runtime to return applications + narrative (no forced hint)

You will keep the existing template explanation rendering, but stop converting deductions into a user hint here.

Edit:

`src/logic/schemas/runtime.ts`

Make these changes:

1) **Extract** the explanation/highlights building logic into a new exported function that takes a `SchemaApplication` and returns:
   - `baseExplanation: string`
   - `baseHighlights?: HintHighlight`

Add this function near `schemaApplicationToHint` and reuse the existing logic:

```ts
export function buildSchemaNarrative(
  app: SchemaApplication,
  state: PuzzleState
): { baseExplanation: string; baseHighlights?: HintHighlight } {
  const ctx: SchemaContext = { state: puzzleStateToBoardState(state) };
  const explanationLines = renderExplanation(app.explanation, ctx);

  const highlights: HintHighlight = { cells: [], rows: [], cols: [], regions: [] };

  for (const step of app.explanation.steps) {
    if (step.entities.band) {
      if (step.entities.band.rows) highlights.rows?.push(...step.entities.band.rows);
      if (step.entities.band.cols) highlights.cols?.push(...step.entities.band.cols);
    }
    if (step.entities.regions) {
      const regionIds = (step.entities.regions as any[])
        .map((r: any) => r.regionId)
        .filter((id: any) => id !== undefined);
      highlights.regions?.push(...regionIds);
    }
    if (step.entities.region) {
      highlights.regions?.push((step.entities.region as any).regionId);
    }
  }

  // Do NOT add deduction cells here; the verifier will add the final result cell.
  const baseHighlights =
    (highlights.cells?.length || highlights.rows?.length || highlights.cols?.length || highlights.regions?.length)
      ? highlights
      : undefined;

  return {
    baseExplanation: explanationLines.join(' ') || `Schema ${app.schemaId} found ${app.deductions.length} candidate deduction(s).`,
    baseHighlights,
  };
}
```

2) In `findSchemaHints(...)`, stop returning the old intermediate `{forcedStars, forcedCrosses}` format.
   Instead, return the **best application** plus narrative pieces:

```ts
export function findBestSchemaApplication(
  state: PuzzleState
): { app: SchemaApplication; baseExplanation: string; baseHighlights?: HintHighlight } | null {
  ...same logic as findSchemaHints up to selecting applications[0]...
  if (applications.length === 0) return null;

  const app = applications[0];
  const { baseExplanation, baseHighlights } = buildSchemaNarrative(app, state);
  return { app, baseExplanation, baseHighlights };
}
```

Keep `getAllSchemaApplications(...)` and `applySchemaDeductions(...)` unchanged.

3) Remove or leave (unused) the old `schemaApplicationToHint` function. It must not be used by the UI anymore.

### 2.2 Modify the technique wrapper to verify and produce a final hint

Edit:

`src/logic/techniques/schemaBased.ts`

Replace the call to `findSchemaHints(state)` with `findBestSchemaApplication(state)`.

At the top, add:

```ts
import { findBestSchemaApplication } from '../schemas/runtime';
import { verifyAndBuildSchemaHint } from '../schemas/verification/schemaHintVerifier';
```

Then rewrite `findSchemaBasedHint` to:

- call `findBestSchemaApplication`
- call `verifyAndBuildSchemaHint` with strict options
- return the verified hint (or null)

Implementation:

```ts
export function findSchemaBasedHint(state: PuzzleState): Hint | null {
  const startTime = performance.now();
  const best = findBestSchemaApplication(state);
  const totalTime = performance.now() - startTime;

  if (!best) return null;

  const verified = verifyAndBuildSchemaHint(
    state,
    best.app,
    best.baseExplanation,
    best.baseHighlights,
    {
      perCheckTimeoutMs: 250,
      maxSolutionsToFind: 1,
    }
  );

  if (verified.kind !== 'verified-hint') {
    return null;
  }

  // Keep the existing defensive validateState block as a final guard.
  // It should almost never filter out a proved hint, but it is fine as a safety net.
  const hint = verified.hint;

  // Existing validation code in this file can be kept, but it must validate the *single* result cell only.
  // The simplest is: reuse the current code, but forcedStars/forcedCrosses are no longer needed.
  // Instead, apply only hint.kind at hint.resultCells[0].
  //
  // IMPORTANT: Do not reintroduce multi-cell schema hints until you also verify multi-cell forcedness.
  return hint;
}
```

Finally:
- delete the `schemaCellTypes` multi-cell logic for schema-based hints in this technique.
- schema-based verified hints in this phase must return **exactly one** result cell.

This avoids the performance cliff and makes proof text simple and consistent.

---

## 3) Guarantee schema analysis cannot emit “forced” results from partial enumeration

Even if not currently used, the exact solver is a correctness trap and should be fixed.

Edit:

`src/logic/schemas/miner/exactSolver.ts`

### 3.1 Extend the result type

Change:

```ts
export interface CompletionAnalysis {
  cellResults: Map<CellId, 'alwaysStar' | 'alwaysEmpty' | 'variable'>;
  totalCompletions: number;
}
```

to:

```ts
export interface CompletionAnalysis {
  cellResults: Map<CellId, 'alwaysStar' | 'alwaysEmpty' | 'variable'>;
  totalCompletions: number;
  complete: boolean;     // true only if the search fully explored without timeout/cap
  timedOut: boolean;
  cappedAtMax: boolean;
}
```

### 3.2 Track timeout/cap explicitly

In `enumerateAllCompletions`, add:

- `let timedOut = false;`
- `let cappedAtMax = false;`

Change the timeout and cap checks to set these flags and stop recursion **without** pretending the enumeration is complete.

Example modifications:

- When `Date.now() - startTime > timeoutMs`: set `timedOut = true; return false;`
- When `completionCount >= maxCompletions`: set `cappedAtMax = true; return false;`

After `solve(state,0)`, compute:

```ts
const complete = !timedOut && !cappedAtMax;
```

Return these flags in `analysis`.

### 3.3 Enforce soundness in analysis

When `complete === false`, you must never mark any cell as alwaysStar/alwaysEmpty based on partial samples.

Implement this rule by changing the analysis loop:

- If `!complete`, set every `analysis.cellResults` entry to `'variable'`.

Only run the current always/variable logic when `complete === true`.

This ensures the exact solver cannot be misused to produce wrong forced deductions.

---

## 4) Performance improvements (must-do)

Schema verification can still be fast if you keep it focused and cache results.

### 4.1 Add memoization for forced checks

In `schemaHintVerifier.ts`, add a simple cache keyed by:
- a stable state hash
- the tested assignment (row,col,value)

Create:

`src/logic/schemas/verification/verificationCache.ts`

```ts
import type { PuzzleState } from '../../../types/puzzle';
import type { VerifiedCellAssignment, VerifiedCandidate } from './schemaHintVerifier';

function stateKey(state: PuzzleState): string {
  // Fast and stable: stringify the cell grid only.
  // (If regions/starsPerUnit/size can vary, include def.size + starsPerUnit.)
  return `${state.def.size}:${state.def.starsPerUnit}:` + state.cells.map(r => r.join('')).join('|');
}

export function makeVerificationKey(state: PuzzleState, a: VerifiedCellAssignment): string {
  return `${stateKey(state)}::${a.row},${a.col}:${a.value}`;
}

const cache = new Map<string, VerifiedCandidate>();

export function getCached(key: string): VerifiedCandidate | undefined {
  return cache.get(key);
}

export function setCached(key: string, value: VerifiedCandidate): void {
  cache.set(key, value);
}

export function clearVerificationCache(): void {
  cache.clear();
}
```

Then in `verifyForcedCell`, before running `countSolutions`, do:

- compute key with `makeVerificationKey`
- return cached if present
- store result before returning

Also clear this cache whenever the puzzle state changes (best place is wherever you apply moves in the store; if that is too invasive, clear it at the start of `findSchemaBasedHint`).

### 4.2 Ensure schema analysis itself has a hard time budget

In `src/logic/schemas/runtime.ts`, your loop applies *all* schemas and logs timing, but it does not enforce a global budget.

Add a `const HARD_BUDGET_MS = 30;` (or similar) near start of `findBestSchemaApplication`.

After each schema application, check elapsed and break if exceeded:

```ts
if (performance.now() - startTime > HARD_BUDGET_MS) break;
```

This prevents UI stalls.

Important: This may reduce hint availability, but verification ensures correctness of anything returned.

---

## 5) User-facing explanation requirements

You stated: “every hint is explained to the user”.

With this plan, every schema hint has:

1) **Schema narrative** (existing template explanation).
2) **Proof summary** (new, always present, never ambiguous).

Make sure the UI renders newlines in `Hint.explanation`:
- if currently rendered as plain text, convert `\n` to `<br>` or render in a `<pre>`/markdown component.
- Do not remove the “Proof:” section.

Optional enhancement (later, not required for correctness):
- Replace the proof summary with a short contradiction chain.
- This requires adding proof tracing to `countSolutions` (not included here to keep the change bounded).

---

## 6) Tests you must add

Create a new test file:

`tests/schemaBasedVerification.test.ts`

Add three tests.

### 6.1 A proved hint is always sound

- Load or construct a state where schema-based produces at least one candidate.
- Call `findSchemaBasedHint(state)`.
- If non-null, apply it to the state and confirm:
  - `validateState(nextState)` returns `[]` (no violations)
  - `countSolutions(nextState, { maxCount: 1, timeoutMs: 2000 })` returns `count >= 1` and not timed out
  - Verify the “opposite assumption” yields 0 completions without timeout:
    - if hint says star at (r,c): assume cross then `countSolutions(...)=0` with no timeout/cap.

### 6.2 Inconclusive checks do not produce hints

- Create a state that triggers schema candidates but makes `countSolutions` slow.
- Force `perCheckTimeoutMs` to a tiny number like 1ms via a test-only call to `verifyAndBuildSchemaHint`.
- Assert it returns `no-verified-deductions`.

### 6.3 Partial enumeration cannot mark “always” in exactSolver

- Call `enumerateAllCompletions` with a tiny `timeoutMs` or `maxCompletions=1`.
- Assert `analysis.complete === false`.
- Assert that at least one cell result is `'variable'` and (preferably) all are `'variable'` based on your rule.

---

## 7) Summary of files to modify/create

### Create
- `src/logic/schemas/verification/schemaHintVerifier.ts`
- `src/logic/schemas/verification/verificationCache.ts`
- `tests/schemaBasedVerification.test.ts`

### Modify
- `src/logic/schemas/runtime.ts`  
  Add `buildSchemaNarrative` and `findBestSchemaApplication`, stop producing forced hint outputs.
- `src/logic/techniques/schemaBased.ts`  
  Use `findBestSchemaApplication` + `verifyAndBuildSchemaHint`, return a single-cell verified hint.
- `src/logic/schemas/miner/exactSolver.ts`  
  Add completeness flags and forbid “always” conclusions when incomplete.

---

## 8) Non-negotiable rules (must be enforced in code)

1) **Never** show a forced hint unless the opposite assumption returns:
   - `count === 0`
   - `timedOut === false`
   - `cappedAtMax === false`

2) If verification is inconclusive, the hint is **not shown**.

3) Schema-based hints are **single-cell only** until multi-cell forcedness is verified cell-by-cell.

4) The hint explanation must include both:
   - schema narrative
   - “Proof:” section

---

## 9) Recommended default settings

- Schema runtime hard budget: **30ms**
- Per-cell verification timeout: **250ms**
- `maxSolutionsToFind`: **1**
- Cache: enabled, cleared on every user move (or on every hint request, if easier)

These values are conservative and can be tuned later.
