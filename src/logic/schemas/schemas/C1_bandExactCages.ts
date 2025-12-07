/**
 * C1 – Exact-Match 2×2 Cages in a Band
 * 
 * If number of valid 2×2 blocks equals remaining stars in band,
 * each block must contain exactly one star.
 * 
 * Priority: 4
 */

import type { Schema, SchemaContext, SchemaApplication, ExplanationInstance } from '../types';
import type { RowBand, ColumnBand } from '../model/types';
import { enumerateBands } from '../helpers/bandHelpers';
import { computeRemainingStarsInBand, getValidBlocksInBand } from '../helpers/bandHelpers';

/**
 * C1 Schema implementation
 */
export const C1Schema: Schema = {
  id: 'C1_band_exactCages',
  kind: 'cage2x2',
  priority: 4,
  apply(ctx: SchemaContext): SchemaApplication[] {
    const applications: SchemaApplication[] = [];
    const { state } = ctx;

    // Enumerate all bands (row and column)
    const bands = enumerateBands(state);

    for (const band of bands) {
      const remaining = computeRemainingStarsInBand(band, state);
      if (remaining <= 0) continue;

      const validBlocks = getValidBlocksInBand(band, state);
      if (validBlocks.length !== remaining) continue;

      // C1 condition met: exactly as many blocks as remaining stars
      // Each block must contain exactly one star
      // This is meta-information (no direct cell deductions, but sets up for C2)

      const explanation: ExplanationInstance = {
        schemaId: 'C1_band_exactCages',
        steps: [
          {
            kind: 'countStarsInBand',
            entities: {
              band: band.type === 'rowBand'
                ? { kind: 'rowBand', rows: band.rows }
                : { kind: 'colBand', cols: band.cols },
              remainingStars: remaining,
            },
          },
          {
            kind: 'identifyCandidateBlocks',
            entities: {
              blocks: validBlocks.map(b => ({ kind: 'block2x2', blockId: b.id })),
              blockCount: validBlocks.length,
            },
          },
          {
            kind: 'applyPigeonhole',
            entities: {
              note: 'Each block must contain exactly one star',
            },
          },
        ],
      };

      applications.push({
        schemaId: 'C1_band_exactCages',
        params: {
          bandKind: band.type,
          rows: band.type === 'rowBand' ? band.rows : undefined,
          cols: band.type === 'colBand' ? band.cols : undefined,
          remainingStars: remaining,
          blocks: validBlocks.map(b => b.id),
        },
        deductions: [], // C1 alone does not force specific cells
        explanation,
      });
    }

    return applications;
  },
};

