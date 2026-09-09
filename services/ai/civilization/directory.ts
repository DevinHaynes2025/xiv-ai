import { refuse } from './errors';
import {
  now,
  organizationOf,
  recordGovernanceEvent,
  recordGovernanceEvent as audit,
  requireMember,
  requireSupervisor,
  visibleTo,
  type CivilizationState,
} from './store';
import type {
  ActorContext,
  DirectoryCategory,
  DirectoryEntry,
  OversightLevel,
  XarpRole,
} from './types';

// The agent directory is a catalogue of professions, not a fleet of running
// processes. logical_agent_count can describe a thousand identities while the
// number of activated agents stays in the dozens, which is what makes scaling a
// namespace problem rather than a compute problem.

export type SeedProfession = {
  professionKey: string;
  category: DirectoryCategory;
  displayName: string;
  oversightLevel?: OversightLevel;
  defaultXarpRoles?: readonly XarpRole[];
};

// The professions the story names, with the oversight each one carries. The
// high-stakes entries are the ones where a wrong answer harms someone who never
// agreed to be part of the experiment, so they cannot opt out of human approval.
export const SEED_PROFESSIONS: readonly SeedProfession[] = [
  { professionKey: 'ceo', category: 'business', displayName: 'CEO Agent', defaultXarpRoles: ['synthesizer'] },
  { professionKey: 'coo', category: 'business', displayName: 'COO Agent', defaultXarpRoles: ['specialist'] },
  { professionKey: 'cfo', category: 'business', displayName: 'CFO Agent', defaultXarpRoles: ['financial'] },
  { professionKey: 'product', category: 'business', displayName: 'Product Agent', defaultXarpRoles: ['specialist'] },
  { professionKey: 'strategy', category: 'business', displayName: 'Strategy Agent', defaultXarpRoles: ['synthesizer'] },

  { professionKey: 'procurement', category: 'supply_chain', displayName: 'Procurement Agent', defaultXarpRoles: ['specialist'] },
  { professionKey: 'warehouse', category: 'supply_chain', displayName: 'Warehouse Agent', defaultXarpRoles: ['specialist'] },
  { professionKey: 'inventory', category: 'supply_chain', displayName: 'Inventory Agent', defaultXarpRoles: ['specialist'] },
  { professionKey: 'transportation', category: 'supply_chain', displayName: 'Transportation Agent', defaultXarpRoles: ['specialist'] },
  { professionKey: 'demand', category: 'supply_chain', displayName: 'Demand Agent', defaultXarpRoles: ['investigator'] },

  { professionKey: 'software', category: 'technology', displayName: 'Software Agent', defaultXarpRoles: ['specialist'] },
  { professionKey: 'database', category: 'technology', displayName: 'Database Agent', defaultXarpRoles: ['specialist'] },
  { professionKey: 'cloud', category: 'technology', displayName: 'Cloud Agent', defaultXarpRoles: ['specialist'] },
  {
    professionKey: 'cybersecurity',
    category: 'technology',
    displayName: 'Cybersecurity Agent',
    oversightLevel: 'high_stakes',
    defaultXarpRoles: ['security'],
  },
  { professionKey: 'mobile', category: 'technology', displayName: 'Mobile Agent', defaultXarpRoles: ['specialist'] },
  {
    professionKey: 'ai_evaluation',
    category: 'technology',
    displayName: 'AI Evaluation Agent',
    oversightLevel: 'elevated',
    defaultXarpRoles: ['challenger'],
  },

  {
    professionKey: 'legal_research',
    category: 'professional_intelligence',
    displayName: 'Legal Research Agent',
    oversightLevel: 'high_stakes',
    defaultXarpRoles: ['investigator', 'specialist'],
  },
  {
    professionKey: 'accounting',
    category: 'professional_intelligence',
    displayName: 'Accounting Agent',
    oversightLevel: 'high_stakes',
    defaultXarpRoles: ['financial'],
  },
  {
    professionKey: 'engineering',
    category: 'professional_intelligence',
    displayName: 'Engineering Agent',
    oversightLevel: 'high_stakes',
    defaultXarpRoles: ['specialist'],
  },
  {
    professionKey: 'architecture',
    category: 'professional_intelligence',
    displayName: 'Architecture Agent',
    oversightLevel: 'high_stakes',
    defaultXarpRoles: ['specialist'],
  },
  {
    professionKey: 'education',
    category: 'professional_intelligence',
    displayName: 'Education Agent',
    oversightLevel: 'elevated',
    defaultXarpRoles: ['specialist'],
  },
  {
    professionKey: 'scientific_research',
    category: 'science',
    displayName: 'Scientific Research Agent',
    oversightLevel: 'high_stakes',
    defaultXarpRoles: ['investigator', 'challenger'],
  },

  { professionKey: 'risk', category: 'operations', displayName: 'Risk Agent', defaultXarpRoles: ['risk'] },
  { professionKey: 'finance', category: 'business', displayName: 'Finance Agent', defaultXarpRoles: ['financial'] },
  { professionKey: 'coordination', category: 'operations', displayName: 'Executive Coordinator Agent', defaultXarpRoles: ['synthesizer', 'human_liaison'] },
  { professionKey: 'weather_intelligence', category: 'science', displayName: 'Weather Intelligence Agent', defaultXarpRoles: ['investigator'] },
  { professionKey: 'market_intelligence', category: 'business', displayName: 'Market Intelligence Agent', defaultXarpRoles: ['investigator'] },
  { professionKey: 'economic_history', category: 'science', displayName: 'Economic History Agent', defaultXarpRoles: ['historian'] },
  {
    professionKey: 'cultural_intelligence',
    category: 'cultural_intelligence',
    displayName: 'Cultural Intelligence Agent',
    defaultXarpRoles: ['cultural'],
  },
];

const HIGH_STAKES_DEFAULT = new Set(
  SEED_PROFESSIONS.filter((item) => item.oversightLevel === 'high_stakes').map((item) => item.professionKey),
);

export function isHighStakesProfession(professionKey: string) {
  return HIGH_STAKES_DEFAULT.has(professionKey);
}

export function registerProfession(
  state: CivilizationState,
  actor: ActorContext,
  input: {
    professionKey: string;
    category: DirectoryCategory;
    displayName: string;
    description?: string;
    oversightLevel?: OversightLevel;
    requiresHumanApproval?: boolean;
    defaultXarpRoles?: readonly XarpRole[];
    logicalAgentCount?: number;
  },
): DirectoryEntry {
  requireSupervisor(state, actor);

  const oversightLevel = input.oversightLevel ?? (isHighStakesProfession(input.professionKey) ? 'high_stakes' : 'standard');
  const requiresHumanApproval = input.requiresHumanApproval ?? oversightLevel !== 'standard';

  // A high-stakes profession cannot decline oversight. Asking for it is a
  // configuration mistake worth refusing loudly rather than quietly correcting.
  if (oversightLevel === 'high_stakes' && !requiresHumanApproval) {
    refuse('directory_high_stakes_requires_approval', input.professionKey);
  }

  const existing = state.directory.find(
    (item) => item.universeId === actor.universeId && item.professionKey === input.professionKey,
  );

  const entry: DirectoryEntry = existing ?? {
    id: state.nextId(),
    universeId: actor.universeId,
    organizationId: organizationOf(state, actor.universeId),
    professionKey: input.professionKey,
    category: input.category,
    displayName: input.displayName,
    description: input.description ?? null,
    oversightLevel,
    requiresHumanApproval,
    defaultXarpRoles: [...(input.defaultXarpRoles ?? [])],
    logicalAgentCount: input.logicalAgentCount ?? 0,
    securityClassification: 'internal',
    retentionPolicy: 'retain-indefinite-review-annually',
    provenance: { registeredBy: actor.userId, slice: '2I-AI-62B' },
    auditEventId: null,
    createdAt: now(state),
  };

  if (existing) {
    existing.category = input.category;
    existing.displayName = input.displayName;
    existing.description = input.description ?? existing.description;
    existing.oversightLevel = oversightLevel;
    existing.requiresHumanApproval = requiresHumanApproval;
    existing.defaultXarpRoles = [...(input.defaultXarpRoles ?? existing.defaultXarpRoles)];
    existing.logicalAgentCount = input.logicalAgentCount ?? existing.logicalAgentCount;
  } else {
    state.directory.push(entry);
  }

  const event = audit(state, {
    universeId: actor.universeId,
    eventKind: 'agent_directory_registered',
    actorUserId: actor.userId,
    decision: entry.oversightLevel,
    detail: {
      professionKey: entry.professionKey,
      category: entry.category,
      requiresHumanApproval: entry.requiresHumanApproval,
      logicalAgentCount: entry.logicalAgentCount,
    },
  });
  entry.auditEventId = event.id;

  return entry;
}

export function seedDirectory(state: CivilizationState, actor: ActorContext): DirectoryEntry[] {
  return SEED_PROFESSIONS.map((profession) =>
    registerProfession(state, actor, {
      professionKey: profession.professionKey,
      category: profession.category,
      displayName: profession.displayName,
      oversightLevel: profession.oversightLevel,
      defaultXarpRoles: profession.defaultXarpRoles,
    }),
  );
}

export function setLogicalPopulation(
  state: CivilizationState,
  actor: ActorContext,
  input: { professionKey: string; logicalAgentCount: number },
): DirectoryEntry {
  requireSupervisor(state, actor);
  const entry = requireProfession(state, actor.universeId, input.professionKey);
  if (input.logicalAgentCount < 0) refuse('directory_profession_unknown', 'a population cannot be negative');
  entry.logicalAgentCount = input.logicalAgentCount;

  recordGovernanceEvent(state, {
    universeId: actor.universeId,
    eventKind: 'agent_directory_registered',
    actorUserId: actor.userId,
    detail: { professionKey: entry.professionKey, logicalAgentCount: entry.logicalAgentCount },
  });

  return entry;
}

export function listDirectory(state: CivilizationState, actor: ActorContext): DirectoryEntry[] {
  return visibleTo(state, actor, state.directory);
}

export function findProfession(
  state: CivilizationState,
  universeId: string,
  professionKey: string,
): DirectoryEntry | undefined {
  return state.directory.find((item) => item.universeId === universeId && item.professionKey === professionKey);
}

export function requireProfession(
  state: CivilizationState,
  universeId: string,
  professionKey: string,
): DirectoryEntry {
  const entry = findProfession(state, universeId, professionKey);
  if (!entry) refuse('directory_profession_unknown', professionKey);
  return entry;
}

// Falls back to the seed table when a universe has not catalogued a profession
// yet, so an uncatalogued legal agent is still treated as high stakes rather
// than as standard by omission.
export function oversightForProfession(
  state: CivilizationState,
  universeId: string,
  professionKey: string,
): OversightLevel {
  const entry = findProfession(state, universeId, professionKey);
  if (entry) return entry.oversightLevel;
  return isHighStakesProfession(professionKey) ? 'high_stakes' : 'standard';
}

export function requiresHumanApproval(
  state: CivilizationState,
  universeId: string,
  professionKey: string,
): boolean {
  const entry = findProfession(state, universeId, professionKey);
  if (entry) return entry.requiresHumanApproval;
  return oversightForProfession(state, universeId, professionKey) !== 'standard';
}

export type DirectoryRollup = {
  category: DirectoryCategory;
  professions: number;
  logicalAgents: number;
  highStakes: number;
};

export function directoryRollup(state: CivilizationState, actor: ActorContext): DirectoryRollup[] {
  const grouped = new Map<DirectoryCategory, DirectoryRollup>();
  for (const entry of listDirectory(state, actor)) {
    const current = grouped.get(entry.category) ?? {
      category: entry.category,
      professions: 0,
      logicalAgents: 0,
      highStakes: 0,
    };
    current.professions += 1;
    current.logicalAgents += entry.logicalAgentCount;
    if (entry.oversightLevel === 'high_stakes') current.highStakes += 1;
    grouped.set(entry.category, current);
  }
  return [...grouped.values()].sort((a, b) => a.category.localeCompare(b.category));
}

export function requireMemberScope(state: CivilizationState, actor: ActorContext) {
  return requireMember(state, actor);
}
