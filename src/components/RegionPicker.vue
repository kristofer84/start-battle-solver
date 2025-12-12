<script setup lang="ts">
import { idToLetter } from '../logic/helpers';

const props = defineProps<{
  selectedId?: number;
}>();

const emit = defineEmits<{
  (e: 'selectRegion', id: number): void;
}>();

function onClick(id: number) {
  emit('selectRegion', id);
}

</script>

<template>
  <div>
    <div class="subtle-text" style="margin-bottom: 0.35rem">
      Regions (A–J)
    </div>
    <div class="region-picker-grid">
      <button
        v-for="id in 10"
        :key="id - 1"
        type="button"
        class="region-btn"
        :class="[
          `region-btn-${id - 1}`,
          { active: props.selectedId === id - 1 }
        ]"
        @click="onClick(id - 1)"
      >
        {{ idToLetter(id - 1) }}
      </button>
    </div>
  </div>
</template>


