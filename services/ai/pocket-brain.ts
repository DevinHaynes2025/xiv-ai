/**
 * US-PB-01 -- Pocket Brain product surface (LOCAL / SIMULATION).
 * Scoped encrypted cache presenter for Executive / Business pocket routes.
 * Never claims Global Brain sync, never auto-promotes private knowledge,
 * never fabricates cache/entry/sync metrics. WAITING_DATA when unbound.
 * WAITING_SYNC / WAITING_PROVIDER when fixture-bound without live proof.
 * L4 false; productionMutation false; cloudOnlyNeverCached true.
 */

export const POCKET_BRAIN_POLICY = {
  l4Autonomy: false as const,
  productionMutation: false as const,
  readOnly: true as const,
  layerKind: 'SIMULATION' as const,
  cloudOnlyNeverCached: true as const,
  autoPromoteToGlobalBrain: false as const,
  offlineAgentsBypassAuthority: false as const,
  label: 'POCKET_BRAIN_PRODUCT_SURFACE',
} as const;

export type PocketBrainGate =
  | 'WAITING_DATA'
  | 'WAITING_SYNC'
  | 'WAITING_PROVIDER'
  | 'FIXTURE_SIMULATION';

export type PocketCacheStatus = 'WAITING_SYNC' | 'FIXTURE_BOUND';

export type PocketBrainCacheCard = {
  universeId: string;
  tenantId: string;
  deviceScope: string;
  layerKind: 'SIMULATION';
  fingerprint: string;
  entryCount: number;
  bytesCached: number;
  cloudOnlyExcludedCount: number;
  lastSyncAt: null;
  cacheStatus: PocketCacheStatus;
  /** Explicit: fixture/simulation only -- not live pocket/xiv-data sync. */
  livePocketSync: false;
  liveGlobalBrain: false;
};

export type PocketKnowledgeItem = {
  id: string;
  title: string;
  classification: 'PERSONAL' | 'COMPANY' | 'CLOUD_ONLY';
  cached: boolean;
  autoPromoteBlocked: true;
  waitingReason: string | null;
};

export type PocketBrainView = {
  status: 'READY' | 'WAITING_DATA' | 'WAITING_SYNC' | 'WAITING_PROVIDER';
  role: 'executive';
  readOnly: true;
  l4Autonomy: false;
  productionMutation: false;
  layerKind: 'SIMULATION';
  pocketGate: PocketBrainGate;
  tenantScope: string | null;
  universeScope: string | null;
  deviceScope: string | null;
  cacheCard: PocketBrainCacheCard | null;
  knowledgeItems: PocketKnowledgeItem[] | null;
  waitingProviders: string[];
  readyProviders: string[];
  banners: string[];
  note: string;
  cloudOnlyNeverCached: true;
  autoPromoteToGlobalBrain: false;
};

export type PocketBrainFixtureBundle = {
  boundAt: string;
  universeId: string;
  tenantId: string;
  deviceScope: string;
  cacheCard: PocketBrainCacheCard;
  knowledgeItems: PocketKnowledgeItem[];
  waitingProviders: string[];
  readyProviders: string[];
  banners: string[];
};

export const DEFAULT_POCKET_WAITING_PROVIDERS = ['GROK', 'CHATGPT', 'GEMINI', 'XIV_DATA_SYNC'] as const;
export const DEFAULT_POCKET_READY_PROVIDERS = ['LOCAL_RULES', 'LOCAL_OLLAMA_STUB'] as const;

export const BUILTIN_POCKET_BRAIN_FIXTURE: Omit<PocketBrainFixtureBundle, 'boundAt'> = {
  universeId: 'demo-pocket',
  tenantId: 'xiv',
  deviceScope: 'asus-local',
  cacheCard: {
    universeId: 'demo-pocket',
    tenantId: 'xiv',
    deviceScope: 'asus-local',
    layerKind: 'SIMULATION',
    fingerprint: 'pb1:sim-a4f9c2e1',
    entryCount: 3,
    bytesCached: 4096,
    cloudOnlyExcludedCount: 1,
    lastSyncAt: null,
    cacheStatus: 'FIXTURE_BOUND',
    livePocketSync: false,
    liveGlobalBrain: false,
  },
  knowledgeItems: [
    {
      id: 'pk-local-brief',
      title: 'Local executive brief stub',
      classification: 'COMPANY',
      cached: true,
      autoPromoteBlocked: true,
      waitingReason: null,
    },
    {
      id: 'pk-personal-note',
      title: 'Personal scratch note (device-scoped)',
      classification: 'PERSONAL',
      cached: true,
      autoPromoteBlocked: true,
      waitingReason: null,
    },
    {
      id: 'pk-cloud-only',
      title: 'CLOUD_ONLY policy record',
      classification: 'CLOUD_ONLY',
      cached: false,
      autoPromoteBlocked: true,
      waitingReason: 'CLOUD_ONLY never enters Pocket Brain cache',
    },
  ],
  waitingProviders: [...DEFAULT_POCKET_WAITING_PROVIDERS],
  readyProviders: [...DEFAULT_POCKET_READY_PROVIDERS],
  banners: [
    'READ ONLY -- Pocket Brain product surface over SIMULATION cache only.',
    'productionMutation=false -- never write production pocket / Global Brain.',
    'CLOUD_ONLY never cached. Private pocket knowledge never auto-enters Global Brain.',
    'livePocketSync=false; liveGlobalBrain=false -- fixture metrics are labeled FIXTURE_SIMULATION.',
  ],
};

const globalStore = globalThis as typeof globalThis & {
  __xivPocketBrainFixture?: PocketBrainFixtureBundle | null;
};

export function resetPocketBrainSession() {
  globalStore.__xivPocketBrainFixture = null;
}

export function isPocketBrainFixtureBound(): boolean {
  return Boolean(globalStore.__xivPocketBrainFixture);
}

export function pocketBrainAllowsL4(): false {
  return false;
}

export function pocketBrainAllowsProductionMutation(): false {
  return false;
}

export function pocketBrainIsReadOnly(): true {
  return true;
}

export function pocketBrainAllowsAutoPromoteToGlobalBrain(): false {
  return false;
}

export function pocketBrainCloudOnlyNeverCached(): true {
  return true;
}

export function bindPocketBrainFixture(input?: {
  universeId?: string;
  tenantId?: string;
  deviceScope?: string;
}): PocketBrainFixtureBundle {
  const universeId = (input?.universeId ?? BUILTIN_POCKET_BRAIN_FIXTURE.universeId).trim();
  const tenantId = (input?.tenantId ?? BUILTIN_POCKET_BRAIN_FIXTURE.tenantId).trim();
  const deviceScope = (input?.deviceScope ?? BUILTIN_POCKET_BRAIN_FIXTURE.deviceScope).trim();
  if (!universeId) {
    throw new Error('universe_required -- pocket brain fixture bind requires universeId');
  }
  if (!tenantId) {
    throw new Error('tenant_required -- pocket brain fixture bind requires tenantId');
  }
  if (!deviceScope) {
    throw new Error('device_required -- pocket brain fixture bind requires deviceScope');
  }

  const cacheCard: PocketBrainCacheCard = {
    ...BUILTIN_POCKET_BRAIN_FIXTURE.cacheCard,
    universeId,
    tenantId,
    deviceScope,
    layerKind: 'SIMULATION',
    lastSyncAt: null,
    cacheStatus: 'FIXTURE_BOUND',
    livePocketSync: false,
    liveGlobalBrain: false,
  };

  const bundle: PocketBrainFixtureBundle = {
    boundAt: new Date().toISOString(),
    universeId,
    tenantId,
    deviceScope,
    cacheCard,
    knowledgeItems: BUILTIN_POCKET_BRAIN_FIXTURE.knowledgeItems.map((row) => ({ ...row })),
    waitingProviders: [...BUILTIN_POCKET_BRAIN_FIXTURE.waitingProviders],
    readyProviders: [...BUILTIN_POCKET_BRAIN_FIXTURE.readyProviders],
    banners: [...BUILTIN_POCKET_BRAIN_FIXTURE.banners],
  };

  globalStore.__xivPocketBrainFixture = bundle;
  return bundle;
}

export function clearPocketBrainFixture() {
  globalStore.__xivPocketBrainFixture = null;
}

export function listPocketBrainView(input?: {
  tenantId?: string;
  universeId?: string;
  deviceScope?: string;
}): PocketBrainView {
  const fixture = globalStore.__xivPocketBrainFixture ?? null;
  const requestedTenant = input?.tenantId?.trim() || null;
  const requestedUniverse = input?.universeId?.trim() || null;
  const requestedDevice = input?.deviceScope?.trim() || null;

  if (!fixture) {
    return {
      status: 'WAITING_DATA',
      role: 'executive',
      readOnly: true,
      l4Autonomy: false,
      productionMutation: false,
      layerKind: 'SIMULATION',
      pocketGate: 'WAITING_DATA',
      tenantScope: null,
      universeScope: null,
      deviceScope: null,
      cacheCard: null,
      knowledgeItems: null,
      waitingProviders: [...DEFAULT_POCKET_WAITING_PROVIDERS],
      readyProviders: [...DEFAULT_POCKET_READY_PROVIDERS],
      banners: [
        'WAITING_DATA -- Pocket Brain unbound on product lane.',
        'Bind an explicit SIMULATION fixture to surface labeled demo cache. Never fabricate live sync metrics.',
        'CLOUD_ONLY never cached. productionMutation=false; L4=false; readOnly=true; autoPromote=false.',
      ],
      note:
        'WAITING_DATA -- Pocket Brain unbound. cacheCard=null; knowledgeItems=null; lastSyncAt=null. Cloud/sync providers WAITING_PROVIDER. Nothing fabricated. L4 false; productionMutation false.',
      cloudOnlyNeverCached: true,
      autoPromoteToGlobalBrain: false,
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
      pocketGate: 'WAITING_DATA',
      tenantScope: requestedTenant,
      universeScope: requestedUniverse,
      deviceScope: requestedDevice,
      cacheCard: null,
      knowledgeItems: null,
      waitingProviders: [...DEFAULT_POCKET_WAITING_PROVIDERS],
      readyProviders: [...DEFAULT_POCKET_READY_PROVIDERS],
      banners: [
        'WAITING_DATA -- requested tenant/universe/device does not match bound SIMULATION fixture.',
        'Cross-tenant pocket cache is never leaked.',
      ],
      note:
        'WAITING_DATA -- tenant/universe/device scope mismatch against bound fixture. cacheCard=null; knowledgeItems=null. No fabricated pocket metrics.',
      cloudOnlyNeverCached: true,
      autoPromoteToGlobalBrain: false,
    };
  }

  const providersStillWaiting = fixture.waitingProviders.length > 0;
  const status: PocketBrainView['status'] = providersStillWaiting
    ? 'WAITING_PROVIDER'
    : 'WAITING_SYNC';

  return {
    status,
    role: 'executive',
    readOnly: true,
    l4Autonomy: false,
    productionMutation: false,
    layerKind: 'SIMULATION',
    pocketGate: 'FIXTURE_SIMULATION',
    tenantScope: fixture.tenantId,
    universeScope: fixture.universeId,
    deviceScope: fixture.deviceScope,
    cacheCard: {
      ...fixture.cacheCard,
      lastSyncAt: null,
      livePocketSync: false,
      liveGlobalBrain: false,
    },
    knowledgeItems: fixture.knowledgeItems.map((row) => ({ ...row, autoPromoteBlocked: true as const })),
    waitingProviders: [...fixture.waitingProviders],
    readyProviders: [...fixture.readyProviders],
    banners: [...fixture.banners],
    note: providersStillWaiting
      ? `FIXTURE_SIMULATION bound (${fixture.universeId}/${fixture.tenantId}/${fixture.deviceScope}). Providers remain WAITING_PROVIDER (${fixture.waitingProviders.join(', ')}). lastSyncAt=null; livePocketSync=false; liveGlobalBrain=false; productionMutation=false; L4 false. Not live pocket sync.`
      : `FIXTURE_SIMULATION bound (${fixture.universeId}/${fixture.tenantId}/${fixture.deviceScope}). WAITING_SYNC -- lastSyncAt=null until a real pocket sync proof exists. livePocketSync=false; liveGlobalBrain=false; productionMutation=false; L4 false.`,
    cloudOnlyNeverCached: true,
    autoPromoteToGlobalBrain: false,
  };
}