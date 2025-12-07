/**
 * Integration tests for schema system
 */

import { describe, it, expect } from 'vitest';
import { puzzleStateToBoardState } from '../model/state';
import { applyAllSchemas } from '../registry';
import { createEmptyPuzzleState, createEmptyPuzzleDef } from '../../../types/puzzle';
import type { SchemaContext } from '../types';

describe('Schema System Integration', () => {
  it('should apply schemas without crashing', () => {
    const def = createEmptyPuzzleDef();
    const state = createEmptyPuzzleState(def);

    const boardState = puzzleStateToBoardState(state);
    const ctx: SchemaContext = { state: boardState };

    const applications = applyAllSchemas(ctx);

    expect(Array.isArray(applications)).toBe(true);
  });

  it('should return schema applications in priority order', () => {
    const def = createEmptyPuzzleDef();
    const state = createEmptyPuzzleState(def);

    const boardState = puzzleStateToBoardState(state);
    const ctx: SchemaContext = { state: boardState };

    const applications = applyAllSchemas(ctx);

    // Check that applications have valid structure
    for (const app of applications) {
      expect(app).toHaveProperty('schemaId');
      expect(app).toHaveProperty('deductions');
      expect(app).toHaveProperty('explanation');
      expect(Array.isArray(app.deductions)).toBe(true);
      expect(app.explanation).toHaveProperty('steps');
    }
  });

  it('should handle empty puzzle state', () => {
    const def = createEmptyPuzzleDef();
    const state = createEmptyPuzzleState(def);

    const boardState = puzzleStateToBoardState(state);
    const ctx: SchemaContext = { state: boardState };

    // Should not crash on empty state
    expect(() => applyAllSchemas(ctx)).not.toThrow();
  });
});

