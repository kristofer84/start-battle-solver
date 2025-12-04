# Implementation Plan

- [x] 1. Extend helper utilities for counting techniques
  - Add composite shape analysis functions to helpers.ts
  - Implement functions for computing min/max stars with 2×2 constraints
  - Add set operation utilities (intersection, union, difference)
  - _Requirements: 7.2, 8.2, 10.1_

- [x] 1.1 Write property test for set operations
  - **Property 1: All hints have required fields**
  - **Validates: Requirements 22.1**

- [x] 2. Implement pressured exclusion technique
  - Create pressuredExclusion.ts module
  - Implement logic to detect cells that would force 2×2 violations preventing unit satisfaction
  - Implement logic to detect cells that would force adjacency violations preventing unit satisfaction
  - Generate hints with clear explanations of the forcing chain
  - _Requirements: 5.1, 5.2_

- [x] 2.1 Write property test for pressured exclusion
  - **Property 8: Pressured exclusion considers 2×2 cascades**
  - **Validates: Requirements 5.1**

- [x] 2.2 Write property test for pressured exclusion adjacency
  - **Property 9: Pressured exclusion considers adjacency cascades**
  - **Validates: Requirements 5.2**

- [x] 3. Implement undercounting technique
  - Create undercounting.ts module
  - Implement composite shape identification for undercounting scenarios
  - Compute minimum star counts considering 2×2 and adjacency constraints
  - Identify cells that must be stars when minimum equals required
  - Generate hints with counting explanations and shape highlights
  - _Requirements: 7.1, 7.2, 7.4_

- [x] 3.1 Write property test for undercounting bounds
  - **Property 13: Undercounting respects 2×2 constraints**
  - **Validates: Requirements 7.2**

- [x] 3.2 Write property test for undercounting highlights





  - **Property 14: Undercounting hints include shape highlights**
  - **Validates: Requirements 7.4**












- [x] 4. Implement overcounting technique
  - Create overcounting.ts module
  - Implement composite shape identification for overcounting scenarios
  - Compute maximum star counts considering 2×2 and adjacency constraints
  - Identify cells that must be crosses when maximum equals current stars
  - Generate hints with counting explanations and shape highlights
  - _Requirements: 8.1, 8.2, 8.4_
-

- [x] 4.1 Write property test for overcounting bounds




  - **Property 15: Overcounting respects 2×2 constraints**
  - **Validates: Requirements 8.2**

- [x] 4.2 Write property test for overcounting highlights





  - **Property 16: Overcounting hints include shape highlights**
  - **Validates: Requirements 8.4**

- [x] 5. Implement composite shapes technique
  - Create compositeShapes.ts module
  - Implement general composite shape analysis (unions of regions/partial regions)
  - Compute min/max star bounds for arbitrary composite shapes
  - Identify forced cells based on shape bounds vs unit quotas
  - Generate hints explaining which regions form the shape
  - _Requirements: 10.1, 10.2, 10.4_
-

- [x] 5.1 Write property test for composite shape bounds




  - **Property 17: Composite shapes compute valid bounds**
  - **Validates: Requirements 10.1**

-

- [x] 5.2 Write property test for composite shape highlights



  - **Property 18: Composite shape hints include all regions**
  - **Validates: Requirements 10.4**

- [x] 6. Implement finned counts technique
  - Create finnedCounts.ts module
  - Detect counting arguments that hold except for specific fin cells
  - Perform case analysis on fin cells to derive forced moves
  - Generate hints explaining the main counting argument and the fin exception
  - _Requirements: 9.1, 9.3_

- [x] 6.1 Write unit test for finned count with single fin




  - Test specific example of finned counting pattern
  - Verify hint highlights both main shape and fin cells
  - _Requirements: 9.1, 9.3_

- [x] 7. Implement squeeze technique
  - Create squeeze.ts module
  - Identify units where stars must fit into constrained spaces
  - Detect spatial constraints from crosses and 2×2 blocks
  - Identify forced star placements in narrow corridors
  - Generate hints explaining the spatial constraint
  - _Requirements: 11.1, 11.3_
-

- [x] 7.1 Write unit test for squeeze in narrow corridor




  - Test specific example of squeeze pattern
  - Verify hint highlights constrained region and forcing cells
  - _Requirements: 11.1, 11.3_

- [x] 8. Implement set differentials technique
  - Create setDifferentials.ts module
  - Identify pairs of overlapping composite shapes
  - Compute star count differences between shapes
  - Identify forced cells in the symmetric difference
  - Generate hints explaining both shapes and the differential logic
  - _Requirements: 12.1, 12.2, 12.4_
- [x] 8.1 Write unit test for set differential with overlapping shapes




- [ ] 8.1 Write unit test for set differential with overlapping shapes

  - Test specific example of set differential pattern
  - Verify hint highlights both shapes and differential region
  - _Requirements: 12.1, 12.2, 12.4_

- [x] 9. Implement solution counter utility
  - Create search.ts module (or extend existing)
  - Implement backtracking solver that counts solutions
  - Add timeout mechanism to prevent long computations
  - Add depth limit for performance
  - _Requirements: 13.2_

- [x] 9.1 Write unit tests for solution counter





  - Test counting on puzzles with 0, 1, and multiple solutions
  - Test timeout mechanism
  - _Requirements: 13.2_

- [x] 10. Implement by-a-thread technique
  - Create byAThread.ts module
  - For each empty cell, test both star and cross hypotheses
  - Use solution counter to verify uniqueness
  - Identify cells where one hypothesis breaks uniqueness
  - Generate hints explaining the uniqueness argument
  - _Requirements: 13.1, 13.2, 13.4_

- [x] 10.1 Write unit test for by-a-thread uniqueness




  - Test specific example requiring uniqueness logic
  - Verify hint highlights critical cell and involved regions
  - _Requirements: 13.1, 13.2, 13.4_

- [x] 11. Implement at-sea technique




  - Create atSea.ts module in web/src/logic/techniques/
  - Identify isolated regions or cell sets
  - Derive forced moves from isolation constraints
  - Generate hints explaining the isolation
  - _Requirements: 14.1, 14.3_
-

- [x] 11.1 Write unit test for at-sea isolation





  - Test specific example of isolation pattern
  - Verify hint highlights isolated region and forced cells
  - _Requirements: 14.1, 14.3_
-

- [x] 12. Implement by-a-thread-at-sea technique




  - Create byAThreadAtSea.ts module in web/src/logic/techniques/
  - Combine uniqueness and isolation logic
  - Identify cells requiring both arguments
  - Generate hints explaining both components
  - _Requirements: 15.1, 15.3_

- [x] 12.1 Write unit test for by-a-thread-at-sea combination






  - Test specific example requiring both uniqueness and isolation
  - Verify hint highlights critical cells and isolated regions
  - _Requirements: 15.1, 15.3_

- [x] 13. Implement pattern matching utilities




  - Add shape detection functions to helpers.ts or new patternHelpers.ts
  - Implement L-shape detection
  - Implement M-shape detection
  - Implement T-shape detection
  - _Requirements: 16.1, 17.1, 18.1_

- [x] 13.1 Write unit tests for pattern matching






  - Test L-shape detection on various region configurations
  - Test M-shape detection
  - Test T-shape detection
  - _Requirements: 16.1, 17.1, 18.1_
-

- [x] 14. Implement kissing Ls technique




  - Create kissingLs.ts module in web/src/logic/techniques/
  - Detect pairs of L-shaped regions that touch
  - Analyze the kissing configuration for forcing
  - Identify forced star placements
  - Generate hints explaining the L-shape configuration
  - _Requirements: 16.1, 16.3_

- [x] 14.1 Write unit test for kissing Ls pattern







  - Test specific example of kissing Ls
  - Verify hint highlights both L-shaped regions and forced cells
  - _Requirements: 16.1, 16.3_
- [x] 15. Implement the M technique




- [ ] 15. Implement the M technique

  - Create theM.ts module in web/src/logic/techniques/
  - Detect M-shaped regions
  - Analyze M-shape properties for forcing
  - Identify forced star placements
  - Generate hints explaining the M-shape configuration
  - _Requirements: 17.1, 17.3_

- [x] 15.1 Write unit test for M-shape pattern







  - Test specific example of M-shape
  - Verify hint highlights M-shaped region and forced cells
  - _Requirements: 17.1, 17.3_
-

- [x] 16. Implement pressured Ts technique




  - Create pressuredTs.ts module in web/src/logic/techniques/
  - Detect T-shaped regions
  - Analyze surrounding constraints creating pressure
  - Identify forced star placements from pressure
  - Generate hints explaining the T-shape and pressure
  - _Requirements: 18.1, 18.3_

- [x] 16.1 Write unit test for pressured T pattern







  - Test specific example of pressured T
  - Verify hint highlights T-shaped region and forcing constraints
  - _Requirements: 18.1, 18.3_
- [x] 17. Implement fish technique




- [ ] 17. Implement fish technique

  - Create fish.ts module in web/src/logic/techniques/
  - Detect fish patterns across rows and columns (analogous to Sudoku)
  - Identify base rows/columns and cover rows/columns
  - Identify elimination cells
  - Generate hints explaining the fish pattern
  - _Requirements: 19.1, 19.3_
-

- [x] 17.1 Write unit test for fish pattern





  - Test specific example of fish
  - Verify hint highlights base units, cover units, and elimination cells
  - _Requirements: 19.1, 19.3_
-

- [x] 18. Implement N-rooks technique




  - Create nRooks.ts module in web/src/logic/techniques/
  - Detect N cells in N different rows and columns that must all be stars
  - Identify the rook configuration
  - Generate hints explaining the rook placement logic
  - _Requirements: 20.1, 20.3_

- [x] 18.1 Write unit test for N-rooks pattern






  - Test specific example of N-rooks
  - Verify hint highlights the N cells forming the rook pattern
  - _Requirements: 20.1, 20.3_

- [x] 19. Implement entanglement technique




  - Create entanglement.ts module in web/src/logic/techniques/
  - Detect multiple interacting constraints
  - Analyze constraint entanglement for forcing
  - Identify forced moves from constraint interactions
  - Generate hints explaining the interacting constraints
  - _Requirements: 21.1, 21.3_

- [x] 19.1 Write unit test for entanglement pattern






  - Test specific example of entanglement
  - Verify hint highlights all regions and constraints involved
  - _Requirements: 21.1, 21.3_
-

- [x] 20. Update technique registry




  - Update techniques.ts to replace stub implementations with actual technique imports
  - Verify all techniques are registered in correct order
  - Ensure techniqueNameById mapping is complete
  - _Requirements: 23.1, 23.2, 23.3_

- [x] 20.1 Write unit test for technique ordering






  - Test that techniques are in the correct order
  - Test specific example where ordering can be verified
  - _Requirements: 23.3_


- [x] 20.2 Write property test for technique priority










  - **Property 22: Technique ordering is respected**
  - **Validates: Requirements 23.1, 23.2**
-

- [x] 21. Add comprehensive property-based tests for basic techniques




  - Create generators for valid puzzle states in a shared test utilities file
  - Implement property tests for basic techniques (trivial-marks through simple-shapes)
  - Each property test should run at least 100 iterations
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4_

- [x] 21.1 Write property test for unit saturation







  - **Property 1: Unit saturation forces crosses**
  - **Validates: Requirements 1.1, 1.2, 1.3**

- [x] 21.2 Write property test for star adjacency







  - **Property 2: Star adjacency forces crosses**
  - **Validates: Requirements 1.4**
- [x] 21.3 Write property test for 2×2 blocks




- [x] 21.3 Write property test for 2×2 blocks



  - **Property 3: 2×2 with one star forces crosses**
  - **Validates: Requirements 2.1**
-

- [x] 21.4 Write property test for 2×2 highlights






  - **Property 4: 2×2 hints include block highlights**
  - **Validates: Requirements 2.2**

-

- [x] 21.5 Write property test for 1×N bands





  - **Property 5: 1×N bands force stars**
  - **Validates: Requirements 3.1, 3.2, 3.3**
-

- [x] 21.6 Write property test for exclusion quota violations






  - **Property 6: Exclusion prevents quota violations**
  - **Validates: Requirements 4.1, 4.2, 4.3**
- [x] 21.7 Write property test for exclusion insufficient empties




- [x] 21.7 Write property test for exclusion insufficient empties



  - **Property 7: Exclusion prevents insufficient empties**
  - **Validates: Requirements 4.4**

- [x] 21.8 Write property test for simple shapes horizontal







  - **Property 10: Horizontal 1×4 regions force row crosses**
  - **Validates: Requirements 6.1**
-

- [x] 21.9 Write property test for simple shapes vertical






  - **Property 11: Vertical 4×1 regions force column crosses**
  - **Validates: Requirements 6.2**
-

- [x] 21.10 Write property test for strip adjacency






  - **Property 12: Strip adjacency forces crosses**
  - **Validates: Requirements 6.3**
-

- [x] 21.11 Write property test for hint structure






  - **Property 19: All hints have required fields**
  - **Validates: Requirements 22.1**
-

- [x] 21.12 Write property test for hint highlights






  - **Property 20: All hints include highlights**
  - **Validates: Requirements 22.2**

-

- [x] 21.13 Write property test for hint soundness






  - **Property 21: Hints are sound**
  - **Validates: Requirements 22.4**
-

- [x] 22. Add edge case tests



  - Create edge case test file in web/tests/
  - Test empty puzzle (no hints available)
  - Test completed puzzle (no hints available)
  - Test invalid states (too many stars, adjacent stars)
  - _Requirements: 22.5_




- [x] 22.1 Write edge case test for no hints available



  - Test that findNextHint returns null when no technique applies
  - _Requirements: 22.5_


- [x] 23. Integration testing with example puzzles


  - Create integration test file in web/tests/
  - Extract puzzle positions from "A Star Battle Guide" PDF or create representative examples
  - Create test cases for each technique demonstration

  - Verify system identifies the same forced moves as expected
  - Test complete puzzle solving sequences
  - _Requirements: All_
- [x] 23.1 Write integration tests for guide examples




- [x] 23.1 Write integration tests for guide examples


  - Test puzzles from each section (basics, counting, uniqueness, idiosyncrasies)
  - Verify technique identification matches expected technique
  - _Requirements: All_
-

- [x] 24. Final checkpoint - Ensure all tests pass




  - Run all tests with `pnpm test`
  - Ensure all tests pass, ask the user if questions arise.
