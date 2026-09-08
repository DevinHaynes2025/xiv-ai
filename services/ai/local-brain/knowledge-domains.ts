export type KnowledgeDomain = {
  id: string;
  label: string;
  defaultClassification: 'public' | 'internal' | 'confidential' | 'restricted';
  requiresProvenance: true;
  notes: string;
};

export const KNOWLEDGE_DOMAINS: KnowledgeDomain[] = [
  ['business', 'Business & Organizations'],
  ['economics', 'Economics & Wealth'],
  ['finance', 'Finance & Markets'],
  ['hedge_funds', 'Hedge Funds & Institutional Investing'],
  ['supply_chain', 'Supply Chain & Information Logistics'],
  ['technology', 'Technology & Technical Infrastructure'],
  ['history', 'History & Historical Accounts'],
  ['culture', 'Culture & Anthropology'],
  ['humanities', 'Humanities'],
  ['spirituality', 'Spirituality & Belief Systems'],
  ['mental_health', 'Mental Health Knowledge'],
  ['public_health', 'Public Health'],
  ['local_government', 'Local Government'],
  ['politics', 'Politics & Public Institutions'],
  ['law_policy', 'Law & Public Policy'],
  ['science', 'Science & Research'],
  ['education', 'Education & Learning'],
].map(([id, label]) => ({
  id,
  label,
  defaultClassification: 'internal',
  requiresProvenance: true as const,
  notes: 'Domain registration does not imply that data is present, licensed, verified, complete, or safe for every use.',
}));

export const CLAIM_STATES = [
  'VERIFIED_FACT',
  'PRIMARY_SOURCE',
  'HISTORICAL_ACCOUNT',
  'CULTURAL_CONTEXT',
  'BELIEF_OR_TRADITION',
  'DISPUTED',
  'MODEL_INFERENCE',
  'PREDICTION',
  'UNKNOWN',
] as const;

export type ClaimState = (typeof CLAIM_STATES)[number];

export function domainById(id: string) {
  return KNOWLEDGE_DOMAINS.find((domain) => domain.id === id);
}
