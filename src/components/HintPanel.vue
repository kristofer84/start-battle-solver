<script setup lang="ts">
import type { Hint } from '../types/hints';
import { techniqueNameById } from '../logic/techniques';

const props = defineProps<{
  hint: Hint | null;
}>();
</script>

<template>
  <div>
    <div class="card-header">
      <div>
        <div style="font-size: 0.9rem; font-weight: 600">
          Hint
        </div>
        <div v-if="hint" class="subtle-text">
          {{ techniqueNameById[hint.technique] }} ({{ hint.technique }})
        </div>
      </div>
      <div class="pill">
        Logical
      </div>
    </div>

    <div v-if="!hint" class="subtle-text">
      No hint yet. In Play mode, press “Get hint” to search for the next forced move.
    </div>

    <div v-else>
      <p style="font-size: 0.88rem; line-height: 1.4">
        {{ hint.explanation }}
      </p>
      <div class="hint-legend">
        Visual highlights:
        <div class="hint-badge-row">
          <span
            v-if="hint.highlights?.rows?.length"
            class="hint-chip rows"
          >
            Rows: {{ hint.highlights.rows.map((r) => r + 1).join(', ') }}
          </span>
          <span
            v-if="hint.highlights?.cols?.length"
            class="hint-chip cols"
          >
            Columns: {{ hint.highlights.cols.map((c) => c + 1).join(', ') }}
          </span>
          <span
            v-if="hint.highlights?.regions?.length"
            class="hint-chip regions"
          >
            Regions: {{ hint.highlights.regions.join(', ') }}
          </span>
          <span
            v-if="hint.highlights?.cells?.length"
            class="hint-chip cells"
          >
            Cells: {{ hint.highlights.cells.length }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>


