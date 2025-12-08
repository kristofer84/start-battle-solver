/**
 * Runtime schema application system
 * Integrates with the existing solver hint system
 */

import type { PuzzleState } from '../../types/puzzle';
import type { Hint, HintHighlight } from '../../types/hints';
import { puzzleStateToBoardState } from './model/state';
import { applyAllSchemas } from './registry';
import type { SchemaApplication, SchemaContext } from './types';
import { renderExplanation } from './explanations/templates';
import { getAllPatternApplications } from '../patterns/runtime';

/**
 * Convert schema application to hint format
 */
function schemaApplicationToHint(app: SchemaApplication, state: PuzzleState): {
  id: string;
  technique: 'schema-based';
  explanation: string;
  forcedStars: Array<{ row: number; col: number }>;
  forcedCrosses: Array<{ row: number; col: number }>;
  highlights?: HintHighlight;
} {
  const { def } = state;
  
  // Convert deductions to hint format
  const forcedStars: Array<{ row: number; col: number }> = [];
  const forcedCrosses: Array<{ row: number; col: number }> = [];
  
  for (const deduction of app.deductions) {
    const row = Math.floor(deduction.cell / def.size);
    const col = deduction.cell % def.size;
    
    if (deduction.type === 'forceStar') {
      forcedStars.push({ row, col });
    } else {
      forcedCrosses.push({ row, col });
    }
  }
  
  // Build explanation text using templates
  const ctx: SchemaContext = {
    state: puzzleStateToBoardState(state),
  };
  const explanationLines = renderExplanation(app.explanation, ctx);
  
  // Extract highlights from explanation entities
  const highlights: HintHighlight = {
    cells: [],
    rows: [],
    cols: [],
    regions: [],
  };
  
  for (const step of app.explanation.steps) {
    if (step.entities.band) {
      if (step.entities.band.rows) {
        highlights.rows?.push(...step.entities.band.rows);
      }
      if (step.entities.band.cols) {
        highlights.cols?.push(...step.entities.band.cols);
      }
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
  
  // Add deduction cells to highlights
  for (const deduction of app.deductions) {
    const row = Math.floor(deduction.cell / def.size);
    const col = deduction.cell % def.size;
    highlights.cells?.push({ row, col });
  }
  
  return {
    id: `schema-${app.schemaId}-${Date.now()}`,
    technique: 'schema-based',
    explanation: explanationLines.join(' ') || `Schema ${app.schemaId} found ${app.deductions.length} deduction(s)`,
    forcedStars,
    forcedCrosses,
    highlights: highlights.cells?.length || highlights.rows?.length || highlights.cols?.length || highlights.regions?.length
      ? highlights
      : undefined,
  };
}

/**
 * Find schema-based hints for a puzzle state
 * Returns an intermediate format with forcedStars and forcedCrosses
 * that will be converted to a Hint by findSchemaBasedHint
 */
export function findSchemaHints(state: PuzzleState): {
  id: string;
  technique: 'schema-based';
  explanation: string;
  forcedStars: Array<{ row: number; col: number }>;
  forcedCrosses: Array<{ row: number; col: number }>;
  highlights?: HintHighlight;
} | null {
  // Convert to board state
  const boardState = puzzleStateToBoardState(state);
  
  // Create schema context
  const ctx: SchemaContext = {
    state: boardState,
  };
  
  // Apply all schemas
  let applications = applyAllSchemas(ctx);
  
  // Schema-based pattern matching is disabled.
  // The entanglement patterns technique (entanglementPatterns.ts) works well
  // and is separate from this schema-based pattern system.
  // Schema-based patterns require more sophisticated validation to ensure they match
  // the logical structure (region IDs, quotas, band configurations) correctly.
  // For now, we rely on direct schema implementations which work correctly.
  // const patternApplications = getAllPatternApplications(ctx);
  // applications = [...applications, ...patternApplications];
  
  // Filter out applications with no valid deductions (cells already filled)
  // Create new application objects to avoid mutating the original
  applications = applications.map(app => {
    const validDeductions = app.deductions.filter(ded => {
      const row = Math.floor(ded.cell / state.def.size);
      const col = ded.cell % state.def.size;
      const currentValue = state.cells[row][col];
      
      // Skip if cell is already filled with the same value
      if (ded.type === 'forceStar' && currentValue === 'star') return false;
      if (ded.type === 'forceEmpty' && currentValue === 'cross') return false;
      
      // Skip if deduction conflicts with current state
      if (ded.type === 'forceStar' && currentValue === 'cross') return false;
      if (ded.type === 'forceEmpty' && currentValue === 'star') return false;
      
      return true; // Valid deduction
    });
    
    // Return a new application object with filtered deductions
    return {
      ...app,
      deductions: validDeductions,
    };
  }).filter(app => app.deductions.length > 0);
  
  if (applications.length === 0) {
    return null;
  }

  // Debug: Log which schema produced the hint
  const firstApp = applications[0];
  if (firstApp.deductions.length > 10) {
    console.warn(`[SCHEMA DEBUG] Schema ${firstApp.schemaId} produced ${firstApp.deductions.length} deductions:`, 
      firstApp.deductions.slice(0, 5).map(d => {
        const row = Math.floor(d.cell / state.def.size);
        const col = d.cell % state.def.size;
        return `${d.type}@(${row},${col})`;
      }).join(', '), '...');
  }

  // Return the first (highest priority) application as a hint
  // In full implementation, we might want to return multiple hints or combine them
  return schemaApplicationToHint(applications[0], state);
}

/**
 * Apply schema deductions to puzzle state
 * Returns new state with deductions applied
 */
export function applySchemaDeductions(
  state: PuzzleState,
  applications: SchemaApplication[]
): PuzzleState {
  const newCells = state.cells.map(row => [...row]);
  
  for (const app of applications) {
    for (const deduction of app.deductions) {
      const row = Math.floor(deduction.cell / state.def.size);
      const col = deduction.cell % state.def.size;
      
      if (deduction.type === 'forceStar') {
        newCells[row][col] = 'star';
      } else {
        newCells[row][col] = 'cross';
      }
    }
  }
  
  return {
    ...state,
    cells: newCells,
  };
}

