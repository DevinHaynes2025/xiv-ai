/**
 * US-BB-01 -- Blue Brain product surface (LOCAL / SIMULATION).
 * Executive / Business mobile READ surface over labeled neural-brain fixture.
 * Product-lane only -- does not import dimensional/12d fabric worktrees.
 * Policy gate stays in front of every read; mayEnterGlobalBrain false;
 * liveCloudSyncClaimed false; never fabricate measured ADC scale.
 * WAITING_DATA when unbound. WAITING_PROVIDER when fixture-bound without live proof.
 * L4 false; productionMutation false; readOnly true.
 */

export const BLUE_BRAIN_POLICY = {
  l4Autonomy: false as const,
  productionMutation: false as const,
  readOnly: true as const,
  layerKind: 'SIMULATION' as const,
  liveCloudSyncClaimed: false as const,
  mayEnterGlobalBrain: false as const,
  promoteToGlobalBrainAllowed: false as const,
  policyGateInFront: true as const,
  policyGateBypassAllowed: false as const,
  pocketIngestStubsOnly: true as const,
  acceleratorVerifiedAllowed: false as const,
  aspirationalScaleAsMeasuredAllowed: false as const,
  offlineAgentsBypassAuthority: false as const,
  label: 'BLUE_BRAIN_PRODUCT_SURFACE',
} as const;

export type BlueBrainGate =
  | 'WAITING_DATA'
  | 'WAITING_PROVIDER'
  | 'WAITING_SYNC'
  | 'FIXTURE_SIMULATION'
  | 'GATE_DENIED';

export type BlueBrainPolicyGateState = 'ALLOWED' | 'DENIED' | 'WAITING_DATA';

export type BlueBrainScaleKind = 'aspirational' | 'measured';

export type BlueBrainSurfaceCard = {
  universeId: string;
  tenantId: string;
  deviceScope: string;
  layerKind: 'SIMULATION';
  fingerprint: string;
  stubCount: number;
  hitCount: number;
  missCount: number;
  lastReadAt: null;
  surfaceStatus: 'WAITING_SYNC' | 'FIXTURE_BOUND';
  /** Explicit: fixture/simulation only -- not live Blue Brain / cloud sync. */
  liveCloudSyncClaimed: false;
  mayEnterGlobalBrain: false;
  policyGateInFront: true;
};

export type BlueBrainPocketIngestStub = {
  stubId: string;
  title: string;
  checksum: string;
  classification: 'PERSONAL' | 'COMPANY' | 'CLOUD_ONLY';
  cached: boolean;
  mayEnterGlobalBrain: false;
  waitingReason: string | null;
};

export type BlueBrainScaleClaim = {
  id: string;
  kind: BlueBrainScaleKind;
  label: string;
  value: number | null;
  unit: string;
  /** measured claims may only mirror fixture stub counts; aspirational never promoted. */
  asMeasured: boolean;
};

export type BlueBrainView = {
  status: 'READY' | 'WAITING_DATA' | 'WAITING_SYNC' | 'WAITING_PROVIDER' | 'GATE_DENIED';
  role: 'executive';
  readOnly: true;
  l4Autonomy: false;
  productionMutation: false;
  layerKind: 'SIMULATION';
  blueBrainGate: BlueBrainGate;
  policyGate: BlueBrainPolicyGateState;
  tenantScope: string | null;
  universeScope: string | null;
  deviceScope: string | null;
  surfaceCard: BlueBrainSurfaceCard | null;
  pocketIngestStubs: BlueBrainPocketIngestStub[] | null;
  scaleClaims: BlueBrainScaleClaim[] | null;
  waitingProviders: string[];
  readyProviders: string[];
  banners: string[];
  note: string;
  liveCloudSyncClaimed: false;
  mayEnterGlobalBrain: false;
  promoteToGlobalBrainAllowed: false;
  policyGateInFront: true;
  pocketIngestStubsOnly: true;
};

export type BlueBrainFixtureBundle = {
  boundAt: string;
  universeId: string;
  tenantId: string;
  deviceScope: string;
  policyGate: BlueBrainPolicyGateState;
  surfaceCard: BlueBrainSurfaceCard;
  pocketIngestStubs: BlueBrainPocketIngestStub[];
  scaleClaims: BlueBrainScaleClaim[];
  waitingProviders: string[];
  readyProviders: string[];
  banners: string[];
};

export const DEFAULT_BLUE_WAITING_PROVIDERS = ['GROK', 'CHATGPT', 'GEMINI', 'XIV_DATA_SYNC', 'GLOBAL_BRAIN'] as const;
export const DEFAULT_BLUE_READY_PROVIDERS = ['LOCAL_RULES', 'LOCAL_OLLAMA_STUB', 'POCKET_INGEST_STUB'] as const;

export const BUILTIN_BLUE_BRAIN_FIXTURE: Omit<BlueBrainFixtureBundle, 'boundAt' | 'policyGate'> = {
  universeId: 'demo-blue-brain',
  tenantId: 'xiv',
  deviceScope: 'asus-local',
  surfaceCard: {
    universeId: 'demo-blue-brain',
    tenantId: 'xiv',
    deviceScope: 'asus-local',
    layerKind: 'SIMULATION',
    fingerprint: 'bb1:sim-c7e2a91b',
    stubCount: 3,
    hitCount: 0,
    missCount: 0,
    lastReadAt: null,
    surfaceStatus: 'FIXTURE_BOUND',
    liveCloudSyncClaimed: false,
    mayEnterGlobalBrain: false,
    policyGateInFront: true,
  },
  pocketIngestStubs: [
    {
      stubId: 'bb-stub-local-brief',
      title: 'Local executive brief pocket stub',
      checksum: 'sha256:bb-stub-local-brief-sim',
      classification: 'COMPANY',
      cached: true,
      mayEnterGlobalBrain: false,
      waitingReason: null,
    },
    {
      stubId: 'bb-stub-personal',
      title: 'Personal device-scoped pocket stub',
      checksum: 'sha256:bb-stub-personal-sim',
      classification: 'PERSONAL',
      cached: true,
      mayEnterGlobalBrain: false,
      waitingReason: null,
    },
    {
      stubId: 'bb-stub-cloud-only',
      title: 'CLOUD_ONLY pocket stub (never cached into Blue Brain)',
      checksum: 'sha256:bb-stub-cloud-only-sim',
      classification: 'CLOUD_ONLY',
      cached: false,
      mayEnterGlobalBrain: false,
      waitingReason: 'CLOUD_ONLY never enters Blue Brain local surface cache',
    },
  ],
  scaleClaims: [
    {
      id: 'scale-measured-stubs',
      kind: 'measured',
      label: 'Fixture pocket ingest stub count',
      value: 3,
      unit: 'stubs',
      asMeasured: true,
    },
    {
      id: 'scale-aspirational-adc',
      kind: 'aspirational',
      label: 'ADC neuron-scale aspirational target',
      value: null,
      unit: 'neurons',
      asMeasured: false,
    },
  ],
  waitingProviders: [...DEFAULT_BLUE_WAITING_PROVIDERS],
  readyProviders: [...DEFAULT_BLUE_READY_PROVIDERS],
  banners: [
    'READ ONLY -- Blue Brain product surface over SIMULATION fixture only.',
    'productionMutation=false -- never write production Blue Brain / Global Brain.',
    'Policy gate stays in front of every read. Bypass forbidden.',
    'mayEnterGlobalBrain=false; liveCloudSyncClaimed=false; pocket ingest stubs only.',
    'Aspirational ADC scale is never labeled as measured.',
  ],
};

const globalStore = globalThis as typeof globalThis & {
  __xivBlueBrainFixture?: BlueBrainFixtureBundle | null;
};

export function resetBlueBrainSession() {
  globalStore.__xivBlueBrainFixture = null;
}

export function isBlueBrainFixtureBound(): boolean {
  return Boolean(globalStore.__xivBlueBrainFixture);
}

export function blueBrainAllowsL4(): false {
  return false;
}

export function blueBrainAllowsProductionMutation(): false {
  return false;
}

export function blueBrainIsReadOnly(): true {
  return true;
}

export function blueBrainAllowsLiveCloudSyncClaim(): false {
  return false;
}

export function blueBrainAllowsEnterGlobalBrain(): false {
  return false;
}

export function blueBrainAllowsPromoteToGlobalBrain(): false {
  return false;
}

export function blueBrainPolicyGateInFront(): true {
  return true;
}

export function blueBrainAllowsPolicyGateBypass(): false {
  return false;
}

export function blueBrainPocketIngestStubsOnly(): true {
  return true;
}

export function blueBrainAllowsAspirationalAsMeasured(): false {
  return false;
}

export function allowBlueBrainPolicyGate(): BlueBrainPolicyGateState {
  return 'ALLOWED';
}

export function denyBlueBrainPolicyGate(_reason?: string): BlueBrainPolicyGateState {
  return 'DENIED';
}

export function bindBlueBrainFixture(input?: {
  universeId?: string;
  tenantId?: string;
  deviceScope?: string;
  policyGate?: BlueBrainPolicyGateState;
}): BlueBrainFixtureBundle {
  const universeId = (input?.universeId ?? BUILTIN_BLUE_BRAIN_FIXTURE.universeId).trim();
  const tenantId = (input?.tenantId ?? BUILTIN_BLUE_BRAIN_FIXTURE.tenantId).trim();
  const deviceScope = (input?.deviceScope ?? BUILTIN_BLUE_BRAIN_FIXTURE.deviceScope).trim();
  if (!universeId) {
    throw new Error('universe_required -- blue brain fixture bind requires universeId');
  }
  if (!tenantId) {
    throw new Error('tenant_required -- blue brain fixture bind requires tenantId');
  }
  if (!deviceScope) {
    throw new Error('device_required -- blue brain fixture bind requires deviceScope');
  }

  const policyGate: BlueBrainPolicyGateState = input?.policyGate ?? 'ALLOWED';

  const surfaceCard: BlueBrainSurfaceCard = {
    ...BUILTIN_BLUE_BRAIN_FIXTURE.surfaceCard,
    universeId,
    tenantId,
    deviceScope,
    layerKind: 'SIMULATION',
    lastReadAt: null,
    surfaceStatus: 'FIXTURE_BOUND',
    liveCloudSyncClaimed: false,
    mayEnterGlobalBrain: false,
    policyGateInFront: true,
  };

  const bundle: BlueBrainFixtureBundle = {
    boundAt: new Date().toISOString(),
    universeId,
    tenantId,
    deviceScope,
    policyGate,
    surfaceCard,
    pocketIngestStubs: BUILTIN_BLUE_BRAIN_FIXTURE.pocketIngestStubs.map((row) => ({
      ...row,
      mayEnterGlobalBrain: false as const,
    })),
    scaleClaims: BUILTIN_BLUE_BRAIN_FIXTURE.scaleClaims.map((row) => ({
      ...row,
      asMeasured: row.kind === 'measured',
    })),
    waitingProviders: [...BUILTIN_BLUE_BRAIN_FIXTURE.waitingProviders],
    readyProviders: [...BUILTIN_BLUE_BRAIN_FIXTURE.readyProviders],
    banners: [...BUILTIN_BLUE_BRAIN_FIXTURE.banners],
  };

  globalStore.__xivBlueBrainFixture = bundle;
  return bundle;
}

export function clearBlueBrainFixture() {
  globalStore.__xivBlueBrainFixture = null;
}

export function listBlueBrainView(input?: {
  tenantId?: string;
  universeId?: string;
  deviceScope?: string;
  policyGate?: BlueBrainPolicyGateState;
}): BlueBrainView {
  const fixture = globalStore.__xivBlueBrainFixture ?? null;
  const requestedTenant = input?.tenantId?.trim() || null;
  const requestedUniverse = input?.universeId?.trim() || null;
  const requestedDevice = input?.deviceScope?.trim() || null;
  const requestedGate = input?.policyGate;

  if (!fixture) {
    return {
      status: 'WAITING_DATA',
      role: 'executive',
      readOnly: true,
      l4Autonomy: false,
      productionMutation: false,
      layerKind: 'SIMULATION',
      blueBrainGate: 'WAITING_DATA',
      policyGate: 'WAITING_DATA',
      tenantScope: null,
      universeScope: null,
      deviceScope: null,
      surfaceCard: null,
      pocketIngestStubs: null,
      scaleClaims: null,
      waitingProviders: [...DEFAULT_BLUE_WAITING_PROVIDERS],
      readyProviders: [...DEFAULT_BLUE_READY_PROVIDERS],
      banners: [
        'WAITING_DATA -- Blue Brain unbound on product lane.',
        'Bind an explicit SIMULATION fixture to surface labeled pocket ingest stubs. Never fabricate live neural/ADC metrics.',
        'Policy gate in front. mayEnterGlobalBrain=false; liveCloudSyncClaimed=false; productionMutation=false; L4=false.',
      ],
      note:
        'WAITING_DATA -- Blue Brain unbound. surfaceCard=null; pocketIngestStubs=null; scaleClaims=null; lastReadAt=null. Cloud/sync/Global Brain providers WAITING_PROVIDER. Nothing fabricated. L4 false; productionMutation false.',
      liveCloudSyncClaimed: false,
      mayEnterGlobalBrain: false,
      promoteToGlobalBrainAllowed: false,
      policyGateInFront: true,
      pocketIngestStubsOnly: true,
    };
  }

  if (
    (requestedTenant && requestedTenant !== fixture.tenantId) ||
    (requestedUniverse && requestedUniverse !== fixture.universeId) ||
    (requestedDevice && requestedDevice !== fixture.deviceScope)
  ) {
    return {
      status: 'WAITING_DATA',
      role: 'executive',
      readOnly: true,
      l4Autonomy: false,
      productionMutation: false,
      layerKind: 'SIMULATION',
      blueBrainGate: 'WAITING_DATA',
      policyGate: 'WAITING_DATA',
      tenantScope: requestedTenant,
      universeScope: requestedUniverse,
      deviceScope: requestedDevice,
      surfaceCard: null,
      pocketIngestStubs: null,
      scaleClaims: null,
      waitingProviders: [...DEFAULT_BLUE_WAITING_PROVIDERS],
      readyProviders: [...DEFAULT_BLUE_READY_PROVIDERS],
      banners: [
        'WAITING_DATA -- requested tenant/universe/device does not match bound SIMULATION fixture.',
        'Cross-tenant Blue Brain surface is never leaked.',
      ],
      note:
        'WAITING_DATA -- tenant/universe/device scope mismatch against bound fixture. surfaceCard=null; pocketIngestStubs=null; scaleClaims=null. No fabricated Blue Brain metrics.',
      liveCloudSyncClaimed: false,
      mayEnterGlobalBrain: false,
      promoteToGlobalBrainAllowed: false,
      policyGateInFront: true,
      pocketIngestStubsOnly: true,
    };
  }

  const effectiveGate: BlueBrainPolicyGateState =
    requestedGate === 'DENIED' || fixture.policyGate === 'DENIED' ? 'DENIED' : fixture.policyGate;

  if (effectiveGate === 'DENIED') {
    return {
      status: 'GATE_DENIED',
      role: 'executive',
      readOnly: true,
      l4Autonomy: false,
      productionMutation: false,
      layerKind: 'SIMULATION',
      blueBrainGate: 'GATE_DENIED',
      policyGate: 'DENIED',
      tenantScope: fixture.tenantId,
      universeScope: fixture.universeId,
      deviceScope: fixture.deviceScope,
      surfaceCard: null,
      pocketIngestStubs: null,
      scaleClaims: null,
      waitingProviders: [...DEFAULT_BLUE_WAITING_PROVIDERS],
      readyProviders: [...DEFAULT_BLUE_READY_PROVIDERS],
      banners: [
        'GATE_DENIED -- Blue Brain policy gate blocked this read.',
        'Bypass forbidden. surfaceCard stays null. No fabricated neural metrics.',
      ],
      note:
        'GATE_DENIED -- policy gate in front denied the read. surfaceCard=null; pocketIngestStubs=null; scaleClaims=null. liveCloudSyncClaimed=false; mayEnterGlobalBrain=false; productionMutation=false; L4 false.',
      liveCloudSyncClaimed: false,
      mayEnterGlobalBrain: false,
      promoteToGlobalBrainAllowed: false,
      policyGateInFront: true,
      pocketIngestStubsOnly: true,
    };
  }

  const providersStillWaiting = fixture.waitingProviders.length > 0;
  const status: BlueBrainView['status'] = providersStillWaiting ? 'WAITING_PROVIDER' : 'WAITING_SYNC';

  return {
    status,
    role: 'executive',
    readOnly: true,
    l4Autonomy: false,
    productionMutation: false,
    layerKind: 'SIMULATION',
    blueBrainGate: 'FIXTURE_SIMULATION',
    policyGate: effectiveGate,
    tenantScope: fixture.tenantId,
    universeScope: fixture.universeId,
    deviceScope: fixture.deviceScope,
    surfaceCard: {
      ...fixture.surfaceCard,
      lastReadAt: null,
      liveCloudSyncClaimed: false,
      mayEnterGlobalBrain: false,
      policyGateInFront: true,
    },
    pocketIngestStubs: fixture.pocketIngestStubs.map((row) => ({
      ...row,
      mayEnterGlobalBrain: false as const,
    })),
    scaleClaims: fixture.scaleClaims.map((row) => ({
      ...row,
      asMeasured: row.kind === 'measured',
      value: row.kind === 'aspirational' ? null : row.value,
    })),
    waitingProviders: [...fixture.waitingProviders],
    readyProviders: [...fixture.readyProviders],
    banners: [...fixture.banners],
    note: providersStillWaiting
      ? `FIXTURE_SIMULATION bound (${fixture.universeId}/${fixture.tenantId}/${fixture.deviceScope}). Providers remain WAITING_PROVIDER (${fixture.waitingProviders.join(', ')}). lastReadAt=null; liveCloudSyncClaimed=false; mayEnterGlobalBrain=false; productionMutation=false; L4 false. Not live Blue Brain sync.`
      : `FIXTURE_SIMULATION bound (${fixture.universeId}/${fixture.tenantId}/${fixture.deviceScope}). WAITING_SYNC -- lastReadAt=null until a real Blue Brain read proof exists. liveCloudSyncClaimed=false; mayEnterGlobalBrain=false; productionMutation=false; L4 false.`,
    liveCloudSyncClaimed: false,
    mayEnterGlobalBrain: false,
    promoteToGlobalBrainAllowed: false,
    policyGateInFront: true,
    pocketIngestStubsOnly: true,
  };
}