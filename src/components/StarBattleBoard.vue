<script setup lang="ts">
import type { PuzzleState, Coords } from '../types/puzzle';
import type { HintHighlight } from '../types/hints';

const props = defineProps<{
  state: PuzzleState;
  selectionMode: 'region' | 'star' | 'cross' | 'erase';
  selectedRegionId?: number;
  hintHighlight?: HintHighlight | null;
}>();

const emit = defineEmits<{
  (e: 'cellClick', coords: Coords): void;
}>();

function onCellClick(row: number, col: number) {
  emit('cellClick', { row, col });
}

function indexToCoords(index: number, size: number): Coords {
  const zeroBased = index - 1;
  const row = Math.floor(zeroBased / size);
  const col = zeroBased % size;
  return { row, col };
}

function cellRegionId(row: number, col: number): number {
  return props.state.def.regions[row][col];
}

function isHighlightedCell(row: number, col: number): boolean {
  const h = props.hintHighlight;
  if (!h) return false;
  if (h.cells?.some((c) => c.row === row && c.col === col)) return true;
  if (h.rows?.includes(row)) return true;
  if (h.cols?.includes(col)) return true;
  const regionId = cellRegionId(row, col);
  if (h.regions?.includes(regionId)) return true;
  return false;
}
</script>

<template>
  <div class="board-wrapper">
    <div class="board-grid">
      <div
        v-for="index in state.def.size * state.def.size"
        :key="index"
        class="board-cell"
        :class="[
          `board-cell-region-${cellRegionId(indexToCoords(index, state.def.size).row, indexToCoords(index, state.def.size).col)}`,
          {
            'highlight-cell': isHighlightedCell(
              indexToCoords(index, state.def.size).row,
              indexToCoords(index, state.def.size).col,
            ),
            star:
              state.cells[indexToCoords(index, state.def.size).row][
                indexToCoords(index, state.def.size).col
              ] === 'star',
            cross:
              state.cells[indexToCoords(index, state.def.size).row][
                indexToCoords(index, state.def.size).col
              ] === 'cross',
          },
        ]"
        @click="
          onCellClick(
            indexToCoords(index, state.def.size).row,
            indexToCoords(index, state.def.size).col,
          )
        "
      >
        <span
          v-if="
            state.cells[indexToCoords(index, state.def.size).row][
              indexToCoords(index, state.def.size).col
            ] === 'star'
          "
          >★</span
        >
        <span
          v-else-if="
            state.cells[indexToCoords(index, state.def.size).row][
              indexToCoords(index, state.def.size).col
            ] === 'cross'
          "
          >×</span
        >
      </div>
    </div>
  </div>
</template>


