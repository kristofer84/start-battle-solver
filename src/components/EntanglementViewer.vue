<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { loadEntanglementSpecs, findPatternById, getTripleRuleId, getConstrainedRuleId, getPairPatternId } from '../logic/entanglements/loader';
import type { LoadedEntanglementSpec } from '../types/entanglements';
import PatternVisualization from './PatternVisualization.vue';

const props = defineProps<{
  selectedPatternId?: string | null;
}>();

const emit = defineEmits<{
  (e: 'patternSelected', patternId: string | null): void;
}>();

const specs = ref<LoadedEntanglementSpec[]>([]);
const selectedSpecId = ref<string | null>(null);
const selectedPatternId = ref<string | null>(null);
const expandedPatternIds = ref<Set<string>>(new Set());

onMounted(() => {
  specs.value = loadEntanglementSpecs();
  
  // If a pattern ID is provided via props, find and select it
  if (props.selectedPatternId) {
    const found = findPatternById(specs.value, props.selectedPatternId);
    if (found) {
      selectedSpecId.value = found.spec.id;
      selectedPatternId.value = props.selectedPatternId;
      expandedPatternIds.value.add(props.selectedPatternId);
    }
  }
});

watch(() => props.selectedPatternId, (newId) => {
  if (newId) {
    const found = findPatternById(specs.value, newId);
    if (found) {
      selectedSpecId.value = found.spec.id;
      selectedPatternId.value = newId;
      expandedPatternIds.value.add(newId);
    }
  }
});

const selectedSpec = computed(() => {
  if (!selectedSpecId.value) return null;
  return specs.value.find(s => s.id === selectedSpecId.value) || null;
});

function getPatternTypeDescription(spec: LoadedEntanglementSpec): string {
  if (spec.hasPairPatterns) {
    return 'Pair-based Entanglement';
  } else if (spec.hasTriplePatterns) {
    return 'Triple Entanglement (Canonical)';
  } else if (spec.pureData) {
    return 'Pure Entanglement';
  } else if (spec.constrainedData) {
    return 'Constrained Entanglement';
  }
  return 'Unknown';
}

function getPatternTypeExplanation(spec: LoadedEntanglementSpec): string {
  if (spec.hasPairPatterns) {
    return `Pair-based entanglement patterns identify forced moves based on pairs of initial stars. 
    When certain pairs of stars are placed, the solver analyzes all compatible solutions and finds 
    cells that are always empty (forced_empty) or always stars (forced_star) across all those solutions. 
    This creates a powerful deduction: if you see these two stars, you can immediately mark certain 
    cells as empty or stars without further analysis.`;
  } else if (spec.hasTriplePatterns) {
    return `Triple entanglement patterns use canonical (normalized) representations to identify 
    relationships between two stars and a candidate cell. The patterns are stored in canonical form 
    (relative coordinates) so they can be matched regardless of position on the board. Unconstrained 
    rules apply in all contexts, while constrained rules only apply when specific constraint features 
    are present (like "candidate_on_outer_ring"). When matched, these patterns force the candidate 
    cell to be empty or a star.`;
  } else if (spec.pureData) {
    return `Pure entanglement templates identify patterns where certain cells are forced to be empty 
    based solely on the positions of initial stars, without needing additional constraint features. 
    These are the most general and widely applicable entanglement patterns.`;
  } else if (spec.constrainedData) {
    return `Constrained entanglement patterns identify forced empty cells based on initial stars, 
    but only apply when specific constraint features are present. These patterns are more specialized 
    than pure entanglements but can catch deductions that pure patterns miss.`;
  }
  return '';
}

function getPatternCount(spec: LoadedEntanglementSpec): number {
  if (spec.pairData) {
    return spec.pairData.patterns.length;
  } else if (spec.tripleData) {
    return spec.tripleData.unconstrained_rules.length + spec.tripleData.constrained_rules.length;
  } else if (spec.pureData) {
    return spec.pureData.pure_entanglement_templates.length;
  } else if (spec.constrainedData) {
    return spec.constrainedData.unconstrained_rules.length + spec.constrainedData.constrained_rules.length;
  }
  return 0;
}

function togglePatternVisualization(patternId: string) {
  if (expandedPatternIds.value.has(patternId)) {
    expandedPatternIds.value.delete(patternId);
    if (selectedPatternId.value === patternId) {
      selectedPatternId.value = null;
      emit('patternSelected', null);
    }
  } else {
    expandedPatternIds.value.add(patternId);
    selectedPatternId.value = patternId;
    emit('patternSelected', patternId);
  }
}
</script>

<template>
  <div>
    <div class="card-header">
      <div>
        <div style="font-size: 0.9rem; font-weight: 600">
          Entanglement Patterns
        </div>
        <div class="subtle-text">
          View loaded entanglement patterns and how they work
        </div>
      </div>
      <div class="pill">
        {{ specs.length }} file{{ specs.length !== 1 ? 's' : '' }}
      </div>
    </div>

    <div v-if="specs.length === 0" class="subtle-text" style="margin-top: 1rem">
      Loading entanglement patterns...
    </div>

    <div v-else style="margin-top: 1rem">
      <!-- Spec list -->
      <div style="margin-bottom: 1.5rem">
        <div style="font-size: 0.85rem; font-weight: 600; margin-bottom: 0.5rem">
          Loaded Entanglement Files
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.5rem">
          <button
            v-for="spec in specs"
            :key="spec.id"
            type="button"
            class="btn secondary"
            :class="{ active: selectedSpecId === spec.id }"
            @click="selectedSpecId = selectedSpecId === spec.id ? null : spec.id"
            style="text-align: left; justify-content: flex-start; padding: 0.6rem 0.8rem"
          >
            <div style="flex: 1">
              <div style="font-weight: 600; font-size: 0.9rem">
                {{ spec.id }}
              </div>
              <div style="font-size: 0.75rem; opacity: 0.8; margin-top: 0.2rem">
                {{ spec.boardSize }}×{{ spec.boardSize }} · {{ spec.initialStars }} star{{ spec.initialStars !== 1 ? 's' : '' }} · 
                {{ getPatternTypeDescription(spec) }} · {{ getPatternCount(spec) }} pattern{{ getPatternCount(spec) !== 1 ? 's' : '' }}
              </div>
            </div>
          </button>
        </div>
      </div>

      <!-- Selected spec details -->
      <div v-if="selectedSpec" style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid rgba(148, 163, 184, 0.2)">
        <div style="font-size: 0.85rem; font-weight: 600; margin-bottom: 0.75rem">
          {{ selectedSpec.id }}
        </div>

        <!-- Pattern type explanation -->
        <div style="background: rgba(15, 23, 42, 0.6); padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem">
          <div style="font-size: 0.8rem; font-weight: 600; margin-bottom: 0.5rem; color: #93c5fd">
            How {{ getPatternTypeDescription(selectedSpec) }} Works
          </div>
          <div style="font-size: 0.8rem; line-height: 1.6; color: #cbd5e1">
            {{ getPatternTypeExplanation(selectedSpec) }}
          </div>
        </div>

        <!-- Spec metadata -->
        <div style="margin-bottom: 1rem">
          <div style="font-size: 0.8rem; font-weight: 600; margin-bottom: 0.5rem">Specification Details</div>
          <div style="font-size: 0.75rem; display: grid; grid-template-columns: auto 1fr; gap: 0.5rem 1rem; color: #cbd5e1">
            <div>Board Size:</div>
            <div>{{ selectedSpec.boardSize }}×{{ selectedSpec.boardSize }}</div>
            <div>Initial Stars:</div>
            <div>{{ selectedSpec.initialStars }}</div>
            <div v-if="selectedSpec.starsPerRow !== undefined">Stars per Row:</div>
            <div v-if="selectedSpec.starsPerRow !== undefined">{{ selectedSpec.starsPerRow }}</div>
            <div v-if="selectedSpec.starsPerColumn !== undefined">Stars per Column:</div>
            <div v-if="selectedSpec.starsPerColumn !== undefined">{{ selectedSpec.starsPerColumn }}</div>
            <div>Pattern Type:</div>
            <div>{{ getPatternTypeDescription(selectedSpec) }}</div>
            <div>Total Patterns:</div>
            <div>{{ getPatternCount(selectedSpec) }}</div>
            <div v-if="selectedSpec.pairData && selectedSpec.pairData.total_solutions != null">Total Solutions Analyzed:</div>
            <div v-if="selectedSpec.pairData && selectedSpec.pairData.total_solutions != null">{{ (selectedSpec.pairData.total_solutions ?? 0).toLocaleString() }}</div>
          </div>
        </div>

        <!-- Pattern details -->
        <div v-if="selectedSpec.pairData">
          <div style="font-size: 0.8rem; font-weight: 600; margin-bottom: 0.5rem">
            Pair Patterns ({{ selectedSpec.pairData.patterns.length }})
          </div>
          <div style="display: flex; flex-direction: column; gap: 0.75rem; max-height: 400px; overflow-y: auto">
            <div
              v-for="(pattern, idx) in selectedSpec.pairData.patterns"
              :key="idx"
              style="background: rgba(15, 23, 42, 0.4); padding: 0.75rem; border-radius: 0.5rem; border: 1px solid rgba(148, 163, 184, 0.2)"
            >
              <div style="font-size: 0.75rem; font-weight: 600; margin-bottom: 0.4rem; display: flex; align-items: center; gap: 0.5rem">
                <span>Pattern {{ idx + 1 }}</span>
                <span style="color: #60a5fa; font-family: monospace; font-size: 0.7rem">[{{ getPairPatternId(pattern) }}]</span>
                <button
                  type="button"
                  @click="togglePatternVisualization(getPairPatternId(pattern))"
                  style="margin-left: auto; padding: 0.2rem 0.5rem; font-size: 0.7rem; background: rgba(59, 130, 246, 0.2); border: 1px solid rgba(59, 130, 246, 0.4); border-radius: 0.25rem; color: #93c5fd; cursor: pointer"
                >
                  {{ expandedPatternIds.has(getPairPatternId(pattern)) ? 'Hide' : 'Show' }} visualization
                </button>
              </div>
              <div style="font-size: 0.7rem; display: grid; grid-template-columns: auto 1fr; gap: 0.3rem 1rem; color: #cbd5e1">
                <div>Initial Stars:</div>
                <div>{{ pattern.initial_stars.map(c => `(${c[0]},${c[1]})`).join(', ') }}</div>
                <div v-if="pattern.compatible_solutions != null">Compatible Solutions:</div>
                <div v-if="pattern.compatible_solutions != null">{{ (pattern.compatible_solutions ?? 0).toLocaleString() }}</div>
                <div v-if="pattern.forced_empty && pattern.forced_empty.length > 0">Forced Empty:</div>
                <div v-if="pattern.forced_empty && pattern.forced_empty.length > 0">
                  {{ pattern.forced_empty.map(c => `(${c[0]},${c[1]})`).join(', ') }}
                </div>
                <div v-if="pattern.forced_star && pattern.forced_star.length > 0">Forced Star:</div>
                <div v-if="pattern.forced_star && pattern.forced_star.length > 0">
                  {{ pattern.forced_star.map(c => `(${c[0]},${c[1]})`).join(', ') }}
                </div>
              </div>
              <PatternVisualization
                v-if="expandedPatternIds.has(getPairPatternId(pattern))"
                :spec="selectedSpec"
                :pattern-id="getPairPatternId(pattern)"
              />
            </div>
          </div>
        </div>

        <div v-else-if="selectedSpec.tripleData">
          <div style="font-size: 0.8rem; font-weight: 600; margin-bottom: 0.5rem">
            Triple Rules
          </div>
          <div v-if="selectedSpec.tripleData.unconstrained_rules.length > 0" style="margin-bottom: 1rem">
            <div style="font-size: 0.75rem; font-weight: 600; margin-bottom: 0.4rem; color: #93c5fd">
              Unconstrained Rules ({{ selectedSpec.tripleData.unconstrained_rules.length }})
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.5rem; max-height: 300px; overflow-y: auto">
              <div
                v-for="(rule, idx) in selectedSpec.tripleData.unconstrained_rules"
                :key="`unconstrained-${idx}`"
                style="background: rgba(15, 23, 42, 0.4); padding: 0.6rem; border-radius: 0.5rem; font-size: 0.7rem; color: #cbd5e1"
              >
                <div style="margin-bottom: 0.3rem; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap">
                  <span>
                    <strong>ID:</strong> <span style="color: #60a5fa; font-family: monospace">[{{ getTripleRuleId(rule) }}]</span> · 
                    <strong>Stars:</strong> {{ rule.canonical_stars.map(c => `(${c[0]},${c[1]})`).join(', ') }} · 
                    <strong>Candidate:</strong> ({{ rule.canonical_candidate[0] }},{{ rule.canonical_candidate[1] }}) · 
                    <strong>Occurrences:</strong> {{ rule.occurrences }}
                  </span>
                  <button
                    type="button"
                    @click="togglePatternVisualization(getTripleRuleId(rule))"
                    style="padding: 0.2rem 0.5rem; font-size: 0.7rem; background: rgba(59, 130, 246, 0.2); border: 1px solid rgba(59, 130, 246, 0.4); border-radius: 0.25rem; color: #93c5fd; cursor: pointer"
                  >
                    {{ expandedPatternIds.has(getTripleRuleId(rule)) ? 'Hide' : 'Show' }} visualization
                  </button>
                </div>
                <PatternVisualization
                  v-if="expandedPatternIds.has(getTripleRuleId(rule))"
                  :spec="selectedSpec"
                  :pattern-id="getTripleRuleId(rule)"
                />
              </div>
            </div>
          </div>
          <div v-if="selectedSpec.tripleData.constrained_rules.length > 0">
            <div style="font-size: 0.75rem; font-weight: 600; margin-bottom: 0.4rem; color: #fbbf24">
              Constrained Rules ({{ selectedSpec.tripleData.constrained_rules.length }})
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.5rem; max-height: 300px; overflow-y: auto">
              <div
                v-for="(rule, idx) in selectedSpec.tripleData.constrained_rules"
                :key="`constrained-${idx}`"
                style="background: rgba(15, 23, 42, 0.4); padding: 0.6rem; border-radius: 0.5rem; font-size: 0.7rem; color: #cbd5e1"
              >
                <div style="margin-bottom: 0.3rem; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap">
                  <span>
                    <strong>ID:</strong> <span style="color: #60a5fa; font-family: monospace">[{{ getTripleRuleId(rule) }}]</span> · 
                    <strong>Stars:</strong> {{ rule.canonical_stars.map(c => `(${c[0]},${c[1]})`).join(', ') }} · 
                    <strong>Candidate:</strong> ({{ rule.canonical_candidate[0] }},{{ rule.canonical_candidate[1] }}) · 
                    <strong>Features:</strong> {{ rule.constraint_features.join(', ') || 'none' }} · 
                    <strong>Occurrences:</strong> {{ rule.occurrences }}
                  </span>
                  <button
                    type="button"
                    @click="togglePatternVisualization(getTripleRuleId(rule))"
                    style="padding: 0.2rem 0.5rem; font-size: 0.7rem; background: rgba(59, 130, 246, 0.2); border: 1px solid rgba(59, 130, 246, 0.4); border-radius: 0.25rem; color: #93c5fd; cursor: pointer"
                  >
                    {{ expandedPatternIds.has(getTripleRuleId(rule)) ? 'Hide' : 'Show' }} visualization
                  </button>
                </div>
                <PatternVisualization
                  v-if="expandedPatternIds.has(getTripleRuleId(rule))"
                  :spec="selectedSpec"
                  :pattern-id="getTripleRuleId(rule)"
                />
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="selectedSpec.pureData">
          <div style="font-size: 0.8rem; font-weight: 600; margin-bottom: 0.5rem">
            Pure Entanglement Templates ({{ selectedSpec.pureData.pure_entanglement_templates.length }})
          </div>
          <div style="display: flex; flex-direction: column; gap: 0.5rem; max-height: 400px; overflow-y: auto">
            <div
              v-for="(template, idx) in selectedSpec.pureData.pure_entanglement_templates"
              :key="idx"
              style="background: rgba(15, 23, 42, 0.4); padding: 0.6rem; border-radius: 0.5rem; font-size: 0.7rem; color: #cbd5e1"
            >
              <div style="margin-bottom: 0.3rem">
                <strong>Stars:</strong> {{ template.canonical_stars.map(c => `(${c[0]},${c[1]})`).join(', ') }} · 
                <strong>Forced Empty:</strong> {{ template.canonical_forced_empty.map(c => `(${c[0]},${c[1]})`).join(', ') }} · 
                <strong>Occurrences:</strong> {{ template.occurrences }}
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="selectedSpec.constrainedData">
          <div style="font-size: 0.8rem; font-weight: 600; margin-bottom: 0.5rem">
            Constrained Rules
          </div>
          <div v-if="selectedSpec.constrainedData.unconstrained_rules.length > 0" style="margin-bottom: 1rem">
            <div style="font-size: 0.75rem; font-weight: 600; margin-bottom: 0.4rem; color: #93c5fd">
              Unconstrained Rules ({{ selectedSpec.constrainedData.unconstrained_rules.length }})
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.5rem; max-height: 300px; overflow-y: auto">
              <div
                v-for="(rule, idx) in selectedSpec.constrainedData.unconstrained_rules"
                :key="`unconstrained-${idx}`"
                style="background: rgba(15, 23, 42, 0.4); padding: 0.6rem; border-radius: 0.5rem; font-size: 0.7rem; color: #cbd5e1"
              >
                <div style="margin-bottom: 0.3rem; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap">
                  <span>
                    <strong>ID:</strong> <span style="color: #60a5fa; font-family: monospace">[{{ getConstrainedRuleId(rule) }}]</span> · 
                    <strong>Stars:</strong> {{ rule.canonical_stars.map(c => `(${c[0]},${c[1]})`).join(', ') }} · 
                    <strong>Forced Empty:</strong> {{ rule.canonical_forced_empty.map(c => `(${c[0]},${c[1]})`).join(', ') }} · 
                    <strong>Occurrences:</strong> {{ rule.occurrences }}
                  </span>
                  <button
                    type="button"
                    @click="togglePatternVisualization(getConstrainedRuleId(rule))"
                    style="padding: 0.2rem 0.5rem; font-size: 0.7rem; background: rgba(59, 130, 246, 0.2); border: 1px solid rgba(59, 130, 246, 0.4); border-radius: 0.25rem; color: #93c5fd; cursor: pointer"
                  >
                    {{ expandedPatternIds.has(getConstrainedRuleId(rule)) ? 'Hide' : 'Show' }} visualization
                  </button>
                </div>
                <PatternVisualization
                  v-if="expandedPatternIds.has(getConstrainedRuleId(rule))"
                  :spec="selectedSpec"
                  :pattern-id="getConstrainedRuleId(rule)"
                />
              </div>
            </div>
          </div>
          <div v-if="selectedSpec.constrainedData.constrained_rules.length > 0">
            <div style="font-size: 0.75rem; font-weight: 600; margin-bottom: 0.4rem; color: #fbbf24">
              Constrained Rules ({{ selectedSpec.constrainedData.constrained_rules.length }})
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.5rem; max-height: 300px; overflow-y: auto">
              <div
                v-for="(rule, idx) in selectedSpec.constrainedData.constrained_rules"
                :key="`constrained-${idx}`"
                style="background: rgba(15, 23, 42, 0.4); padding: 0.6rem; border-radius: 0.5rem; font-size: 0.7rem; color: #cbd5e1"
              >
                <div style="margin-bottom: 0.3rem; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap">
                  <span>
                    <strong>ID:</strong> <span style="color: #60a5fa; font-family: monospace">[{{ getConstrainedRuleId(rule) }}]</span> · 
                    <strong>Stars:</strong> {{ rule.canonical_stars.map(c => `(${c[0]},${c[1]})`).join(', ') }} · 
                    <strong>Forced Empty:</strong> {{ rule.canonical_forced_empty.map(c => `(${c[0]},${c[1]})`).join(', ') }} · 
                    <strong>Features:</strong> {{ rule.constraint_features.join(', ') || 'none' }} · 
                    <strong>Occurrences:</strong> {{ rule.occurrences }}
                  </span>
                  <button
                    type="button"
                    @click="togglePatternVisualization(getConstrainedRuleId(rule))"
                    style="padding: 0.2rem 0.5rem; font-size: 0.7rem; background: rgba(59, 130, 246, 0.2); border: 1px solid rgba(59, 130, 246, 0.4); border-radius: 0.25rem; color: #93c5fd; cursor: pointer"
                  >
                    {{ expandedPatternIds.has(getConstrainedRuleId(rule)) ? 'Hide' : 'Show' }} visualization
                  </button>
                </div>
                <PatternVisualization
                  v-if="expandedPatternIds.has(getConstrainedRuleId(rule))"
                  :spec="selectedSpec"
                  :pattern-id="getConstrainedRuleId(rule)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

