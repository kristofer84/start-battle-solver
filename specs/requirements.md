# Requirements Document

## Introduction

This document specifies the requirements for implementing a comprehensive set of logical solving techniques for Star Battle puzzles (10×10, 2-star configuration). The system will provide step-by-step hints using purely logical deductions without guessing, covering all techniques from "A Star Battle Guide" by Kris De Asis (sections 1-4: Basics, Counting, Uniqueness, Idiosyncrasies).

## Glossary

- **System**: The Star Battle hint-finding logic solver
- **Puzzle**: A 10×10 Star Battle grid with 2 stars per row, column, and region
- **Cell**: A single square in the 10×10 grid
- **Unit**: A row, column, or region in the puzzle
- **Region**: A connected group of cells, labeled 1-10
- **Star**: A cell marked as containing a star
- **Cross**: A cell marked as definitively empty
- **Empty Cell**: A cell not yet marked as star or cross
- **Hint**: A logical deduction identifying one or more cells that must be stars or crosses
- **Technique**: A named logical pattern used to derive hints
- **Adjacency**: Two cells are adjacent if they touch horizontally, vertically, or diagonally
- **2×2 Block**: Any contiguous 2-by-2 square of cells in the grid
- **1×N Band**: A contiguous horizontal or vertical strip of N cells
- **Composite Shape**: A union of multiple regions or partial regions used in counting arguments
- **Counting Argument**: A logical technique that uses minimum/maximum star counts to derive forced moves
- **Uniqueness Technique**: A logical technique that assumes the puzzle has exactly one solution

## Requirements

### Requirement 1: Trivial Marks

**User Story:** As a puzzle solver, I want the system to identify trivially forced crosses and stars, so that I can make progress on basic deductions.

#### Acceptance Criteria

1. WHEN a row contains exactly 2 stars THEN the System SHALL mark all remaining empty cells in that row as crosses
2. WHEN a column contains exactly 2 stars THEN the System SHALL mark all remaining empty cells in that column as crosses
3. WHEN a region contains exactly 2 stars THEN the System SHALL mark all remaining empty cells in that region as crosses
4. WHEN a star is placed in a cell THEN the System SHALL mark all 8 adjacent empty cells as crosses
5. WHEN the System identifies trivial marks THEN the System SHALL provide an explanation referencing the saturated unit or adjacent star

### Requirement 2: Two-by-Two Blocks

**User Story:** As a puzzle solver, I want the system to enforce the 2×2 constraint, so that I can eliminate cells that would violate this rule.

#### Acceptance Criteria

1. WHEN a 2×2 block contains exactly 1 star THEN the System SHALL mark all remaining empty cells in that block as crosses
2. WHEN the System identifies a 2×2 violation THEN the System SHALL highlight the 2×2 block in the hint
3. WHEN the System provides a 2×2 hint THEN the System SHALL explain that any 2×2 block may contain at most one star

### Requirement 3: One-by-N Bands

**User Story:** As a puzzle solver, I want the system to identify 1×N bands where stars are forced, so that I can place stars using counting logic.

#### Acceptance Criteria

1. WHEN a row has exactly N empty cells remaining and needs exactly N stars THEN the System SHALL mark all those empty cells as stars
2. WHEN a column has exactly N empty cells remaining and needs exactly N stars THEN the System SHALL mark all those empty cells as stars
3. WHEN a region has exactly N empty cells remaining and needs exactly N stars THEN the System SHALL mark all those empty cells as stars
4. WHEN the System identifies a 1×N band THEN the System SHALL explain the counting logic showing remaining stars equals remaining empty cells

### Requirement 4: Basic Exclusion

**User Story:** As a puzzle solver, I want the system to identify cells where placing a star would make the puzzle unsolvable, so that I can mark those cells as crosses.

#### Acceptance Criteria

1. WHEN placing a star in a cell would cause a row to exceed 2 stars THEN the System SHALL mark that cell as a cross
2. WHEN placing a star in a cell would cause a column to exceed 2 stars THEN the System SHALL mark that cell as a cross
3. WHEN placing a star in a cell would cause a region to exceed 2 stars THEN the System SHALL mark that cell as a cross
4. WHEN placing a star in a cell would leave insufficient empty cells for a unit to reach 2 stars THEN the System SHALL mark that cell as a cross
5. WHEN the System identifies an exclusion THEN the System SHALL explain which unit would become unsatisfiable

### Requirement 5: Pressured Exclusion

**User Story:** As a puzzle solver, I want the system to identify exclusions under pressure from existing constraints, so that I can make more advanced deductions.

#### Acceptance Criteria

1. WHEN placing a star in a cell would force 2×2 violations that prevent a unit from reaching 2 stars THEN the System SHALL mark that cell as a cross
2. WHEN placing a star in a cell would force adjacency violations that prevent a unit from reaching 2 stars THEN the System SHALL mark that cell as a cross
3. WHEN the System identifies pressured exclusion THEN the System SHALL explain the chain of forced consequences that leads to unsatisfiability

### Requirement 6: Simple Shapes

**User Story:** As a puzzle solver, I want the system to recognize simple region shapes with forced consequences, so that I can apply shape-based logic.

#### Acceptance Criteria

1. WHEN a region consists of exactly 4 cells forming a horizontal 1×4 strip THEN the System SHALL mark all other cells in that row as crosses
2. WHEN a region consists of exactly 4 cells forming a vertical 4×1 strip THEN the System SHALL mark all other cells in that column as crosses
3. WHEN a 1×4 or 4×1 region is identified THEN the System SHALL mark cells directly adjacent to the strip as crosses
4. WHEN the System identifies a simple shape THEN the System SHALL highlight the region and explain that both stars must lie within the strip

### Requirement 7: Undercounting

**User Story:** As a puzzle solver, I want the system to use undercounting arguments to identify forced stars, so that I can solve puzzles using minimum star counts.

#### Acceptance Criteria

1. WHEN a set of units requires a minimum number of stars that can only be placed in specific cells THEN the System SHALL mark those cells as stars
2. WHEN the System computes a minimum star count THEN the System SHALL consider 2×2 constraints and adjacency rules
3. WHEN the System identifies undercounting THEN the System SHALL explain which units were counted and how the minimum was derived
4. WHEN the System provides an undercounting hint THEN the System SHALL highlight the composite shape and involved units

### Requirement 8: Overcounting

**User Story:** As a puzzle solver, I want the system to use overcounting arguments to identify forced crosses, so that I can eliminate cells using maximum star counts.

#### Acceptance Criteria

1. WHEN a set of units can contain at most N stars and already has N stars placed or forced THEN the System SHALL mark remaining cells in those units as crosses
2. WHEN the System computes a maximum star count THEN the System SHALL consider 2×2 constraints and adjacency rules
3. WHEN the System identifies overcounting THEN the System SHALL explain which units were counted and how the maximum was reached
4. WHEN the System provides an overcounting hint THEN the System SHALL highlight the composite shape and involved units

### Requirement 9: Finned Counts

**User Story:** As a puzzle solver, I want the system to identify finned counting patterns, so that I can make deductions when counts have exceptions.

#### Acceptance Criteria

1. WHEN a counting argument holds except for specific "fin" cells THEN the System SHALL derive forced moves based on case analysis of the fin
2. WHEN the System identifies a finned count THEN the System SHALL explain the main counting argument and the exceptional fin cells
3. WHEN the System provides a finned count hint THEN the System SHALL highlight both the main composite shape and the fin cells

### Requirement 10: Composite Shapes

**User Story:** As a puzzle solver, I want the system to analyze composite shapes formed by multiple regions, so that I can apply counting logic to complex patterns.

#### Acceptance Criteria

1. WHEN multiple regions or partial regions form a composite shape THEN the System SHALL compute minimum and maximum star counts for that shape
2. WHEN a composite shape's star count forces specific cells THEN the System SHALL mark those cells as stars or crosses
3. WHEN the System identifies a composite shape pattern THEN the System SHALL explain which regions form the shape and the counting logic
4. WHEN the System provides a composite shape hint THEN the System SHALL highlight all regions involved in the composite shape

### Requirement 11: Squeeze

**User Story:** As a puzzle solver, I want the system to identify squeeze patterns where stars are forced into narrow spaces, so that I can apply spatial reasoning.

#### Acceptance Criteria

1. WHEN stars in a unit must fit into a constrained space due to crosses and 2×2 blocks THEN the System SHALL identify forced star placements
2. WHEN the System identifies a squeeze THEN the System SHALL explain the spatial constraint and why stars must occupy specific cells
3. WHEN the System provides a squeeze hint THEN the System SHALL highlight the constrained region and the forcing cells

### Requirement 12: Set Differentials

**User Story:** As a puzzle solver, I want the system to use set differential arguments, so that I can compare overlapping composite shapes to derive moves.

#### Acceptance Criteria

1. WHEN two composite shapes overlap and their star count difference forces specific cells THEN the System SHALL mark those cells as stars or crosses
2. WHEN the System computes a set differential THEN the System SHALL identify the two shapes and their symmetric difference
3. WHEN the System identifies a set differential THEN the System SHALL explain the two shapes, their star counts, and the differential logic
4. WHEN the System provides a set differential hint THEN the System SHALL highlight both composite shapes and the differential region

### Requirement 13: By a Thread

**User Story:** As a puzzle solver, I want the system to identify "by a thread" uniqueness patterns, so that I can use solution uniqueness to derive moves.

#### Acceptance Criteria

1. WHEN a cell's value is determined by assuming the puzzle has a unique solution THEN the System SHALL mark that cell using by-a-thread logic
2. WHEN the System applies by-a-thread logic THEN the System SHALL verify that both possible values lead to different solution counts
3. WHEN the System identifies a by-a-thread pattern THEN the System SHALL explain the uniqueness argument and the two cases considered
4. WHEN the System provides a by-a-thread hint THEN the System SHALL highlight the critical cell and the regions involved in the uniqueness argument

### Requirement 14: At Sea

**User Story:** As a puzzle solver, I want the system to identify "at sea" patterns where isolated regions force specific placements, so that I can use isolation logic.

#### Acceptance Criteria

1. WHEN a region or set of cells is isolated from other possibilities THEN the System SHALL derive forced moves from the isolation
2. WHEN the System identifies an at-sea pattern THEN the System SHALL explain the isolation and why it forces specific cells
3. WHEN the System provides an at-sea hint THEN the System SHALL highlight the isolated region and the forced cells

### Requirement 15: By a Thread at Sea

**User Story:** As a puzzle solver, I want the system to combine by-a-thread and at-sea logic, so that I can solve puzzles requiring both uniqueness and isolation reasoning.

#### Acceptance Criteria

1. WHEN a cell's value is determined by combining uniqueness and isolation arguments THEN the System SHALL mark that cell using combined logic
2. WHEN the System identifies a by-a-thread-at-sea pattern THEN the System SHALL explain both the uniqueness and isolation components
3. WHEN the System provides a by-a-thread-at-sea hint THEN the System SHALL highlight the critical cells and the isolated regions

### Requirement 16: Kissing Ls

**User Story:** As a puzzle solver, I want the system to recognize kissing L patterns, so that I can apply this idiosyncratic shape-based technique.

#### Acceptance Criteria

1. WHEN two L-shaped regions touch in a specific configuration THEN the System SHALL identify forced star placements based on the kissing L pattern
2. WHEN the System identifies kissing Ls THEN the System SHALL explain the L-shape configuration and the forcing logic
3. WHEN the System provides a kissing Ls hint THEN the System SHALL highlight both L-shaped regions and the forced cells

### Requirement 17: The M

**User Story:** As a puzzle solver, I want the system to recognize M-shaped patterns, so that I can apply this idiosyncratic shape-based technique.

#### Acceptance Criteria

1. WHEN a region forms an M-shape with specific properties THEN the System SHALL identify forced star placements based on the M pattern
2. WHEN the System identifies an M pattern THEN the System SHALL explain the M-shape configuration and the forcing logic
3. WHEN the System provides an M hint THEN the System SHALL highlight the M-shaped region and the forced cells

### Requirement 18: Pressured Ts

**User Story:** As a puzzle solver, I want the system to recognize pressured T patterns, so that I can apply this idiosyncratic shape-based technique.

#### Acceptance Criteria

1. WHEN a T-shaped region is under pressure from surrounding constraints THEN the System SHALL identify forced star placements
2. WHEN the System identifies a pressured T THEN the System SHALL explain the T-shape configuration and the pressure creating the forcing
3. WHEN the System provides a pressured T hint THEN the System SHALL highlight the T-shaped region and the forcing constraints

### Requirement 19: Fish

**User Story:** As a puzzle solver, I want the system to identify fish patterns analogous to Sudoku fish, so that I can apply advanced elimination logic.

#### Acceptance Criteria

1. WHEN a fish pattern exists across rows and columns THEN the System SHALL identify forced crosses in the elimination cells
2. WHEN the System identifies a fish pattern THEN the System SHALL explain the base rows/columns and cover rows/columns
3. WHEN the System provides a fish hint THEN the System SHALL highlight the base units, cover units, and elimination cells

### Requirement 20: N Rooks

**User Story:** As a puzzle solver, I want the system to identify N-rooks patterns, so that I can apply rook-based placement logic.

#### Acceptance Criteria

1. WHEN N cells in N different rows and columns must all contain stars THEN the System SHALL identify forced star placements using N-rooks logic
2. WHEN the System identifies an N-rooks pattern THEN the System SHALL explain the rook configuration and why the cells must be stars
3. WHEN the System provides an N-rooks hint THEN the System SHALL highlight the N cells forming the rook pattern

### Requirement 21: Entanglement

**User Story:** As a puzzle solver, I want the system to identify entanglement patterns where multiple constraints interact, so that I can solve puzzles requiring complex interaction analysis.

#### Acceptance Criteria

1. WHEN multiple constraints entangle to force specific cells THEN the System SHALL identify the forced moves using entanglement logic
2. WHEN the System identifies entanglement THEN the System SHALL explain the interacting constraints and how they combine to force moves
3. WHEN the System provides an entanglement hint THEN the System SHALL highlight all regions and constraints involved in the entanglement

### Requirement 22: Hint Presentation

**User Story:** As a puzzle solver, I want clear explanations and visual highlights for each hint, so that I can understand and learn from the logical techniques.

#### Acceptance Criteria

1. WHEN the System provides a hint THEN the System SHALL include the technique name, explanation text, and result cells
2. WHEN the System provides a hint THEN the System SHALL include visual highlights for relevant rows, columns, regions, and cells
3. WHEN the System provides a hint explanation THEN the System SHALL use clear English referencing specific rows, columns, and regions by number
4. WHEN the System provides a hint THEN the System SHALL ensure the hint is logically sound and never suggests an incorrect move
5. WHEN no logical hint can be found THEN the System SHALL return null to indicate no technique applies

### Requirement 23: Technique Ordering

**User Story:** As a puzzle solver, I want techniques applied in order from simplest to most complex, so that I learn basic techniques before advanced ones.

#### Acceptance Criteria

1. WHEN searching for hints THEN the System SHALL apply techniques in order: basics, counting, uniqueness, idiosyncrasies
2. WHEN multiple techniques could provide hints THEN the System SHALL return the hint from the earliest technique in the ordering
3. WHEN the System applies techniques THEN the System SHALL use the ordering: trivial-marks, two-by-two, one-by-n, exclusion, pressured-exclusion, simple-shapes, undercounting, overcounting, finned-counts, composite-shapes, squeeze, set-differentials, by-a-thread, at-sea, by-a-thread-at-sea, kissing-ls, the-m, pressured-ts, fish, n-rooks, entanglement
