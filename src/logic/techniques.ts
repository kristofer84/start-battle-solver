import type { PuzzleState } from '../types/puzzle';
import type { Hint, TechniqueId } from '../types/hints';
import { findTrivialMarksHint } from './techniques/trivialMarks';
import { findTwoByTwoHint } from './techniques/twoByTwo';
import { findOneByNHint } from './techniques/oneByN';
import { findExclusionHint } from './techniques/exclusion';

export interface Technique {
  id: TechniqueId;
  name: string;
  findHint(state: PuzzleState): Hint | null;
}

export const techniquesInOrder: Technique[] = [
  {
    id: 'trivial-marks',
    name: 'Trivial Marks',
    findHint: findTrivialMarksHint,
  },
  {
    id: 'two-by-two',
    name: '2×2 Blocks',
    findHint: findTwoByTwoHint,
  },
  {
    id: 'one-by-n',
    name: '1×N Bands',
    findHint: findOneByNHint,
  },
  {
    id: 'exclusion',
    name: 'Exclusion',
    findHint: findExclusionHint,
  },
  // Placeholders for more advanced techniques – return null for now.
  { id: 'pressured-exclusion', name: 'Pressured Exclusion', findHint: () => null },
  { id: 'simple-shapes', name: 'Simple Shapes', findHint: () => null },
  { id: 'undercounting', name: 'Undercounting', findHint: () => null },
  { id: 'overcounting', name: 'Overcounting', findHint: () => null },
  { id: 'finned-counts', name: 'Finned Counts', findHint: () => null },
  { id: 'composite-shapes', name: 'Composite Shapes', findHint: () => null },
  { id: 'squeeze', name: 'Squeeze', findHint: () => null },
  { id: 'set-differentials', name: 'Set Differentials', findHint: () => null },
  { id: 'by-a-thread', name: 'By a Thread', findHint: () => null },
  { id: 'at-sea', name: 'At Sea', findHint: () => null },
  { id: 'by-a-thread-at-sea', name: 'By a Thread at Sea', findHint: () => null },
  { id: 'kissing-ls', name: 'Kissing Ls', findHint: () => null },
  { id: 'the-m', name: 'The M', findHint: () => null },
  { id: 'pressured-ts', name: 'Pressured Ts', findHint: () => null },
  { id: 'fish', name: 'Fish', findHint: () => null },
  { id: 'n-rooks', name: 'N Rooks', findHint: () => null },
  { id: 'entanglement', name: 'Entanglement', findHint: () => null },
];

export function findNextHint(state: PuzzleState): Hint | null {
  for (const tech of techniquesInOrder) {
    const hint = tech.findHint(state);
    if (hint) return hint;
  }
  return null;
}

export const techniqueNameById: Record<TechniqueId, string> = techniquesInOrder.reduce(
  (acc, tech) => {
    acc[tech.id] = tech.name;
    return acc;
  },
  {} as Record<TechniqueId, string>,
);


