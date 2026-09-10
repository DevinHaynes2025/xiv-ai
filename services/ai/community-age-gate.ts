/**
 * US-COM-01 -- Community age-gate + rules acknowledgment stubs (LOCAL / SIMULATION).
 * 18+ acknowledgment required for gated communities.
 * Waiver/contract acknowledge flags are SIMULATION -- not live legal contracts.
 * Anti-predator / anti-bully policy denial stubs.
 * Copy frames gated communities as non-sexual cultural / professional circles only.
 * WAITING_* honesty; L4 false; productionMutation false; liveAgeVerification false.
 */

export const COMMUNITY_AGE_GATE_POLICY = {
  l4Autonomy: false as const,
  productionMutation: false as const,
  layerKind: 'SIMULATION' as const,
  /** SIMULATION flags only -- never claim live legal waiver/contract force. */
  liveLegalWaiver: false as const,
  liveAgeVerification: false as const,
  sexualCommunityFramingAllowed: false as const,
  antiPredatorPolicyRequired: true as const,
  antiBullyPolicyRequired: true as const,
  ageGateMinimumYears: 18 as const,
  label: 'COMMUNITY_AGE_GATE_SIMULATION',
} as const;

export type CommunityAgeGate =
  | 'WAITING_DATA'
  | 'WAITING_PROVIDER'
  | 'FIXTURE_SIMULATION'
  | 'AGE_GATE_REQUIRED'
  | 'RULES_ACK_REQUIRED'
  | 'GATE_DENIED';

export type CommunityAgeGateStatus =
  | 'WAITING_DATA'
  | 'WAITING_PROVIDER'
  | 'AGE_GATE_REQUIRED'
  | 'RULES_ACK_REQUIRED'
  | 'GATE_DENIED'
  | 'READY';

export type CommunityFraming = 'CULTURAL_NON_SEXUAL' | 'PROFESSIONAL' | 'LOCAL_CIVIC';

export type CommunityPolicyDenialKind = 'ANTI_PREDATOR' | 'ANTI_BULLY' | 'AGE_GATE' | 'RULES_REQUIRED';

export type SimulationAckFlags = {
  /** SIMULATION -- user clicked 18+ acknowledgment. Not live ID / age-token proof. */
  age18PlusAcknowledged: boolean;
  /** SIMULATION -- waiver/contract checkbox. Not live legally binding execution. */
  waiverContractAcknowledged: boolean;
  /** SIMULATION -- anti-predator community rules accepted. */
  antiPredatorAcknowledged: boolean;
  /** SIMULATION -- anti-bully community rules accepted. */
  antiBullyAcknowledged: boolean;
  /** Explicit honesty: these flags are never live legal. */
  liveLegal: false;
  liveAgeVerification: false;
};

export type GatedCommunityStub = {
  communityId: string;
  name: string;
  framing: CommunityFraming;
  /** Always true for US-COM-01 gated stubs. */
  ageGated: true;
  /** Copy must stay non-sexual cultural / professional. */
  description: string;
  requiresAge18Plus: true;
  requiresWaiverAck: true;
  requiresAntiPredatorAck: true;
  requiresAntiBullyAck: true;
  sexualFraming: false;
  prototypeOnly: true;
};

export type CommunityPolicyDenialStub = {
  id: string;
  kind: CommunityPolicyDenialKind;
  communityId: string | null;
  reason: string;
  verdict: 'denied';
  /** Stub only -- not a live moderation incident feed. */
  liveIncident: false;
  recordedAt: string;
};

export type CommunityAgeGateCard = {
  communityId: string;
  name: string;
  framing: CommunityFraming;
  ageGated: true;
  sexualFraming: false;
  ack: SimulationAckFlags;
  entryAllowed: boolean;
  blockingReasons: string[];
  layerKind: 'SIMULATION';
  liveLegalWaiver: false;
  liveAgeVerification: false;
};

export type CommunityAgeGateView = {
  status: CommunityAgeGateStatus;
  role: 'consumer_business';
  readOnly: true;
  l4Autonomy: false;
  productionMutation: false;
  layerKind: 'SIMULATION';
  communityAgeGate: CommunityAgeGate;
  tenantScope: string | null;
  universeScope: string | null;
  communities: GatedCommunityStub[] | null;
  ageGateCard: CommunityAgeGateCard | null;
  ack: SimulationAckFlags | null;
  policyDenials: CommunityPolicyDenialStub[] | null;
  waitingProviders: string[];
  readyProviders: string[];
  banners: string[];
  note: string;
  liveLegalWaiver: false;
  liveAgeVerification: false;
  sexualCommunityFramingAllowed: false;
};

export type CommunityAgeGateFixtureBundle = {
  boundAt: string;
  universeId: string;
  tenantId: string;
  communities: GatedCommunityStub[];
  ack: SimulationAckFlags;
  selectedCommunityId: string | null;
  policyDenials: CommunityPolicyDenialStub[];
  waitingProviders: string[];
  readyProviders: string[];
  banners: string[];
};

export const DEFAULT_COM_WAITING_PROVIDERS = [
  'LIVE_AGE_VERIFICATION',
  'LIVE_LEGAL_WAIVER',
  'GROK',
  'CHATGPT',
  'GEMINI',
] as const;

export const DEFAULT_COM_READY_PROVIDERS = [
  'LOCAL_RULES',
  'AGE_GATE_STUB',
  'ANTI_PREDATOR_STUB',
  'ANTI_BULLY_STUB',
] as const;

export const BUILTIN_GATED_COMMUNITIES: readonly GatedCommunityStub[] = [
  {
    communityId: 'com-cultural-heritage',
    name: 'Heritage Culture Circle',
    framing: 'CULTURAL_NON_SEXUAL',
    ageGated: true,
    description:
      'Adults-only cultural heritage discussion: language, festivals, craft, and local history. Non-sexual framing. Not a dating or adult-content space.',
    requiresAge18Plus: true,
    requiresWaiverAck: true,
    requiresAntiPredatorAck: true,
    requiresAntiBullyAck: true,
    sexualFraming: false,
    prototypeOnly: true,
  },
  {
    communityId: 'com-civic-makers',
    name: 'Civic Makers Forum',
    framing: 'LOCAL_CIVIC',
    ageGated: true,
    description:
      '18+ civic makers sharing neighborhood projects, markets, and cultural events. Professional/civic tone only. Non-sexual community framing.',
    requiresAge18Plus: true,
    requiresWaiverAck: true,
    requiresAntiPredatorAck: true,
    requiresAntiBullyAck: true,
    sexualFraming: false,
    prototypeOnly: true,
  },
  {
    communityId: 'com-pro-ops-guild',
    name: 'Operators Guild',
    framing: 'PROFESSIONAL',
    ageGated: true,
    description:
      'Professional operators guild for supply and ops craft. Age-gated for liability/waiver simulation only. Non-sexual professional framing.',
    requiresAge18Plus: true,
    requiresWaiverAck: true,
    requiresAntiPredatorAck: true,
    requiresAntiBullyAck: true,
    sexualFraming: false,
    prototypeOnly: true,
  },
] as const;

export const BUILTIN_COMMUNITY_AGE_GATE_FIXTURE: Omit<
  CommunityAgeGateFixtureBundle,
  'boundAt' | 'ack' | 'selectedCommunityId' | 'policyDenials'
> = {
  universeId: 'demo-community-age-gate',
  tenantId: 'xiv',
  communities: [...BUILTIN_GATED_COMMUNITIES],
  waitingProviders: [...DEFAULT_COM_WAITING_PROVIDERS],
  readyProviders: [...DEFAULT_COM_READY_PROVIDERS],
  banners: [
    'SIMULATION -- Community age-gate + rules acknowledgment stubs only.',
    '18+ acknowledgment required before gated community entry.',
    'Waiver/contract flags are SIMULATION -- not live legal execution.',
    'Anti-predator and anti-bully policy denial stubs are local only.',
    'Copy stays non-sexual cultural / professional / civic. sexualFraming=false.',
    'liveAgeVerification=false; liveLegalWaiver=false; productionMutation=false; L4=false.',
  ],
};

const EMPTY_ACK: SimulationAckFlags = {
  age18PlusAcknowledged: false,
  waiverContractAcknowledged: false,
  antiPredatorAcknowledged: false,
  antiBullyAcknowledged: false,
  liveLegal: false,
  liveAgeVerification: false,
};

const globalStore = globalThis as typeof globalThis & {
  __xivCommunityAgeGateFixture?: CommunityAgeGateFixtureBundle | null;
};

function nowIso(): string {
  return new Date().toISOString();
}

function blockingReasonsFor(ack: SimulationAckFlags): string[] {
  const reasons: string[] = [];
  if (!ack.age18PlusAcknowledged) reasons.push('AGE_18_PLUS_ACK_REQUIRED');
  if (!ack.waiverContractAcknowledged) reasons.push('WAIVER_CONTRACT_ACK_REQUIRED');
  if (!ack.antiPredatorAcknowledged) reasons.push('ANTI_PREDATOR_ACK_REQUIRED');
  if (!ack.antiBullyAcknowledged) reasons.push('ANTI_BULLY_ACK_REQUIRED');
  return reasons;
}

function entryAllowed(ack: SimulationAckFlags): boolean {
  return blockingReasonsFor(ack).length === 0;
}

function deriveGate(ack: SimulationAckFlags, denied: boolean): CommunityAgeGate {
  if (denied) return 'GATE_DENIED';
  if (!ack.age18PlusAcknowledged) return 'AGE_GATE_REQUIRED';
  if (
    !ack.waiverContractAcknowledged ||
    !ack.antiPredatorAcknowledged ||
    !ack.antiBullyAcknowledged
  ) {
    return 'RULES_ACK_REQUIRED';
  }
  return 'FIXTURE_SIMULATION';
}

function deriveStatus(ack: SimulationAckFlags, denied: boolean, waitingProviders: string[]): CommunityAgeGateStatus {
  if (denied) return 'GATE_DENIED';
  if (!ack.age18PlusAcknowledged) return 'AGE_GATE_REQUIRED';
  if (
    !ack.waiverContractAcknowledged ||
    !ack.antiPredatorAcknowledged ||
    !ack.antiBullyAcknowledged
  ) {
    return 'RULES_ACK_REQUIRED';
  }
  return waitingProviders.length > 0 ? 'WAITING_PROVIDER' : 'READY';
}

function buildCard(
  community: GatedCommunityStub,
  ack: SimulationAckFlags,
): CommunityAgeGateCard {
  const reasons = blockingReasonsFor(ack);
  return {
    communityId: community.communityId,
    name: community.name,
    framing: community.framing,
    ageGated: true,
    sexualFraming: false,
    ack: { ...ack, liveLegal: false, liveAgeVerification: false },
    entryAllowed: reasons.length === 0,
    blockingReasons: reasons,
    layerKind: 'SIMULATION',
    liveLegalWaiver: false,
    liveAgeVerification: false,
  };
}

export function resetCommunityAgeGateSession() {
  globalStore.__xivCommunityAgeGateFixture = null;
}

export function isCommunityAgeGateFixtureBound(): boolean {
  return Boolean(globalStore.__xivCommunityAgeGateFixture);
}

export function communityAgeGateAllowsL4(): false {
  return false;
}

export function communityAgeGateAllowsProductionMutation(): false {
  return false;
}

export function communityAgeGateIsReadOnly(): true {
  return true;
}

export function communityAgeGateAllowsLiveLegalWaiver(): false {
  return false;
}

export function communityAgeGateAllowsLiveAgeVerification(): false {
  return false;
}

export function communityAgeGateAllowsSexualFraming(): false {
  return false;
}

export function bindCommunityAgeGateFixture(input?: {
  universeId?: string;
  tenantId?: string;
  selectedCommunityId?: string | null;
}): CommunityAgeGateFixtureBundle {
  const universeId = (input?.universeId ?? BUILTIN_COMMUNITY_AGE_GATE_FIXTURE.universeId).trim();
  const tenantId = (input?.tenantId ?? BUILTIN_COMMUNITY_AGE_GATE_FIXTURE.tenantId).trim();
  if (!universeId) {
    throw new Error('universe_required -- community age-gate fixture bind requires universeId');
  }
  if (!tenantId) {
    throw new Error('tenant_required -- community age-gate fixture bind requires tenantId');
  }

  const selectedCommunityId =
    input?.selectedCommunityId === undefined
      ? BUILTIN_GATED_COMMUNITIES[0]!.communityId
      : input.selectedCommunityId;

  if (
    selectedCommunityId &&
    !BUILTIN_GATED_COMMUNITIES.some((c) => c.communityId === selectedCommunityId)
  ) {
    throw new Error('community_unknown -- selectedCommunityId is not in SIMULATION fixture');
  }

  const bundle: CommunityAgeGateFixtureBundle = {
    boundAt: nowIso(),
    universeId,
    tenantId,
    communities: BUILTIN_GATED_COMMUNITIES.map((row) => ({
      ...row,
      ageGated: true as const,
      sexualFraming: false as const,
      prototypeOnly: true as const,
      requiresAge18Plus: true as const,
      requiresWaiverAck: true as const,
      requiresAntiPredatorAck: true as const,
      requiresAntiBullyAck: true as const,
    })),
    ack: { ...EMPTY_ACK },
    selectedCommunityId,
    policyDenials: [],
    waitingProviders: [...BUILTIN_COMMUNITY_AGE_GATE_FIXTURE.waitingProviders],
    readyProviders: [...BUILTIN_COMMUNITY_AGE_GATE_FIXTURE.readyProviders],
    banners: [...BUILTIN_COMMUNITY_AGE_GATE_FIXTURE.banners],
  };

  globalStore.__xivCommunityAgeGateFixture = bundle;
  return bundle;
}

export function clearCommunityAgeGateFixture() {
  globalStore.__xivCommunityAgeGateFixture = null;
}

export function acknowledgeCommunityAgeGate(input: {
  age18PlusAcknowledged?: boolean;
  waiverContractAcknowledged?: boolean;
  antiPredatorAcknowledged?: boolean;
  antiBullyAcknowledged?: boolean;
}): SimulationAckFlags {
  const fixture = globalStore.__xivCommunityAgeGateFixture;
  if (!fixture) {
    throw new Error('fixture_required -- acknowledgeCommunityAgeGate requires a bound SIMULATION fixture');
  }

  fixture.ack = {
    age18PlusAcknowledged: input.age18PlusAcknowledged ?? fixture.ack.age18PlusAcknowledged,
    waiverContractAcknowledged:
      input.waiverContractAcknowledged ?? fixture.ack.waiverContractAcknowledged,
    antiPredatorAcknowledged: input.antiPredatorAcknowledged ?? fixture.ack.antiPredatorAcknowledged,
    antiBullyAcknowledged: input.antiBullyAcknowledged ?? fixture.ack.antiBullyAcknowledged,
    liveLegal: false,
    liveAgeVerification: false,
  };

  return { ...fixture.ack };
}

export function selectGatedCommunity(communityId: string): GatedCommunityStub {
  const fixture = globalStore.__xivCommunityAgeGateFixture;
  if (!fixture) {
    throw new Error('fixture_required -- selectGatedCommunity requires a bound SIMULATION fixture');
  }
  const community = fixture.communities.find((row) => row.communityId === communityId);
  if (!community) {
    throw new Error('community_unknown -- communityId is not in SIMULATION fixture');
  }
  fixture.selectedCommunityId = communityId;
  return { ...community };
}

export function recordCommunityPolicyDenialStub(input: {
  kind: CommunityPolicyDenialKind;
  communityId?: string | null;
  reason?: string;
}): CommunityPolicyDenialStub {
  const fixture = globalStore.__xivCommunityAgeGateFixture;
  if (!fixture) {
    throw new Error('fixture_required -- recordCommunityPolicyDenialStub requires a bound SIMULATION fixture');
  }

  const reason =
    input.reason ??
    (input.kind === 'ANTI_PREDATOR'
      ? 'ANTI_PREDATOR_POLICY -- predatory contact / grooming patterns denied (SIMULATION stub).'
      : input.kind === 'ANTI_BULLY'
        ? 'ANTI_BULLY_POLICY -- harassment / bullying conduct denied (SIMULATION stub).'
        : input.kind === 'AGE_GATE'
          ? 'AGE_GATE -- 18+ acknowledgment missing; gated community entry denied.'
          : 'RULES_REQUIRED -- waiver / community rules acknowledgment missing; entry denied.');

  const denial: CommunityPolicyDenialStub = {
    id: `com-denial-${input.kind.toLowerCase()}-${fixture.policyDenials.length + 1}`,
    kind: input.kind,
    communityId: input.communityId ?? fixture.selectedCommunityId,
    reason,
    verdict: 'denied',
    liveIncident: false,
    recordedAt: nowIso(),
  };

  fixture.policyDenials = [...fixture.policyDenials, denial];
  return denial;
}

export function probeCommunityPolicyDenialStubs(): CommunityPolicyDenialStub[] {
  const fixture = globalStore.__xivCommunityAgeGateFixture;
  if (!fixture) {
    throw new Error('fixture_required -- probeCommunityPolicyDenialStubs requires a bound SIMULATION fixture');
  }

  const kinds: CommunityPolicyDenialKind[] = ['ANTI_PREDATOR', 'ANTI_BULLY', 'AGE_GATE', 'RULES_REQUIRED'];
  const recorded: CommunityPolicyDenialStub[] = [];
  for (const kind of kinds) {
    recorded.push(recordCommunityPolicyDenialStub({ kind }));
  }
  return recorded;
}

export function clearCommunityPolicyDenialStubs() {
  const fixture = globalStore.__xivCommunityAgeGateFixture;
  if (!fixture) {
    throw new Error('fixture_required -- clearCommunityPolicyDenialStubs requires a bound SIMULATION fixture');
  }
  fixture.policyDenials = [];
}

export function attemptGatedCommunityEntry(input?: {
  communityId?: string;
}): {
  allowed: false;
  gate: CommunityAgeGate;
  denial: CommunityPolicyDenialStub | null;
  card: CommunityAgeGateCard | null;
  note: string;
} | {
  allowed: true;
  gate: 'FIXTURE_SIMULATION';
  denial: null;
  card: CommunityAgeGateCard;
  note: string;
} {
  const fixture = globalStore.__xivCommunityAgeGateFixture;
  if (!fixture) {
    throw new Error('fixture_required -- attemptGatedCommunityEntry requires a bound SIMULATION fixture');
  }

  const communityId = (input?.communityId ?? fixture.selectedCommunityId ?? '').trim();
  const community = fixture.communities.find((row) => row.communityId === communityId);
  if (!community) {
    throw new Error('community_unknown -- attemptGatedCommunityEntry communityId missing from fixture');
  }

  fixture.selectedCommunityId = community.communityId;
  const card = buildCard(community, fixture.ack);

  if (!fixture.ack.age18PlusAcknowledged) {
    const denial = recordCommunityPolicyDenialStub({
      kind: 'AGE_GATE',
      communityId: community.communityId,
    });
    return {
      allowed: false,
      gate: 'AGE_GATE_REQUIRED',
      denial,
      card,
      note: 'AGE_GATE_REQUIRED -- 18+ acknowledgment missing. Entry denied. SIMULATION stub only; liveAgeVerification=false.',
    };
  }

  if (
    !fixture.ack.waiverContractAcknowledged ||
    !fixture.ack.antiPredatorAcknowledged ||
    !fixture.ack.antiBullyAcknowledged
  ) {
    const kind: CommunityPolicyDenialKind = !fixture.ack.antiPredatorAcknowledged
      ? 'ANTI_PREDATOR'
      : !fixture.ack.antiBullyAcknowledged
        ? 'ANTI_BULLY'
        : 'RULES_REQUIRED';
    const denial = recordCommunityPolicyDenialStub({
      kind,
      communityId: community.communityId,
    });
    return {
      allowed: false,
      gate: 'RULES_ACK_REQUIRED',
      denial,
      card,
      note: 'RULES_ACK_REQUIRED -- waiver/contract and anti-predator/anti-bully acknowledgments required. SIMULATION -- not live legal.',
    };
  }

  return {
    allowed: true,
    gate: 'FIXTURE_SIMULATION',
    denial: null,
    card,
    note: 'FIXTURE_SIMULATION entry allowed after local acknowledgments. liveAgeVerification=false; liveLegalWaiver=false; WAITING_PROVIDER for live age/legal providers. Not production.',
  };
}

export function listCommunityAgeGateView(input?: {
  tenantId?: string;
  universeId?: string;
  forceDenied?: boolean;
}): CommunityAgeGateView {
  const fixture = globalStore.__xivCommunityAgeGateFixture ?? null;
  const requestedTenant = input?.tenantId?.trim() || null;
  const requestedUniverse = input?.universeId?.trim() || null;
  const forceDenied = input?.forceDenied === true;

  if (!fixture) {
    return {
      status: 'WAITING_DATA',
      role: 'consumer_business',
      readOnly: true,
      l4Autonomy: false,
      productionMutation: false,
      layerKind: 'SIMULATION',
      communityAgeGate: 'WAITING_DATA',
      tenantScope: null,
      universeScope: null,
      communities: null,
      ageGateCard: null,
      ack: null,
      policyDenials: null,
      waitingProviders: [...DEFAULT_COM_WAITING_PROVIDERS],
      readyProviders: [...DEFAULT_COM_READY_PROVIDERS],
      banners: [
        'WAITING_DATA -- Community age-gate unbound on product lane.',
        'Bind an explicit SIMULATION fixture for 18+ / waiver / anti-predator / anti-bully stubs.',
        'Never claim live legal waiver force or live age verification. L4 false; productionMutation false.',
      ],
      note: 'WAITING_DATA -- Community age-gate unbound. communities=null; ageGateCard=null; ack=null; policyDenials=null. Live age/legal providers WAITING_PROVIDER. Nothing fabricated. L4 false; productionMutation false.',
      liveLegalWaiver: false,
      liveAgeVerification: false,
      sexualCommunityFramingAllowed: false,
    };
  }

  if (
    (requestedTenant && requestedTenant !== fixture.tenantId) ||
    (requestedUniverse && requestedUniverse !== fixture.universeId)
  ) {
    return {
      status: 'WAITING_DATA',
      role: 'consumer_business',
      readOnly: true,
      l4Autonomy: false,
      productionMutation: false,
      layerKind: 'SIMULATION',
      communityAgeGate: 'WAITING_DATA',
      tenantScope: requestedTenant,
      universeScope: requestedUniverse,
      communities: null,
      ageGateCard: null,
      ack: null,
      policyDenials: null,
      waitingProviders: [...DEFAULT_COM_WAITING_PROVIDERS],
      readyProviders: [...DEFAULT_COM_READY_PROVIDERS],
      banners: [
        'WAITING_DATA -- requested tenant/universe does not match bound SIMULATION fixture.',
        'Cross-tenant community age-gate state is never leaked.',
      ],
      note: 'WAITING_DATA -- tenant/universe scope mismatch against bound fixture. communities=null; ageGateCard=null; ack=null; policyDenials=null.',
      liveLegalWaiver: false,
      liveAgeVerification: false,
      sexualCommunityFramingAllowed: false,
    };
  }

  const selected =
    fixture.communities.find((row) => row.communityId === fixture.selectedCommunityId) ??
    fixture.communities[0] ??
    null;

  if (forceDenied || !selected) {
    return {
      status: 'GATE_DENIED',
      role: 'consumer_business',
      readOnly: true,
      l4Autonomy: false,
      productionMutation: false,
      layerKind: 'SIMULATION',
      communityAgeGate: 'GATE_DENIED',
      tenantScope: fixture.tenantId,
      universeScope: fixture.universeId,
      communities: null,
      ageGateCard: null,
      ack: { ...fixture.ack, liveLegal: false, liveAgeVerification: false },
      policyDenials: fixture.policyDenials.map((d) => ({ ...d, liveIncident: false as const })),
      waitingProviders: [...fixture.waitingProviders],
      readyProviders: [...fixture.readyProviders],
      banners: [
        'GATE_DENIED -- community age-gate blocked this view/entry.',
        'ageGateCard stays null. No fabricated live moderation incidents.',
      ],
      note: 'GATE_DENIED -- community age-gate denied. ageGateCard=null; communities=null. liveLegalWaiver=false; liveAgeVerification=false; productionMutation=false; L4 false.',
      liveLegalWaiver: false,
      liveAgeVerification: false,
      sexualCommunityFramingAllowed: false,
    };
  }

  const gate = deriveGate(fixture.ack, false);
  const status = deriveStatus(fixture.ack, false, fixture.waitingProviders);
  const card = buildCard(selected, fixture.ack);

  return {
    status,
    role: 'consumer_business',
    readOnly: true,
    l4Autonomy: false,
    productionMutation: false,
    layerKind: 'SIMULATION',
    communityAgeGate: gate,
    tenantScope: fixture.tenantId,
    universeScope: fixture.universeId,
    communities: fixture.communities.map((row) => ({
      ...row,
      sexualFraming: false as const,
      ageGated: true as const,
      prototypeOnly: true as const,
    })),
    ageGateCard: card,
    ack: { ...fixture.ack, liveLegal: false, liveAgeVerification: false },
    policyDenials: fixture.policyDenials.map((d) => ({ ...d, liveIncident: false as const })),
    waitingProviders: [...fixture.waitingProviders],
    readyProviders: [...fixture.readyProviders],
    banners: [...fixture.banners],
    note:
      gate === 'AGE_GATE_REQUIRED'
        ? `AGE_GATE_REQUIRED -- bind selected ${selected.communityId}. 18+ acknowledgment required. Non-sexual cultural/professional framing. liveAgeVerification=false; liveLegalWaiver=false; L4 false.`
        : gate === 'RULES_ACK_REQUIRED'
          ? `RULES_ACK_REQUIRED -- waiver/contract + anti-predator + anti-bully acknowledgments required (SIMULATION flags, not live legal). Providers still WAITING_PROVIDER (${fixture.waitingProviders.join(', ')}).`
          : `FIXTURE_SIMULATION bound (${fixture.universeId}/${fixture.tenantId}). Local acks present; live age/legal remain WAITING_PROVIDER (${fixture.waitingProviders.join(', ')}). entryAllowed=${card.entryAllowed}. sexualFraming=false; productionMutation=false; L4 false.`,
    liveLegalWaiver: false,
    liveAgeVerification: false,
    sexualCommunityFramingAllowed: false,
  };
}
