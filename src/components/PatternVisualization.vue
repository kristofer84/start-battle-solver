<script setup lang="ts">
import { computed } from 'vue';
import type { LoadedEntanglementSpec, PairEntanglementPattern, TripleRule, ConstrainedRule, PureEntanglementTemplate } from '../types/entanglements';
import { getTripleRuleId, getConstrainedRuleId, getPairPatternId } from '../logic/entanglements/loader';

const props = defineProps<{
  spec: LoadedEntanglementSpec;
  patternId: string;
}>();

const pattern = computed(() => {
  if (props.spec.pairData) {
    for (const p of props.spec.pairData.patterns) {
      if (getPairPatternId(p) === props.patternId) {
        return { type: 'pair' as const, data: p };
      }
    }
  } else if (props.spec.tripleData) {
    for (const r of props.spec.tripleData.unconstrained_rules) {
      if (getTripleRuleId(r) === props.patternId) {
        return { type: 'triple-unconstrained' as const, data: r };
      }
    }
    for (const r of props.spec.tripleData.constrained_rules) {
      if (getTripleRuleId(r) === props.patternId) {
        return { type: 'triple-constrained' as const, data: r };
      }
    }
  } else if (props.spec.constrainedData) {
    for (const r of props.spec.constrainedData.unconstrained_rules) {
      if (getConstrainedRuleId(r) === props.patternId) {
        return { type: 'constrained-unconstrained' as const, data: r };
      }
    }
    for (const r of props.spec.constrainedData.constrained_rules) {
      if (getConstrainedRuleId(r) === props.patternId) {
        return { type: 'constrained-constrained' as const, data: r };
      }
    }
  } else if (props.spec.pureData) {
    // Pure patterns don't have IDs generated, so we'll need to match by content
    // For now, return null - we can enhance this later
    return null;
  }
  return null;
});

const boardSize = computed(() => props.spec.boardSize);

// Compute constraint visualization data
const constraintVisualization = computed(() => {
  if (!pattern.value) return { constraintCells: new Set<string>(), constraintRows: new Set<number>(), constraintCols: new Set<number>(), descriptions: [] };
  
  const constraintCells = new Set<string>();
  const constraintRows = new Set<number>();
  const constraintCols = new Set<number>();
  const descriptions: string[] = [];
  
  let constraintFeatures: string[] = [];
  let candidateCoords: [number, number] | null = null;
  let starCoords: [number, number][] = [];
  
  if (pattern.value.type.startsWith('triple')) {
    const rule = pattern.value.data as TripleRule;
    constraintFeatures = rule.constraint_features;
    candidateCoords = rule.canonical_candidate;
    starCoords = rule.canonical_stars;
  } else if (pattern.value.type.startsWith('constrained')) {
    const rule = pattern.value.data as ConstrainedRule;
    constraintFeatures = rule.constraint_features;
    // For constrained rules, we need to find the candidate from forced_empty
    // But actually, constrained rules have canonical_forced_empty, not a single candidate
    // Let's visualize based on the forced empty cells
    starCoords = rule.canonical_stars;
  }
  
  // Calculate offsets for canonical coordinates
  let offsetRow = 0;
  let offsetCol = 0;
  if (pattern.value.type.startsWith('triple') || pattern.value.type.startsWith('constrained')) {
    const rule = pattern.value.type.startsWith('triple') 
      ? (pattern.value.data as TripleRule)
      : (pattern.value.data as ConstrainedRule);
    const allCoords = pattern.value.type.startsWith('triple')
      ? [...rule.canonical_stars, rule.canonical_candidate]
      : [...rule.canonical_stars, ...(rule as ConstrainedRule).canonical_forced_empty];
    const minRow = Math.min(...allCoords.map(c => c[0]));
    const minCol = Math.min(...allCoords.map(c => c[1]));
    offsetRow = Math.max(0, -minRow);
    offsetCol = Math.max(0, -minCol);
  }
  
  // Map canonical stars to board coordinates
  const mappedStars = starCoords.map(([r, c]) => [r + offsetRow, c + offsetCol] as [number, number]);
  const mappedCandidate = candidateCoords ? [candidateCoords[0] + offsetRow, candidateCoords[1] + offsetCol] as [number, number] : null;
  
  for (const feature of constraintFeatures) {
    if (feature === 'candidate_on_outer_ring') {
      descriptions.push('Candidate must be on the outer edge of the board');
      // Mark all edge cells (row 0, row size-1, col 0, col size-1)
      for (let r = 0; r < boardSize.value; r++) {
        constraintCells.add(`${r},0`);
        constraintCells.add(`${r},${boardSize.value - 1}`);
      }
      for (let c = 0; c < boardSize.value; c++) {
        constraintCells.add(`0,${c}`);
        constraintCells.add(`${boardSize.value - 1},${c}`);
      }
    } else if (feature === 'candidate_in_ring_1') {
      descriptions.push('Candidate must be in ring 1 (one cell away from edge, excluding corners)');
      // Mark ring 1 cells: row 1 or size-2 (excluding corners), or col 1 or size-2 (excluding corners)
      for (let r = 1; r < boardSize.value - 1; r++) {
        constraintCells.add(`${r},1`);
        constraintCells.add(`${r},${boardSize.value - 2}`);
      }
      for (let c = 1; c < boardSize.value - 1; c++) {
        constraintCells.add(`1,${c}`);
        constraintCells.add(`${boardSize.value - 2},${c}`);
      }
    } else if (feature === 'candidate_in_same_row_as_any_star') {
      descriptions.push('Candidate must be in the same row as one of the stars');
      // Mark rows containing stars
      for (const [r] of mappedStars) {
        if (r >= 0 && r < boardSize.value) {
          constraintRows.add(r);
        }
      }
    } else if (feature === 'candidate_in_same_col_as_any_star') {
      descriptions.push('Candidate must be in the same column as one of the stars');
      // Mark columns containing stars
      for (const [, c] of mappedStars) {
        if (c >= 0 && c < boardSize.value) {
          constraintCols.add(c);
        }
      }
    } else {
      // Unknown feature - just add description
      descriptions.push(`Requires: ${feature}`);
    }
  }
  
  return { constraintCells, constraintRows, constraintCols, descriptions };
});

// Create a minimal puzzle state for visualization
const visualizationState = computed(() => {
  const cells: ('empty' | 'star' | 'cross')[][] = Array(boardSize.value)
    .fill(null)
    .map(() => Array(boardSize.value).fill('empty'));

  if (!pattern.value) return cells;

  if (pattern.value.type === 'pair') {
    const p = pattern.value.data as PairEntanglementPattern;
    // Mark initial stars
    for (const [r, c] of p.initial_stars) {
      if (r >= 0 && r < boardSize.value && c >= 0 && c < boardSize.value) {
        cells[r][c] = 'star';
      }
    }
    // Mark forced empty
    if (p.forced_empty) {
      for (const [r, c] of p.forced_empty) {
        if (r >= 0 && r < boardSize.value && c >= 0 && c < boardSize.value) {
          cells[r][c] = 'cross';
        }
      }
    }
    // Mark forced star
    if (p.forced_star) {
      for (const [r, c] of p.forced_star) {
        if (r >= 0 && r < boardSize.value && c >= 0 && c < boardSize.value) {
          cells[r][c] = 'star';
        }
      }
    }
  } else if (pattern.value.type.startsWith('triple')) {
    const rule = pattern.value.data as TripleRule;
    // For canonical patterns, coordinates might be outside the board
    // We'll center them or show them as-is if they fit
    const minRow = Math.min(...rule.canonical_stars.map(s => s[0]), rule.canonical_candidate[0]);
    const minCol = Math.min(...rule.canonical_stars.map(s => s[1]), rule.canonical_candidate[1]);
    const offsetRow = Math.max(0, -minRow);
    const offsetCol = Math.max(0, -minCol);
    
    // Mark canonical stars
    for (const [starRow, starCol] of rule.canonical_stars) {
      const row = starRow + offsetRow;
      const col = starCol + offsetCol;
      if (row >= 0 && row < boardSize.value && col >= 0 && col < boardSize.value) {
        cells[row][col] = 'star';
      }
    }
    // Mark candidate (forced empty)
    const [cr, cc] = rule.canonical_candidate;
    const candidateRow = cr + offsetRow;
    const candidateCol = cc + offsetCol;
    if (candidateRow >= 0 && candidateRow < boardSize.value && candidateCol >= 0 && candidateCol < boardSize.value) {
      cells[candidateRow][candidateCol] = 'cross';
    }
  } else if (pattern.value.type.startsWith('constrained')) {
    const rule = pattern.value.data as ConstrainedRule;
    const minRow = Math.min(...rule.canonical_stars.map(s => s[0]), ...rule.canonical_forced_empty.map(e => e[0]));
    const minCol = Math.min(...rule.canonical_stars.map(s => s[1]), ...rule.canonical_forced_empty.map(e => e[1]));
    const offsetRow = Math.max(0, -minRow);
    const offsetCol = Math.max(0, -minCol);
    
    // Mark canonical stars
    for (const [starRow, starCol] of rule.canonical_stars) {
      const row = starRow + offsetRow;
      const col = starCol + offsetCol;
      if (row >= 0 && row < boardSize.value && col >= 0 && col < boardSize.value) {
        cells[row][col] = 'star';
      }
    }
    // Mark forced empty
    for (const [emptyRow, emptyCol] of rule.canonical_forced_empty) {
      const row = emptyRow + offsetRow;
      const col = emptyCol + offsetCol;
      if (row >= 0 && row < boardSize.value && col >= 0 && col < boardSize.value) {
        cells[row][col] = 'cross';
      }
    }
  }

  return cells;
});
</script>

<template>
  <div v-if="pattern" style="margin-top: 1rem">
    <div style="font-size: 0.8rem; font-weight: 600; margin-bottom: 0.5rem">
      Pattern Visualization
    </div>
    <div class="pattern-board" :style="{ '--board-size': boardSize }">
      <div
        v-for="(row, r) in visualizationState"
        :key="`row-${r}`"
        class="pattern-board-row"
      >
        <div
          v-for="(cell, c) in row"
          :key="`cell-${r}-${c}`"
          class="pattern-board-cell"
          :class="{
            'pattern-star': cell === 'star',
            'pattern-cross': cell === 'cross',
            'pattern-constraint-cell': constraintVisualization.constraintCells.has(`${r},${c}`),
            'pattern-constraint-row': constraintVisualization.constraintRows.has(r),
            'pattern-constraint-col': constraintVisualization.constraintCols.has(c),
          }"
        >
          <span v-if="cell === 'star'">★</span>
          <span v-else-if="cell === 'cross'">✕</span>
        </div>
      </div>
    </div>
    <div style="font-size: 0.7rem; color: #94a3b8; margin-top: 0.5rem">
      <div v-if="pattern.type === 'pair'">
        <div>Initial stars: {{ (pattern.data as PairEntanglementPattern).initial_stars.map(c => `(${c[0]},${c[1]})`).join(', ') }}</div>
        <div v-if="(pattern.data as PairEntanglementPattern).forced_empty?.length">
          Forced empty: {{ (pattern.data as PairEntanglementPattern).forced_empty!.map(c => `(${c[0]},${c[1]})`).join(', ') }}
        </div>
        <div v-if="(pattern.data as PairEntanglementPattern).forced_star?.length">
          Forced star: {{ (pattern.data as PairEntanglementPattern).forced_star!.map(c => `(${c[0]},${c[1]})`).join(', ') }}
        </div>
      </div>
      <div v-else-if="pattern.type.startsWith('triple')">
        <div>Canonical stars: {{ (pattern.data as TripleRule).canonical_stars.map(c => `(${c[0]},${c[1]})`).join(', ') }}</div>
        <div>Candidate: ({{ (pattern.data as TripleRule).canonical_candidate[0] }},{{ (pattern.data as TripleRule).canonical_candidate[1] }})</div>
        <div v-if="(pattern.data as TripleRule).constraint_features.length">
          <div style="margin-top: 0.5rem; padding: 0.5rem; background: rgba(59, 130, 246, 0.1); border-radius: 0.25rem; border-left: 3px solid #3b82f6">
            <div style="font-weight: 600; margin-bottom: 0.3rem; color: #93c5fd">Constraint Requirements:</div>
            <div v-for="(desc, idx) in constraintVisualization.descriptions" :key="idx" style="margin-top: 0.2rem">
              • {{ desc }}
            </div>
            <div style="margin-top: 0.3rem; font-size: 0.65rem; opacity: 0.8">
              Raw features: {{ (pattern.data as TripleRule).constraint_features.join(', ') }}
            </div>
          </div>
        </div>
      </div>
      <div v-else-if="pattern.type.startsWith('constrained')">
        <div>Canonical stars: {{ (pattern.data as ConstrainedRule).canonical_stars.map(c => `(${c[0]},${c[1]})`).join(', ') }}</div>
        <div>Forced empty: {{ (pattern.data as ConstrainedRule).canonical_forced_empty.map(c => `(${c[0]},${c[1]})`).join(', ') }}</div>
        <div v-if="(pattern.data as ConstrainedRule).constraint_features.length">
          <div style="margin-top: 0.5rem; padding: 0.5rem; background: rgba(59, 130, 246, 0.1); border-radius: 0.25rem; border-left: 3px solid #3b82f6">
            <div style="font-weight: 600; margin-bottom: 0.3rem; color: #93c5fd">Constraint Requirements:</div>
            <div v-for="(desc, idx) in constraintVisualization.descriptions" :key="idx" style="margin-top: 0.2rem">
              • {{ desc }}
            </div>
            <div style="margin-top: 0.3rem; font-size: 0.65rem; opacity: 0.8">
              Raw features: {{ (pattern.data as ConstrainedRule).constraint_features.join(', ') }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pattern-board {
  display: inline-grid;
  grid-template-columns: repeat(var(--board-size), 1fr);
  gap: 1px;
  background: rgba(148, 163, 184, 0.3);
  border: 1px solid rgba(148, 163, 184, 0.4);
  border-radius: 0.25rem;
  padding: 2px;
  max-width: 400px;
}

.pattern-board-row {
  display: contents;
}

.pattern-board-cell {
  aspect-ratio: 1;
  background: rgba(15, 23, 42, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  min-width: 20px;
  min-height: 20px;
}

.pattern-star {
  color: #fbbf24;
}

.pattern-cross {
  color: #ef4444;
}

.pattern-constraint-cell {
  background: rgba(59, 130, 246, 0.2) !important;
  border: 1px dashed rgba(59, 130, 246, 0.5);
}

.pattern-constraint-row {
  background: rgba(59, 130, 246, 0.1) !important;
}

.pattern-constraint-col {
  background: rgba(59, 130, 246, 0.1) !important;
}

.pattern-constraint-cell.pattern-constraint-row,
.pattern-constraint-cell.pattern-constraint-col {
  background: rgba(59, 130, 246, 0.25) !important;
}
</style>

