export type StoryPersona =
  | 'consumer'
  | 'employee'
  | 'manager'
  | 'executive'
  | 'founder'
  | 'investor'
  | 'supplier'
  | 'customer'
  | 'government_operator'
  | 'researcher'
  | 'engineer'
  | 'manufacturer'
  | 'operator';

export type StoryDomain =
  | 'business'
  | 'finance'
  | 'supply_chain'
  | 'operations'
  | 'people'
  | 'security'
  | 'knowledge'
  | 'community'
  | 'government'
  | 'health_wellness'
  | 'culture'
  | 'technology'
  | 'chip_manufacturing'
  | 'data_centers'
  | 'quantum_research'
  | 'information_logistics'
  | 'automotive'
  | 'motorsport'
  | 'aviation'
  | 'electric_mobility'
  | 'home_technology'
  | 'infrastructure';

export type UserStory = {
  id: string;
  persona: StoryPersona;
  domain: StoryDomain;
  goal: string;
  outcome: string;
  acceptance: string[];
  risk: 'low' | 'medium' | 'high';
  generated: true;
};

const personas: StoryPersona[] = [
  'consumer','employee','manager','executive','founder','investor','supplier','customer','government_operator','researcher','engineer','manufacturer','operator',
];
const domains: StoryDomain[] = [
  'business','finance','supply_chain','operations','people','security','knowledge','community','government','health_wellness','culture','technology',
  'chip_manufacturing','data_centers','quantum_research','information_logistics','automotive','motorsport','aviation','electric_mobility','home_technology','infrastructure',
];
const goals = [
  'understand what changed',
  'find the next best action',
  'compare scenarios before deciding',
  'trace evidence behind a recommendation',
  'collaborate with an AI specialist team',
  'work safely while offline',
  'resume work after reconnecting',
  'detect risk before it becomes an incident',
  'learn from prior outcomes',
  'protect private organization data',
  'optimize a bounded resource plan',
  'trace supplier and infrastructure dependencies',
  'compare a classical baseline with an experimental algorithm',
  'model capacity without claiming unverified infrastructure',
];

function hashSeed(value: number) {
  let x = value | 0;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return Math.abs(x);
}

function riskFor(domain: StoryDomain): UserStory['risk'] {
  if (['finance','government','health_wellness','aviation','automotive','motorsport','electric_mobility','chip_manufacturing','infrastructure'].includes(domain)) return 'high';
  if (['security','data_centers','quantum_research','information_logistics'].includes(domain)) return 'medium';
  return 'low';
}

export function storyAt(index: number): UserStory {
  const seed = hashSeed(index + 1);
  const persona = personas[seed % personas.length];
  const domain = domains[Math.floor(seed / personas.length) % domains.length];
  const goal = goals[Math.floor(seed / (personas.length * domains.length)) % goals.length];
  return {
    id: `story_${index.toString().padStart(10, '0')}`,
    persona,
    domain,
    goal,
    outcome: `As a ${persona}, I want XIV in ${domain} to ${goal} so I can make a better evidence-backed decision.`,
    acceptance: [
      'Tenant and Universe boundaries are preserved.',
      'Evidence/provenance is visible when a factual claim is made.',
      'Unavailable or stale data is labeled instead of invented.',
      'High-consequence actions require the applicable approval gate.',
      'Offline behavior is deterministic: local-capable work continues; remote-only work waits.',
      'Infrastructure, vehicle, aviation and manufacturing outputs remain advisory/simulation-only unless separately authorized.',
      'Quantum research requires a reproducible classical baseline and makes no unverified quantum-advantage claim.',
    ],
    risk: riskFor(domain),
    generated: true,
  };
}

export function* generateStories(count: number, startAt = 0): Generator<UserStory> {
  if (!Number.isSafeInteger(count) || count < 0) throw new Error('count must be a non-negative safe integer');
  for (let i = 0; i < count; i += 1) yield storyAt(startAt + i);
}

// Supports virtual catalogs in the millions without committing millions of files/rows.
export const STORY_FACTORY_CAPABILITY = {
  virtualScale: 'millions',
  materializationPolicy: 'generate-on-demand-and-promote-reviewed-stories',
  productionAuthorization: false,
} as const;
