/**
 * A4 – Region vs Column-Band Star Quota (Internal Partition)
 * 
 * Symmetric to A3 but with column bands.
 * 
 * Priority: 2
 */

import type { Schema, SchemaContext, SchemaApplication, ExplanationInstance } from '../types';
import type { Region, ColumnBand } from '../model/types';
import { enumerateColumnBands } from '../helpers/bandHelpers';
import { getCandidatesInRegionAndCols, getRegionBandQuota } from '../helpers/bandHelpers';
import { CellState } from '../model/types';

/**
 * A4 Schema implementation
 */
export const A4Schema: Schema = {
  id: 'A4_region_colBandPartition',
  kind: 'bandBudget',
  priority: 2,
  apply(ctx: SchemaContext): SchemaApplication[] {
    const applications: SchemaApplication[] = [];
    const { state } = ctx;

    // For each region
    for (const region of state.regions) {
      // Get all column bands that intersect this region
      const allBands = enumerateColumnBands(state);
      const intersectingBands = allBands.filter(band => {
        const regionCellsInBand = getCandidatesInRegionAndCols(region, band.cols, state);
        return regionCellsInBand.length > 0;
      });

      if (intersectingBands.length < 2) continue;

      // Try to find a band where we can deduce the quota
      for (const targetBand of intersectingBands) {
        const otherBands = intersectingBands.filter(b => b !== targetBand);

        let knownQuotas = 0;
        let totalKnownQuota = 0;

        for (const band of otherBands) {
          const quota = getRegionBandQuota(region, band, state);
          if (quota > 0) {
            knownQuotas++;
            totalKnownQuota += quota;
          }
        }

        if (knownQuotas === otherBands.length) {
          const regionQuota = region.starsRequired;
          const starsPlaced = region.cells.filter(
            cellId => state.cellStates[cellId] === CellState.Star
          ).length;
          const remainingStars = regionQuota - starsPlaced;

          const targetBandQuota = remainingStars - totalKnownQuota;

          if (targetBandQuota >= 0) {
            const candidatesInTargetBand = getCandidatesInRegionAndCols(
              region,
              targetBand.cols,
              state
            );

            if (targetBandQuota === candidatesInTargetBand.length && targetBandQuota > 0) {
              const deductions = candidatesInTargetBand.map(cell => ({
                cell,
                type: 'forceStar' as const,
              }));

              const explanation: ExplanationInstance = {
                schemaId: 'A4_region_colBandPartition',
                steps: [
                  {
                    kind: 'countRegionQuota',
                    entities: {
                      region: { kind: 'region', regionId: region.id },
                      quota: regionQuota,
                    },
                  },
                  {
                    kind: 'fixRegionBandQuota',
                    entities: {
                      region: { kind: 'region', regionId: region.id },
                      band: { kind: 'colBand', cols: targetBand.cols },
                      quota: targetBandQuota,
                    },
                  },
                ],
              };

              applications.push({
                schemaId: 'A4_region_colBandPartition',
                params: {
                  regionId: region.id,
                  targetBand: targetBand.cols,
                  quota: targetBandQuota,
                },
                deductions,
                explanation,
              });
            }
          }
        }
      }
    }

    return applications;
  },
};

