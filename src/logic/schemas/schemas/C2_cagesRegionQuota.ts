/**
 * C2 – 2×2 Cages vs Region Quota
 * 
 * If a region fully covers some blocks in a band where C1 holds,
 * and the number of fully-covered blocks equals the region's band quota,
 * then all other region cells in the band are forced empty.
 * 
 * Priority: 4
 */

import type { Schema, SchemaContext, SchemaApplication, ExplanationInstance } from '../types';
import type { RowBand, ColumnBand, Block2x2 } from '../model/types';
import { enumerateBands } from '../helpers/bandHelpers';
import {
  computeRemainingStarsInBand,
  getValidBlocksInBand,
  getRegionsIntersectingBand,
  getCellsOfRegionInBand,
  getRegionBandQuota,
} from '../helpers/bandHelpers';

/**
 * C2 Schema implementation
 */
export const C2Schema: Schema = {
  id: 'C2_cages_regionQuota',
  kind: 'cage2x2',
  priority: 4,
  apply(ctx: SchemaContext): SchemaApplication[] {
    const applications: SchemaApplication[] = [];
    const { state } = ctx;

    // Enumerate all bands
    const bands = enumerateBands(state);

    for (const band of bands) {
      const validBlocks = getValidBlocksInBand(band, state);
      const remaining = computeRemainingStarsInBand(band, state);

      // Require C1 condition: validBlocks.length === remaining
      if (validBlocks.length !== remaining) continue;

      // Get regions intersecting this band
      const regions = getRegionsIntersectingBand(state, band);

      for (const region of regions) {
        const quotaDB = getRegionBandQuota(region, band, state);
        if (quotaDB <= 0) continue;

        const dCellsInBand = getCellsOfRegionInBand(region, band, state);

        // Find blocks fully covered by this region
        const fullBlocksForD = validBlocks.filter(block => {
          // All 4 cells of block must be in region's band cells
          const blockCellSet = new Set(block.cells);
          return block.cells.every(cell => dCellsInBand.includes(cell));
        });

        const c = fullBlocksForD.length;

        // If number of fully-covered blocks equals region's band quota
        if (c === quotaDB) {
          // Region's stars in band must be inside these blocks
          const cellsInFullBlocks = new Set<number>(
            fullBlocksForD.flatMap(b => b.cells)
          );

          // Find cells in region's band that are NOT in fully-covered blocks
          const deductions = dCellsInBand
            .filter(cell => !cellsInFullBlocks.has(cell))
            .map(cell => ({
              cell,
              type: 'forceEmpty' as const,
            }));

          if (deductions.length === 0) continue;

          const explanation: ExplanationInstance = {
            schemaId: 'C2_cages_regionQuota',
            steps: [
              {
                kind: 'countRegionQuota',
                entities: {
                  region: { kind: 'region', regionId: region.id },
                  band: band.type === 'rowBand'
                    ? { kind: 'rowBand', rows: band.rows }
                    : { kind: 'colBand', cols: band.cols },
                  quota: quotaDB,
                },
              },
              {
                kind: 'assignCageStars',
                entities: {
                  region: { kind: 'region', regionId: region.id },
                  blocks: fullBlocksForD.map(b => ({ kind: 'block2x2', blockId: b.id })),
                },
              },
              {
                kind: 'eliminateOtherRegionCells',
                entities: {
                  region: { kind: 'region', regionId: region.id },
                  cells: deductions.map(d => d.cell),
                },
              },
            ],
          };

          applications.push({
            schemaId: 'C2_cages_regionQuota',
            params: {
              bandKind: band.type,
              regionId: region.id,
              blocks: validBlocks.map(b => b.id),
              fullBlocksForRegion: fullBlocksForD.map(b => b.id),
              quotaDB,
            },
            deductions,
            explanation,
          });
        }
      }
    }

    return applications;
  },
};

