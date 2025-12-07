/**
 * A3 – Region vs Row-Band Star Quota (Internal Partition)
 * 
 * Inside a region, its cells are partitioned by row bands.
 * If quotas in some bands are known, deduce the quota for the remaining band.
 * 
 * Priority: 2
 */

import type { Schema, SchemaContext, SchemaApplication, ExplanationInstance } from '../types';
import type { Region, RowBand } from '../model/types';
import { enumerateRowBands } from '../helpers/bandHelpers';
import { getCandidatesInRegionAndRows, getRegionBandQuota } from '../helpers/bandHelpers';
import { getStarCountInCells } from '../helpers/cellHelpers';
import { CellState } from '../model/types';

/**
 * A3 Schema implementation
 */
export const A3Schema: Schema = {
  id: 'A3_region_rowBandPartition',
  kind: 'bandBudget',
  priority: 2,
  apply(ctx: SchemaContext): SchemaApplication[] {
    const applications: SchemaApplication[] = [];
    const { state } = ctx;
    const size = state.size;

    // For each region
    for (const region of state.regions) {
      // Get all row bands that intersect this region
      const allBands = enumerateRowBands(state);
      const intersectingBands = allBands.filter(band => {
        const regionCellsInBand = getCandidatesInRegionAndRows(region, band.rows, state);
        return regionCellsInBand.length > 0;
      });

      if (intersectingBands.length < 2) continue;

      // Try to find a band where we can deduce the quota
      // by knowing quotas of all other bands
      for (const targetBand of intersectingBands) {
        const otherBands = intersectingBands.filter(b => b !== targetBand);

        // Check if we know quotas for all other bands
        // (Simplified - full implementation would track deduced quotas)
        let knownQuotas = 0;
        let totalKnownQuota = 0;

        for (const band of otherBands) {
          const quota = getRegionBandQuota(region, band, state);
          // If quota is known (not 0 or matches some pattern), count it
          // This is simplified - real implementation needs quota tracking
          if (quota > 0) {
            knownQuotas++;
            totalKnownQuota += quota;
          }
        }

        // If we know quotas for all other bands, we can deduce target band quota
        if (knownQuotas === otherBands.length) {
          const regionQuota = region.starsRequired;
          const starsPlaced = region.cells.filter(
            cellId => state.cellStates[cellId] === CellState.Star
          ).length;
          const remainingStars = regionQuota - starsPlaced;

          const targetBandQuota = remainingStars - totalKnownQuota;

          if (targetBandQuota >= 0) {
            const candidatesInTargetBand = getCandidatesInRegionAndRows(
              region,
              targetBand.rows,
              state
            );

            // If quota equals candidate count, force all to stars
            if (targetBandQuota === candidatesInTargetBand.length && targetBandQuota > 0) {
              const deductions = candidatesInTargetBand.map(cell => ({
                cell,
                type: 'forceStar' as const,
              }));

              const explanation: ExplanationInstance = {
                schemaId: 'A3_region_rowBandPartition',
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
                      band: { kind: 'rowBand', rows: targetBand.rows },
                      quota: targetBandQuota,
                    },
                  },
                ],
              };

              applications.push({
                schemaId: 'A3_region_rowBandPartition',
                params: {
                  regionId: region.id,
                  targetBand: targetBand.rows,
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

