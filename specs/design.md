# Design Document: Star Battle Techniques

## Overview

This design extends the existing Star Battle puzzle solver to implement all 21 logical solving techniques from "A Star Battle Guide" by Kris De Asis. The system currently implements 5 basic techniques (trivial-marks, two-by-two, one-by-n, exclusion, simple-shapes) and needs 16 additional techniques across counting, uniqueness, and idiosyncratic categories.

The design maintains the existing architecture where each technique is a pure function that analyzes a `PuzzleState` and returns a `Hint` or `null`. Techniques are applied in order from simplest to most complex, ensuring users learn basic patterns before advanced ones.

### Key Design Principles

1. **Soundness over Completeness**: Every hint must be logically valid, even if not all puzzles are solvable
2. **Pure Functions**: Techniques are stateless analyzers that don't modify the puzzle state
3. **Clear Explanations**: Each hint includes human-readable text explaining the logical reasoning
4. **Visual Highlights**: Hints identify relevant rows, columns, regions, and cells for UI highlighting
5. **Incremental Complexity**: Techniques ordered from basic to advanced

## Architecture

### Existing Components (No Changes Required)

- **Data Model** (`types/puzzle.ts`, `types/hints.ts`): Core types for puzzle state and hints
- **Helper Functions** (`logic/helpers.ts`): Utilities for accessing rows, columns, regions, counting stars
- **Technique Registry** (`logic/techniques.ts`): Ordered list of techniques and hint search function
- **Store** (`store/puzzleStore.ts`): Vue reactive state management
- **UI Components**: Board rendering, hint panel, mode toolbar

### New Components to Implement

Each new technique will be implemented as a separate module in `logic/techniques/`:

**Counting Techniques** (6 new files):
- `undercounting.ts`: Minimum star count arguments
- `overcounting.ts`: Maximum star count arguments
- `finnedCounts.ts`: Counting with exceptional fin cells
- `compositeShapes.ts`: Multi-region shape analysis
- `squeeze.ts`: Spatial constraint forcing
- `setDifferentials.ts`: Overlapping shape comparison

**Uniqueness Techniques** (3 new files):
- `byAThread.ts`: Solution uniqueness arguments
- `atSea.ts`: Isolation-based forcing
- `byAThreadAtSea.ts`: Combined uniqueness and isolation

**Idiosyncratic Techniques** (7 new files):
- `kissingLs.ts`: Touching L-shaped regions
- `theM.ts`: M-shaped region patterns
- `pressuredTs.ts`: T-shaped regions under pressure
- `fish.ts`: Sudoku-style fish patterns
- `nRooks.ts`: Rook placement patterns
- `entanglement.ts`: Complex constraint interactions
- `pressuredExclusion.ts`: Exclusion under constraint pressure (currently placeholder)

### Shared Utilities

New helper functions will be added to `logic/helpers.ts` or a new `logic/countingHelpers.ts`:

```typescript
// Composite shape analysis
export function findCompositeShape(state: PuzzleState, cells: Coords[]): CompositeShape;
export function computeMinStars(shape: CompositeShape): number;
export function computeMaxStars(shape: CompositeShape): number;

// 2×2 tiling analysis
export function findTwoByTwoBlocks(cells: Coords[]): Coords[][];
export function maxStarsWithTwoByTwo(cells: Coords[], existingStars: Coords[]): number;

// Pattern matching
export function findLShapes(state: PuzzleState): LShapePattern[];
export function findMShapes(state: PuzzleState): MShapePattern[];
export function findTShapes(state: PuzzleState): TShapePattern[];

// Set operations
export function intersection(a: Coords[], b: Coords[]): Coords[];
export function difference(a: Coords[], b: Coords[]): Coords[];
export function union(a: Coords[], b: Coords[]): Coords[];
```

## Components and Interfaces

### Technique Interface (Existing)

```typescript
export interface Technique {
  id: TechniqueId;
  name: string;
  findHint(state: PuzzleState): Hint | null;
}
```

Each technique module exports a `findXxxHint(state: PuzzleState): Hint | null` function.

### Composite Shape Data Structure

```typescript
interface CompositeShape {
  cells: Coords[];
  regions: Set<number>;
  rows: Set<number>;
  cols: Set<number>;
  minStars: number;  // minimum stars this shape must contain
  maxStars: number;  // maximum stars this shape can contain
}
```

### Pattern Data Structures

```typescript
interface LShapePattern {
  regionId: number;
  cells: Coords[];
  corner: Coords;
  arms: { horizontal: Coords[]; vertical: Coords[] };
}

interface MShapePattern {
  regionId: number;
  cells: Coords[];
  peaks: Coords[];
  valley: Coords;
}

interface TShapePattern {
  regionId: number;
  cells: Coords[];
  stem: Coords[];
  crossbar: Coords[];
}
```

## Data Models

### Existing Data Models (No Changes)

The existing `PuzzleState`, `PuzzleDef`, `Hint`, and `HintHighlight` types are sufficient for all techniques. No schema changes required.

### Internal Analysis Structures

Counting techniques will use temporary analysis structures:

```typescript
// Unit analysis for counting
interface UnitAnalysis {
  type: 'row' | 'col' | 'region';
  id: number;
  cells: Coords[];
  stars: number;
  crosses: number;
  empties: Coords[];
  remaining: number;  // starsPerUnit - stars
}

// Constraint graph for entanglement
interface ConstraintNode {
  cell: Coords;
  mustBeStar: boolean | null;
  forcedBy: Constraint[];
}

interface Constraint {
  type: 'unit-quota' | 'adjacency' | 'two-by-two';
  cells: Coords[];
  description: string;
}
```


## Correctness Properties


*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Basic Technique Properties

**Property 1: Unit saturation forces crosses**
*For any* puzzle state and any unit (row, column, or region) that contains exactly 2 stars, all empty cells in that unit should be identified as forced crosses by the trivial-marks technique.
**Validates: Requirements 1.1, 1.2, 1.3**

**Property 2: Star adjacency forces crosses**
*For any* puzzle state and any cell containing a star, all 8 adjacent empty cells should be identified as forced crosses by the trivial-marks technique.
**Validates: Requirements 1.4**

**Property 3: 2×2 with one star forces crosses**
*For any* puzzle state and any 2×2 block containing exactly 1 star, all remaining empty cells in that block should be identified as forced crosses by the two-by-two technique.
**Validates: Requirements 2.1**

**Property 4: 2×2 hints include block highlights**
*For any* hint generated by the two-by-two technique, the hint's highlights should include all 4 cells of the 2×2 block.
**Validates: Requirements 2.2**

**Property 5: 1×N bands force stars**
*For any* puzzle state and any unit (row, column, or region) where the number of remaining stars equals the number of empty cells, all those empty cells should be identified as forced stars by the one-by-n technique.
**Validates: Requirements 3.1, 3.2, 3.3**

**Property 6: Exclusion prevents quota violations**
*For any* puzzle state and any empty cell, if placing a star in that cell would cause any unit to exceed 2 stars, that cell should be identified as a forced cross by the exclusion technique.
**Validates: Requirements 4.1, 4.2, 4.3**

**Property 7: Exclusion prevents insufficient empties**
*For any* puzzle state and any empty cell, if placing a star in that cell would leave any unit with fewer empty cells than remaining stars needed, that cell should be identified as a forced cross by the exclusion technique.
**Validates: Requirements 4.4**

**Property 8: Pressured exclusion considers 2×2 cascades**
*For any* puzzle state and any empty cell, if placing a star in that cell would force 2×2 violations that prevent any unit from reaching 2 stars, that cell should be identified as a forced cross by the pressured-exclusion technique.
**Validates: Requirements 5.1**

**Property 9: Pressured exclusion considers adjacency cascades**
*For any* puzzle state and any empty cell, if placing a star in that cell would force adjacency violations that prevent any unit from reaching 2 stars, that cell should be identified as a forced cross by the pressured-exclusion technique.
**Validates: Requirements 5.2**

**Property 10: Horizontal 1×4 regions force row crosses**
*For any* puzzle state with a region consisting of exactly 4 cells forming a horizontal 1×4 strip, all other cells in that row should be identified as forced crosses by the simple-shapes technique.
**Validates: Requirements 6.1**

**Property 11: Vertical 4×1 regions force column crosses**
*For any* puzzle state with a region consisting of exactly 4 cells forming a vertical 4×1 strip, all other cells in that column should be identified as forced crosses by the simple-shapes technique.
**Validates: Requirements 6.2**

**Property 12: Strip adjacency forces crosses**
*For any* puzzle state with a 1×4 or 4×1 region strip, all cells directly adjacent to the strip (perpendicular to its orientation) should be identified as forced crosses by the simple-shapes technique.
**Validates: Requirements 6.3**

### Counting Technique Properties

**Property 13: Undercounting respects 2×2 constraints**
*For any* composite shape, the computed minimum star count should never exceed the maximum possible stars considering 2×2 block constraints.
**Validates: Requirements 7.2**

**Property 14: Undercounting hints include shape highlights**
*For any* hint generated by the undercounting technique, the hint's highlights should include all regions involved in the composite shape.
**Validates: Requirements 7.4**

**Property 15: Overcounting respects 2×2 constraints**
*For any* composite shape, the computed maximum star count should never be less than the minimum required stars considering 2×2 block constraints.
**Validates: Requirements 8.2**

**Property 16: Overcounting hints include shape highlights**
*For any* hint generated by the overcounting technique, the hint's highlights should include all regions involved in the composite shape.
**Validates: Requirements 8.4**

**Property 17: Composite shapes compute valid bounds**
*For any* composite shape formed from multiple regions or partial regions, the computed minimum star count should be less than or equal to the maximum star count.
**Validates: Requirements 10.1**

**Property 18: Composite shape hints include all regions**
*For any* hint generated by the composite-shapes technique, the hint's highlights should include all regions that form the composite shape.
**Validates: Requirements 10.4**

### General Hint Properties

**Property 19: All hints have required fields**
*For any* hint returned by any technique, the hint should include a technique ID, kind (place-star or place-cross), result cells array, and explanation string.
**Validates: Requirements 22.1**

**Property 20: All hints include highlights**
*For any* hint returned by any technique, the hint should include a highlights object with at least one of: cells, rows, cols, or regions.
**Validates: Requirements 22.2**

**Property 21: Hints are sound**
*For any* hint returned by any technique, applying the hint to the puzzle state should not create an invalid state (no unit exceeds 2 stars, no adjacent stars, no 2×2 with multiple stars).
**Validates: Requirements 22.4**

**Property 22: Technique ordering is respected**
*For any* puzzle state where multiple techniques could provide hints, the findNextHint function should return the hint from the earliest technique in the defined ordering.
**Validates: Requirements 23.1, 23.2**

### Example-Based Tests

The following patterns are best tested with specific constructed examples rather than property-based testing:

**Example 1: Finned count with single fin**
A puzzle state with a counting argument that holds except for one fin cell should produce a finned-counts hint that highlights both the main shape and the fin.
**Validates: Requirements 9.1, 9.3**

**Example 2: Squeeze in narrow corridor**
A puzzle state where stars must fit into a 3-cell corridor with crosses blocking other options should produce a squeeze hint.
**Validates: Requirements 11.1, 11.3**

**Example 3: Set differential with overlapping shapes**
A puzzle state with two overlapping composite shapes whose star count difference forces specific cells should produce a set-differentials hint.
**Validates: Requirements 12.1, 12.2, 12.4**

**Example 4: By-a-thread uniqueness**
A puzzle state where a cell's value is determined by uniqueness should produce a by-a-thread hint.
**Validates: Requirements 13.1, 13.2, 13.4**

**Example 5: At-sea isolation**
A puzzle state with an isolated region forcing specific placements should produce an at-sea hint.
**Validates: Requirements 14.1, 14.3**

**Example 6: By-a-thread-at-sea combination**
A puzzle state requiring both uniqueness and isolation logic should produce a by-a-thread-at-sea hint.
**Validates: Requirements 15.1, 15.3**

**Example 7: Kissing Ls pattern**
A puzzle state with two touching L-shaped regions should produce a kissing-ls hint.
**Validates: Requirements 16.1, 16.3**

**Example 8: M-shape pattern**
A puzzle state with an M-shaped region should produce a the-m hint.
**Validates: Requirements 17.1, 17.3**

**Example 9: Pressured T pattern**
A puzzle state with a T-shaped region under constraint pressure should produce a pressured-ts hint.
**Validates: Requirements 18.1, 18.3**

**Example 10: Fish pattern**
A puzzle state with a fish pattern across rows and columns should produce a fish hint.
**Validates: Requirements 19.1, 19.3**

**Example 11: N-rooks pattern**
A puzzle state with N cells in N different rows and columns that must all be stars should produce an n-rooks hint.
**Validates: Requirements 20.1, 20.3**

**Example 12: Entanglement pattern**
A puzzle state with multiple interacting constraints should produce an entanglement hint.
**Validates: Requirements 21.1, 21.3**

**Example 13: Technique ordering verification**
A puzzle state where the exact technique ordering can be verified against the specified sequence.
**Validates: Requirements 23.3**

**Edge Case 1: No hints available**
A puzzle state where no technique applies should cause findNextHint to return null.
**Validates: Requirements 22.5**

## Error Handling

### Invalid Puzzle States

Techniques should handle edge cases gracefully:

- **Empty puzzle**: Return null (no forced moves yet)
- **Completed puzzle**: Return null (no empty cells)
- **Invalid state** (too many stars, adjacent stars): Techniques may return null or identify violations depending on implementation

### Technique-Specific Error Handling

1. **Counting techniques**: If min > max stars for a shape, this indicates an invalid puzzle state. The technique should return null rather than crash.

2. **Pattern matching**: If a region shape doesn't match expected patterns (L, M, T), the technique should return null.

3. **Uniqueness techniques**: If solution counting times out or fails, the technique should return null rather than provide an unsound hint.

### Hint Application

The UI layer (not the technique layer) is responsible for:
- Validating that applying a hint doesn't create an invalid state
- Handling user rejection of hints
- Managing undo/redo of hint applications

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples and edge cases:

1. **Basic technique tests**: Known puzzle positions where each basic technique should fire
2. **Edge cases**: Empty puzzles, completed puzzles, invalid states
3. **Hint structure**: Verify all hints have required fields and valid highlights
4. **Helper functions**: Test counting, shape detection, and set operations

### Property-Based Testing

Property-based tests will verify universal properties using fast-check (JavaScript PBT library):

1. **Soundness property**: Generate random puzzle states and hints, verify applying hints never creates invalid states
2. **Unit saturation**: Generate random puzzle states with saturated units, verify trivial-marks identifies all forced crosses
3. **2×2 constraint**: Generate random 2×2 blocks with one star, verify two-by-two identifies forced crosses
4. **Exclusion logic**: Generate random puzzle states, verify exclusion correctly identifies cells that would violate constraints
5. **Technique ordering**: Generate random puzzle states where multiple techniques apply, verify correct technique priority
6. **Hint completeness**: Verify all hints include required fields and valid highlights

### Property-Based Test Configuration

- Each property test should run a minimum of 100 iterations
- Tests should use smart generators that create valid puzzle states (respecting 2-star-per-unit, no adjacency, no 2×2 violations)
- Tests should generate edge cases (nearly complete puzzles, puzzles with many crosses, etc.)

### Integration Testing

Integration tests will verify technique interactions:

1. **Technique chaining**: Apply hints sequentially and verify puzzle progresses toward solution
2. **No regression**: Verify new techniques don't break existing technique behavior
3. **Complete solve**: Test that technique sequence can solve known solvable puzzles

### Test Data

Use puzzle examples from "A Star Battle Guide" as regression tests:
- Extract puzzle positions where each technique is demonstrated
- Verify the system identifies the same forced moves as the guide
- Use these as both unit tests and documentation



## Implementation Details

### Technique Implementation Pattern

Each technique follows this pattern:

```typescript
export function findXxxHint(state: PuzzleState): Hint | null {
  // 1. Early exit if technique doesn't apply
  if (!applicabilityCheck(state)) return null;
  
  // 2. Analyze puzzle state
  const analysis = analyzeState(state);
  
  // 3. Search for forcing patterns
  for (const pattern of analysis.patterns) {
    if (pattern.forces.length > 0) {
      // 4. Build and return hint
      return {
        id: generateHintId(),
        kind: pattern.kind,
        technique: 'xxx',
        resultCells: pattern.forces,
        explanation: buildExplanation(pattern),
        highlights: buildHighlights(pattern),
      };
    }
  }
  
  // 5. No forcing found
  return null;
}
```

### Counting Technique Implementation Strategy

Counting techniques (undercounting, overcounting, composite shapes, squeeze, set differentials) share common infrastructure:

1. **Shape Identification**: Find interesting composite shapes (unions of regions, intersections with rows/cols)
2. **Bound Computation**: Calculate min/max stars considering 2×2 and adjacency constraints
3. **Forcing Detection**: Compare bounds with unit quotas to find forced cells
4. **Explanation Generation**: Describe the counting argument in clear English

### Pattern Matching Implementation Strategy

Idiosyncratic techniques (kissing Ls, M, pressured Ts) use pattern matching:

1. **Shape Detection**: Scan regions for geometric patterns (L, M, T shapes)
2. **Constraint Analysis**: Check surrounding cells for pressure/forcing conditions
3. **Deduction**: Apply technique-specific logic to derive forced moves
4. **Visualization**: Highlight the pattern and forcing cells

### Uniqueness Technique Implementation Strategy

Uniqueness techniques (by-a-thread, at-sea) require solution counting:

1. **Hypothesis Testing**: Try both values for a cell (star vs cross)
2. **Solution Counting**: Use backtracking solver to count solutions for each hypothesis
3. **Uniqueness Check**: If one hypothesis leads to 0 or multiple solutions, the other is forced
4. **Performance**: Limit search depth and time to avoid long computations

**Note**: Uniqueness techniques are optional and may be disabled for performance reasons.

## Performance Considerations

### Technique Complexity

- **O(n²)**: trivial-marks, two-by-two, one-by-n, exclusion (scan all cells once)
- **O(n³)**: simple-shapes, pressured-exclusion (check cells against multiple units)
- **O(n⁴)**: counting techniques (analyze composite shapes across multiple units)
- **O(2^n)**: uniqueness techniques (solution counting with backtracking)

### Optimization Strategies

1. **Early Exit**: Return first hint found, don't search for all possible hints
2. **Caching**: Cache unit analyses (star counts, empty cells) across technique calls
3. **Incremental Updates**: When a hint is applied, update only affected units
4. **Technique Ordering**: Cheaper techniques first, expensive techniques last
5. **Lazy Evaluation**: Don't compute expensive analyses until needed

### Performance Targets

- **Interactive Response**: Hint search should complete in < 100ms for typical puzzles
- **Worst Case**: Hint search should complete in < 1s even for complex puzzles
- **Solution Counting**: Limit uniqueness technique search to 5s timeout

## Dependencies

### External Libraries

- **fast-check**: Property-based testing library for JavaScript/TypeScript
- **vitest**: Unit testing framework (already in use)

### Internal Dependencies

All techniques depend on:
- Core types (`types/puzzle.ts`, `types/hints.ts`)
- Helper functions (`logic/helpers.ts`)
- Existing basic techniques (for building on simpler patterns)

### No Breaking Changes

The implementation adds new techniques without modifying existing code:
- Existing technique implementations remain unchanged
- New techniques added to `techniquesInOrder` array
- Helper functions extended but not modified

## Migration and Rollout

### Phased Implementation

Implement techniques in 4 phases matching the guide structure:

**Phase 1: Complete Basics** (1 technique)
- Implement pressured-exclusion

**Phase 2: Counting Techniques** (6 techniques)
- Implement undercounting, overcounting
- Implement finned-counts
- Implement composite-shapes, squeeze, set-differentials

**Phase 3: Uniqueness Techniques** (3 techniques)
- Implement solution counter (shared utility)
- Implement by-a-thread, at-sea, by-a-thread-at-sea

**Phase 4: Idiosyncratic Techniques** (7 techniques)
- Implement pattern matchers (L, M, T shapes)
- Implement kissing-ls, the-m, pressured-ts
- Implement fish, n-rooks, entanglement

### Testing Strategy Per Phase

After each phase:
1. Run all unit tests
2. Run all property-based tests
3. Test with example puzzles from the guide
4. Verify no regression in existing techniques

### Feature Flags

Consider adding feature flags for expensive techniques:
- `enableUniqueness`: Toggle uniqueness techniques (by-a-thread, at-sea)
- `enableIdiosyncratic`: Toggle idiosyncratic techniques
- `maxHintSearchTime`: Timeout for hint search

This allows users to trade completeness for performance.

## Future Enhancements

### Generalization to Other Puzzle Sizes

The current design is specific to 10×10 2-star puzzles. Future work could generalize to:
- Different grid sizes (6×6, 8×8, 12×12)
- Different star counts (1-star, 3-star)
- Different region counts

Changes required:
- Parameterize hard-coded constants (size=10, stars=2, regions=10)
- Adjust pattern matching for different scales
- Update simple-shapes logic for different star counts

### Hint Difficulty Rating

Add difficulty ratings to hints:
- **Easy**: trivial-marks, two-by-two, one-by-n
- **Medium**: exclusion, simple-shapes
- **Hard**: counting techniques
- **Expert**: uniqueness and idiosyncratic techniques

This allows users to request hints at their skill level.

### Hint Explanation Improvements

Enhance explanations with:
- Step-by-step reasoning
- Visual diagrams (ASCII art or SVG)
- Links to guide sections
- Interactive tutorials

### Multiple Hint Modes

Support different hint modes:
- **Next Move**: Current behavior (single forced cell)
- **All Forced Moves**: Show all cells forced by current technique
- **Technique Hint**: Suggest which technique to try without revealing the move
- **Partial Hint**: Give a clue without full solution

### Performance Profiling

Add instrumentation to measure:
- Time spent in each technique
- Hit rate for each technique
- Puzzle difficulty metrics (which techniques required)

This data can guide optimization efforts and difficulty rating.
