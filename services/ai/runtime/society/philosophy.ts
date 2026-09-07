import type { PhilosophyDomain } from './types';

export const HUMAN_THOUGHT_DOMAINS: readonly PhilosophyDomain[] = [
  'ethics',
  'leadership',
  'meaning',
  'creativity',
  'decision-making',
  'epistemology',
  'consciousness',
  'innovation',
  'philosophy of technology',
];

export type PhilosophyRecord = {
  domain: PhilosophyDomain;
  description: string;
  endorsement: false;
  religiousPromotion: false;
};

export function describePhilosophy(domain: PhilosophyDomain, description: string): PhilosophyRecord {
  return { domain, description, endorsement: false, religiousPromotion: false };
}

export function philosophyEndorsesReligion(_record: PhilosophyRecord): false {
  return false;
}
