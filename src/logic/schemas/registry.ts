/**
 * Schema registry and application system
 */

import type { Schema, SchemaContext, SchemaApplication } from './types';

/**
 * Schema registry
 */
class SchemaRegistry {
  private schemas: Schema[] = [];

  /**
   * Register a schema
   */
  register(schema: Schema): void {
    this.schemas.push(schema);
    // Sort by priority (lower priority number = higher priority)
    this.schemas.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Get all schemas in priority order
   */
  getAllSchemas(): Schema[] {
    return [...this.schemas];
  }

  /**
   * Get schema by ID
   */
  getSchema(id: string): Schema | undefined {
    return this.schemas.find(s => s.id === id);
  }
}

// Global registry instance
const registry = new SchemaRegistry();

/**
 * Register a schema
 */
export function registerSchema(schema: Schema): void {
  registry.register(schema);
}

/**
 * Get all schemas in priority order
 */
export function getAllSchemas(): Schema[] {
  return registry.getAllSchemas();
}

/**
 * Get schema by ID
 */
export function getSchema(id: string): Schema | undefined {
  return registry.getSchema(id);
}

/**
 * Apply all schemas to a context
 * Returns all schema applications found
 */
export function applyAllSchemas(ctx: SchemaContext): SchemaApplication[] {
  const allApplications: SchemaApplication[] = [];
  
  for (const schema of getAllSchemas()) {
    try {
      const applications = schema.apply(ctx);
      allApplications.push(...applications);
    } catch (error) {
      console.warn(`Error applying schema ${schema.id}:`, error);
    }
  }
  
  return allApplications;
}

/**
 * Apply schemas until no progress is made
 * Returns true if any progress was made
 */
export function applySchemasUntilStable(ctx: SchemaContext): boolean {
  let progress = false;
  let iterations = 0;
  const maxIterations = 100; // Safety limit
  
  while (iterations < maxIterations) {
    const applications = applyAllSchemas(ctx);
    
    if (applications.length === 0) {
      break; // No more applications found
    }
    
    // Apply deductions (this would modify the state in real implementation)
    // For now, we just track that progress was made
    progress = true;
    iterations++;
    
    // In real implementation, we would:
    // 1. Apply deductions to state
    // 2. Recompute derived data
    // 3. Continue loop
  }
  
  return progress;
}

