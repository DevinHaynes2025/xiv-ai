/**
 * US-SIM-01 -- Sims 18+ entry product surface (LOCAL / SIMULATION).
 * 12D-16/17 FOLLOW_UP product UX only -- does not import dimensional/12d fabric worktrees.
 * Portal / wormhole labels are metaphors for sim-world entry -- never physics / live teleport claims.
 * 18+ acknowledgment required (SIMULATION flags). Non-sexual cultural / professional sandbox framing.
 * WAITING_DATA when unbound. AGE_GATE_REQUIRED / WAITING_PROVIDER / GATE_DENIED honesty.
 * liveSimWorld false; liveAgeVerification false; L4 false; productionMutation false; readOnly true.
 */

export const SIMS_18_ENTRY_POLICY = {
  l4Autonomy: false as const,
  productionMutation: false as const,
  readOnly: true as const,
  layerKind: 'SIMULATION' as const,
  liveSimWorld: false as const,
  liveAgeVerification: false as const,
  livePortalPhysics: false as const,
  liveWormholeTransport: false as const,
  sexualSimFramingAllowed: false as const,
  ageGateMinimumYears: 18 as const,
  portalsWormholesAreMetaphorsOnly: true as const,
  label: 'SIMS_18_ENTRY_PRODUCT_SURFACE',
  dimensionalFollowUp: '12D-16/17' as const,
} as const;

export type Sims18Gate =
  | 'WAITING_DATA'
  | 'WAITING_PROVIDER'
  | 'FIXTURE_SIMULATION'
  | 'AGE_GATE_REQUIRED'
  | 'GATE_DENIED';

export type Sims18Status =
  | 'WAITING_DATA'
  | 'WAITING_PROVIDER'
  | 'AGE_GATE_REQUIRED'
  | 'GATE_DENIED'
  | 'READY';

export type SimsEntryMetaphor = 'PORTAL' | 'WORMHOLE';

export type SimsSandboxFraming = 'CULTURAL_NON_SEXUAL' | 'PROFESSIONAL_SANDBOX' | 'LOCAL_CIVIC_SIM';

export type Sims18AckFlags = {
  /** SIMULATION -- user clicked 18+ acknowledgment. Not live ID / age-token proof. */
  age18PlusAcknowledged: boolean;
  /** SIMULATION -- sandbox rules accepted. */
  sandboxRulesAcknowledged: boolean;
  liveLegal: false;
  liveAgeVerification: false;
};

export type SimsWorldStub = {
  worldId: string;
  name: string;
  framing: SimsSandboxFraming;
  entryMetaphor: SimsEntryMetaphor;
  /** Metaphor copy only -- never claims live portal / wormhole physics. */
  entryLabel: string;
  requiresAge18Plus: true;
  sexualFraming: false;
  liveSimWorld: false;
  prototypeOnly: true;
  description: string;
};

export type SimsEntryCard = {
  worldId: string;
  name: string;
  framing: SimsSandboxFraming;
  entryMetaphor: SimsEntryMetaphor;
  entryLabel: string;
  ageGated: true;
  sexualFraming: false;
  ack: Sims18AckFlags;
  entryAllowed: boolean;
  blockingReasons: string[];
  layerKind: 'SIMULATION';
  liveSimWorld: false;
  liveAgeVerification: false;
  livePortalPhysics: false;
  liveWormholeTransport: false;
};

export type Sims18EntryView = {
  status: Sims18Status;
  role: 'consumer';
  readOnly: true;
  l4Autonomy: false;
  productionMutation: false;
  layerKind: 'SIMULATION';
  simsGate: Sims18Gate;
  tenantScope: string | null;
  universeScope: string | null;
  worlds: SimsWorldStub[] | null;
  entryCard: SimsEntryCard | null;
  ack: Sims18AckFlags | null;
  waitingProviders: string[];
  readyProviders: string[];
  banners: string[];
  note: string;
  liveSimWorld: false;
  liveAgeVerification: false;
  livePortalPhysics: false;
  liveWormholeTransport: false;
  sexualSimFramingAllowed: false;
  portalsWormholesAreMetaphorsOnly: true;
  dimensionalFollowUp: '12D-16/17';
};

export type Sims18EntryFixtureBundle = {
  boundAt: string;
  universeId: string;
  tenantId: string;
  selectedWorldId: string | null;
  ack: Sims18AckFlags;
  worlds: SimsWorldStub[];
  waitingProviders: string[];
  readyProviders: string[];
  banners: string[];
  forceDenied: boolean;
};

export const DEFAULT_SIM_WAITING_PROVIDERS = [
  'LIVE_SIM_WORLD',
  'LIVE_AGE_VERIFICATION',
  'GROK',
  'CHATGPT',
  'GEMINI',
] as const;

export const DEFAULT_SIM_READY_PROVIDERS = [
  'LOCAL_RULES',
  'LOCAL_OLLAMA_STUB',
  'SIMS_ENTRY_FIXTURE',
] as const;

export const BUILTIN_SIMS_WORLDS: SimsWorldStub[] = [
  {
    worldId: 'sim-civic-plaza',
    name: 'Civic Plaza Sandbox',
    framing: 'LOCAL_CIVIC_SIM',
    entryMetaphor: 'PORTAL',
    entryLabel: 'Portal metaphor -- civic sandbox entry (not live teleport)',
    requiresAge18Plus: true,
    sexualFraming: false,
    liveSimWorld: false,
    prototypeOnly: true,
    description:
      '18+ LOCAL/SIMULATION civic sandbox. Portal label is metaphor only. Non-sexual cultural framing.',
  },
  {
    worldId: 'sim-pro-atelier',
    name: 'Professional Atelier Sandbox',
    framing: 'PROFESSIONAL_SANDBOX',
    entryMetaphor: 'WORMHOLE',
    entryLabel: 'Wormhole metaphor -- professional sandbox hop (not live transport)',
    requiresAge18Plus: true,
    sexualFraming: false,
    liveSimWorld: false,
    prototypeOnly: true,
    description:
      '18+ LOCAL/SIMULATION professional sandbox. Wormhole label is metaphor only. Non-sexual framing.',
  },
  {
    worldId: 'sim-cultural-circle',
    name: 'Cultural Circle Sandbox',
    framing: 'CULTURAL_NON_SEXUAL',
    entryMetaphor: 'PORTAL',
    entryLabel: 'Portal metaphor -- cultural circle entry (not live physics)',
    requiresAge18Plus: true,
    sexualFraming: false,
    liveSimWorld: false,
    prototypeOnly: true,
    description:
      '18+ LOCAL/SIMULATION cultural circle. Portal label is metaphor only. Explicitly non-sexual.',
  },
];

export const BUILTIN_SIMS_18_ENTRY_FIXTURE: Omit<
  Sims18EntryFixtureBundle,
  'boundAt' | 'ack' | 'selectedWorldId' | 'forceDenied'
> = {
  universeId: 'demo-sims-18-entry',
  tenantId: 'xiv',
  worlds: BUILTIN_SIMS_WORLDS,
  waitingProviders: [...DEFAULT_SIM_WAITING_PROVIDERS],
  readyProviders: [...DEFAULT_SIM_READY_PROVIDERS],
  banners: [
    'READ ONLY -- Sims 18+ entry product surface over SIMULATION fixture only.',
    'productionMutation=false -- never write live sim worlds.',
    'Portal / wormhole labels are metaphors only -- livePortalPhysics=false; liveWormholeTransport=false.',
    '18+ acknowledgment is SIMULATION -- liveAgeVerification=false.',
    'sexualSimFramingAllowed=false. Cultural / professional / civic sandboxes only.',
    '12D-16/17 FOLLOW_UP product UX -- no dimensional fabric import.',
  ],
};

const EMPTY_ACK: Sims18AckFlags = {
  age18PlusAcknowledged: false,
  sandboxRulesAcknowledged: false,
  liveLegal: false,
  liveAgeVerification: false,
};

const globalStore = globalThis as typeof globalThis & {
  __xivSims18EntryFixture?: Sims18EntryFixtureBundle | null;
};

export function resetSims18EntrySession() {
  globalStore.__xivSims18EntryFixture = null;
}

export function isSims18EntryFixtureBound(): boolean {
  return Boolean(globalStore.__xivSims18EntryFixture);
}

export function sims18EntryAllowsL4(): false {
  return false;
}

export function sims18EntryAllowsProductionMutation(): false {
  return false;
}

export function sims18EntryIsReadOnly(): true {
  return true;
}

export function sims18EntryAllowsLiveSimWorld(): false {
  return false;
}

export function sims18EntryAllowsLiveAgeVerification(): false {
  return false;
}

export function sims18EntryAllowsLivePortalPhysics(): false {
  return false;
}

export function sims18EntryAllowsLiveWormholeTransport(): false {
  return false;
}

export function sims18EntryAllowsSexualFraming(): false {
  return false;
}

export function sims18EntryPortalsWormholesAreMetaphorsOnly(): true {
  return true;
}

function buildEntryCard(
  world: SimsWorldStub,
  ack: Sims18AckFlags,
): SimsEntryCard {
  const blockingReasons: string[] = [];
  if (!ack.age18PlusAcknowledged) {
    blockingReasons.push('AGE_GATE_REQUIRED -- 18+ SIMULATION acknowledgment missing');
  }
  if (!ack.sandboxRulesAcknowledged) {
    blockingReasons.push('SANDBOX_RULES_REQUIRED -- sandbox rules SIMULATION acknowledgment missing');
  }
  return {
    worldId: world.worldId,
    name: world.name,
    framing: world.framing,
    entryMetaphor: world.entryMetaphor,
    entryLabel: world.entryLabel,
    ageGated: true,
    sexualFraming: false,
    ack: { ...ack, liveLegal: false, liveAgeVerification: false },
    entryAllowed: blockingReasons.length === 0,
    blockingReasons,
    layerKind: 'SIMULATION',
    liveSimWorld: false,
    liveAgeVerification: false,
    livePortalPhysics: false,
    liveWormholeTransport: false,
  };
}

export function bindSims18EntryFixture(input?: {
  universeId?: string;
  tenantId?: string;
  selectedWorldId?: string | null;
  forceDenied?: boolean;
}): Sims18EntryFixtureBundle {
  const universeId = (input?.universeId ?? BUILTIN_SIMS_18_ENTRY_FIXTURE.universeId).trim();
  const tenantId = (input?.tenantId ?? BUILTIN_SIMS_18_ENTRY_FIXTURE.tenantId).trim();
  if (!universeId) {
    throw new Error('universe_required -- sims 18+ entry fixture bind requires universeId');
  }
  if (!tenantId) {
    throw new Error('tenant_required -- sims 18+ entry fixture bind requires tenantId');
  }

  const selectedWorldId =
    input?.selectedWorldId === undefined
      ? BUILTIN_SIMS_WORLDS[0]?.worldId ?? null
      : input.selectedWorldId;

  const bundle: Sims18EntryFixtureBundle = {
    boundAt: new Date().toISOString(),
    universeId,
    tenantId,
    selectedWorldId,
    ack: { ...EMPTY_ACK },
    worlds: BUILTIN_SIMS_WORLDS.map((w) => ({
      ...w,
      requiresAge18Plus: true as const,
      sexualFraming: false as const,
      liveSimWorld: false as const,
      prototypeOnly: true as const,
    })),
    waitingProviders: [...BUILTIN_SIMS_18_ENTRY_FIXTURE.waitingProviders],
    readyProviders: [...BUILTIN_SIMS_18_ENTRY_FIXTURE.readyProviders],
    banners: [...BUILTIN_SIMS_18_ENTRY_FIXTURE.banners],
    forceDenied: input?.forceDenied === true,
  };

  globalStore.__xivSims18EntryFixture = bundle;
  return bundle;
}

export function clearSims18EntryFixture() {
  globalStore.__xivSims18EntryFixture = null;
}

export function selectSimsWorld(worldId: string): Sims18EntryFixtureBundle {
  const fixture = globalStore.__xivSims18EntryFixture;
  if (!fixture) {
    throw new Error('fixture_required -- bind Sims 18+ entry fixture before selecting a world');
  }
  const found = fixture.worlds.find((w) => w.worldId === worldId);
  if (!found) {
    throw new Error(`world_not_found -- ${worldId}`);
  }
  fixture.selectedWorldId = worldId;
  return fixture;
}

export function acknowledgeSims18Entry(
  input: Partial<Pick<Sims18AckFlags, 'age18PlusAcknowledged' | 'sandboxRulesAcknowledged'>>,
): Sims18AckFlags {
  const fixture = globalStore.__xivSims18EntryFixture;
  if (!fixture) {
    throw new Error('fixture_required -- bind Sims 18+ entry fixture before acknowledging');
  }
  if (input.age18PlusAcknowledged !== undefined) {
    fixture.ack.age18PlusAcknowledged = input.age18PlusAcknowledged === true;
  }
  if (input.sandboxRulesAcknowledged !== undefined) {
    fixture.ack.sandboxRulesAcknowledged = input.sandboxRulesAcknowledged === true;
  }
  fixture.ack.liveLegal = false;
  fixture.ack.liveAgeVerification = false;
  return { ...fixture.ack };
}

export function attemptSims18Entry(input?: {
  worldId?: string;
}): { allowed: boolean; card: SimsEntryCard | null; reasons: string[] } {
  const fixture = globalStore.__xivSims18EntryFixture;
  if (!fixture) {
    return {
      allowed: false,
      card: null,
      reasons: ['WAITING_DATA -- Sims 18+ entry unbound'],
    };
  }
  if (fixture.forceDenied) {
    return {
      allowed: false,
      card: null,
      reasons: ['GATE_DENIED -- Sims 18+ entry policy gate blocked this entry'],
    };
  }
  const worldId = input?.worldId ?? fixture.selectedWorldId;
  const world = fixture.worlds.find((w) => w.worldId === worldId) ?? null;
  if (!world) {
    return {
      allowed: false,
      card: null,
      reasons: ['WAITING_DATA -- no selected Sims world'],
    };
  }
  const card = buildEntryCard(world, fixture.ack);
  return {
    allowed: card.entryAllowed,
    card,
    reasons: card.blockingReasons,
  };
}

export function listSims18EntryView(input?: {
  tenantId?: string;
  universeId?: string;
  forceDenied?: boolean;
}): Sims18EntryView {
  const fixture = globalStore.__xivSims18EntryFixture ?? null;
  const requestedTenant = input?.tenantId?.trim() || null;
  const requestedUniverse = input?.universeId?.trim() || null;
  const forceDenied = input?.forceDenied === true || fixture?.forceDenied === true;

  if (!fixture) {
    return {
      status: 'WAITING_DATA',
      role: 'consumer',
      readOnly: true,
      l4Autonomy: false,
      productionMutation: false,
      layerKind: 'SIMULATION',
      simsGate: 'WAITING_DATA',
      tenantScope: null,
      universeScope: null,
      worlds: null,
      entryCard: null,
      ack: null,
      waitingProviders: [...DEFAULT_SIM_WAITING_PROVIDERS],
      readyProviders: [...DEFAULT_SIM_READY_PROVIDERS],
      banners: [
        'WAITING_DATA -- Sims 18+ entry unbound on product lane.',
        'Bind an explicit SIMULATION fixture to surface portal/wormhole metaphor entry stubs. Never fabricate live sim worlds.',
        'liveSimWorld=false; liveAgeVerification=false; livePortalPhysics=false; productionMutation=false; L4=false.',
      ],
      note:
        'WAITING_DATA -- Sims 18+ entry unbound. worlds=null; entryCard=null; ack=null. Portal/wormhole metaphors only when bound. LIVE_SIM_WORLD / LIVE_AGE_VERIFICATION WAITING_PROVIDER. Nothing fabricated. L4 false; productionMutation false.',
      liveSimWorld: false,
      liveAgeVerification: false,
      livePortalPhysics: false,
      liveWormholeTransport: false,
      sexualSimFramingAllowed: false,
      portalsWormholesAreMetaphorsOnly: true,
      dimensionalFollowUp: '12D-16/17',
    };
  }

  if (
    (requestedTenant && requestedTenant !== fixture.tenantId) ||
    (requestedUniverse && requestedUniverse !== fixture.universeId)
  ) {
    return {
      status: 'WAITING_DATA',
      role: 'consumer',
      readOnly: true,
      l4Autonomy: false,
      productionMutation: false,
      layerKind: 'SIMULATION',
      simsGate: 'WAITING_DATA',
      tenantScope: requestedTenant,
      universeScope: requestedUniverse,
      worlds: null,
      entryCard: null,
      ack: null,
      waitingProviders: [...DEFAULT_SIM_WAITING_PROVIDERS],
      readyProviders: [...DEFAULT_SIM_READY_PROVIDERS],
      banners: [
        'WAITING_DATA -- requested tenant/universe does not match bound SIMULATION fixture.',
        'Cross-tenant Sims entry surface is never leaked.',
      ],
      note:
        'WAITING_DATA -- tenant/universe scope mismatch against bound fixture. worlds=null; entryCard=null; ack=null. No fabricated Sims metrics.',
      liveSimWorld: false,
      liveAgeVerification: false,
      livePortalPhysics: false,
      liveWormholeTransport: false,
      sexualSimFramingAllowed: false,
      portalsWormholesAreMetaphorsOnly: true,
      dimensionalFollowUp: '12D-16/17',
    };
  }

  if (forceDenied) {
    return {
      status: 'GATE_DENIED',
      role: 'consumer',
      readOnly: true,
      l4Autonomy: false,
      productionMutation: false,
      layerKind: 'SIMULATION',
      simsGate: 'GATE_DENIED',
      tenantScope: fixture.tenantId,
      universeScope: fixture.universeId,
      worlds: null,
      entryCard: null,
      ack: { ...fixture.ack, liveLegal: false, liveAgeVerification: false },
      waitingProviders: [...DEFAULT_SIM_WAITING_PROVIDERS],
      readyProviders: [...DEFAULT_SIM_READY_PROVIDERS],
      banners: [
        'GATE_DENIED -- Sims 18+ entry policy gate blocked this read.',
        'entryCard stays null. No fabricated live sim world.',
      ],
      note:
        'GATE_DENIED -- policy gate denied Sims 18+ entry. worlds=null; entryCard=null. liveSimWorld=false; livePortalPhysics=false; productionMutation=false; L4 false.',
      liveSimWorld: false,
      liveAgeVerification: false,
      livePortalPhysics: false,
      liveWormholeTransport: false,
      sexualSimFramingAllowed: false,
      portalsWormholesAreMetaphorsOnly: true,
      dimensionalFollowUp: '12D-16/17',
    };
  }

  const selected =
    fixture.worlds.find((w) => w.worldId === fixture.selectedWorldId) ?? fixture.worlds[0] ?? null;
  const entryCard = selected ? buildEntryCard(selected, fixture.ack) : null;

  if (!fixture.ack.age18PlusAcknowledged) {
    return {
      status: 'AGE_GATE_REQUIRED',
      role: 'consumer',
      readOnly: true,
      l4Autonomy: false,
      productionMutation: false,
      layerKind: 'SIMULATION',
      simsGate: 'AGE_GATE_REQUIRED',
      tenantScope: fixture.tenantId,
      universeScope: fixture.universeId,
      worlds: fixture.worlds.map((w) => ({ ...w })),
      entryCard,
      ack: { ...fixture.ack, liveLegal: false, liveAgeVerification: false },
      waitingProviders: [...fixture.waitingProviders],
      readyProviders: [...fixture.readyProviders],
      banners: [...fixture.banners, 'AGE_GATE_REQUIRED -- acknowledge 18+ (SIMULATION) before portal/wormhole metaphor entry.'],
      note:
        `AGE_GATE_REQUIRED -- fixture bound (${fixture.universeId}/${fixture.tenantId}). 18+ SIMULATION ack missing. Portal/wormhole labels remain metaphors only. liveSimWorld=false; liveAgeVerification=false; productionMutation=false; L4 false.`,
      liveSimWorld: false,
      liveAgeVerification: false,
      livePortalPhysics: false,
      liveWormholeTransport: false,
      sexualSimFramingAllowed: false,
      portalsWormholesAreMetaphorsOnly: true,
      dimensionalFollowUp: '12D-16/17',
    };
  }

  const providersStillWaiting = fixture.waitingProviders.length > 0;
  const status: Sims18Status = providersStillWaiting ? 'WAITING_PROVIDER' : 'READY';

  return {
    status,
    role: 'consumer',
    readOnly: true,
    l4Autonomy: false,
    productionMutation: false,
    layerKind: 'SIMULATION',
    simsGate: 'FIXTURE_SIMULATION',
    tenantScope: fixture.tenantId,
    universeScope: fixture.universeId,
    worlds: fixture.worlds.map((w) => ({ ...w })),
    entryCard,
    ack: { ...fixture.ack, liveLegal: false, liveAgeVerification: false },
    waitingProviders: [...fixture.waitingProviders],
    readyProviders: [...fixture.readyProviders],
    banners: [...fixture.banners],
    note: providersStillWaiting
      ? `FIXTURE_SIMULATION bound (${fixture.universeId}/${fixture.tenantId}). Providers remain WAITING_PROVIDER (${fixture.waitingProviders.join(', ')}). Portal/wormhole metaphors only. liveSimWorld=false; liveAgeVerification=false; productionMutation=false; L4 false. Not a live Sims world.`
      : `FIXTURE_SIMULATION bound (${fixture.universeId}/${fixture.tenantId}). Portal/wormhole metaphors only. liveSimWorld=false; liveAgeVerification=false; productionMutation=false; L4 false.`,
    liveSimWorld: false,
    liveAgeVerification: false,
    livePortalPhysics: false,
    liveWormholeTransport: false,
    sexualSimFramingAllowed: false,
    portalsWormholesAreMetaphorsOnly: true,
    dimensionalFollowUp: '12D-16/17',
  };
}
