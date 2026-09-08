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
  | 'researcher';

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
  | 'technology';

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

const personas: StoryPersona[] = ['consumer','employee','manager','executive','founder','investor','supplier','customer','government_operator','researcher'];
const domains: StoryDomain[] = ['business','finance','supply_chain','operations','people','security','knowledge','community','government','health_wellness','culture','technology'];
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
];

function hashSeed(value: number) {
  let x = value | 0;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return Math.abs(x);
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
    ],
    risk: domain === 'finance' || domain === 'government' || domain === 'health_wellness' ? 'high' : domain === 'security' ? 'medium' : 'low',
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
