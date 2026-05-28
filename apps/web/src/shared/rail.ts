import type { RailItem } from './types.ts';

// Order per PRD §6. Items 1 and 2 are wired to fixtures for the prototype;
// the rest are present for visual completeness but not exercised here.
export const RAIL: RailItem[] = [
  {
    label: 'Hva er folketallet i denne kommunen?',
    question: 'Hva er folketallet i denne kommunen?',
    scenarioKey: 'population',
  },
  {
    label: 'Hvem eier denne eiendommen?',
    question: 'Hvem eier denne eiendommen?',
    scenarioKey: 'refusal',
  },
  {
    label: 'Hvordan er været her akkurat nå?',
    question: 'Hvordan er været her akkurat nå?',
    scenarioKey: 'weather',
  },
  {
    label: 'Fortell meg om nabolaget.',
    question: 'Fortell meg om nabolaget.',
    scenarioKey: 'neighborhood',
  },
  {
    label: 'Folketall og hva området er kjent for.',
    question: 'Folketall og hva området er kjent for.',
    scenarioKey: 'both',
  },
];
