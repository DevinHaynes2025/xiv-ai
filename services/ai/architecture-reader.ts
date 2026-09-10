/**
 * US-ARCH-01 — Architecture Reader + Council queue (product wire).
 * 12D-08 FOLLOW_UP: read-only Command Center / mobile consumer on product lane.
 * Dimensional fabric modules live on 12d worktrees — this is a minimal isomorphic
 * presenter that consumes fixture/simulation JSON only. Never fabricates live fabric
 * metrics. WAITING_DATA / WAITING_PROVIDER when unbound. L4 false; productionAutoApply false.
 */

export const ARCHITECTURE_READER_POLICY = {
  l4Autonomy: false as const,
  productionAutoApply: false as const,
  readOnly: true as const,
  layerKind: 'SIMULATION' as const,
  fabricMode: 'fixture_or_waiting' as const,
  label: 'ARCHITECTURE_READER_COMMAND_CENTER_CONSUMER',
} as const;

export type ArchitectureFabricGate =
  | 'WAITING_DATA'
  | 'WAITING_PROVIDER'
  | 'FIXTURE_SIMULATION';

export type ArchitectureManifestStatus = 'WAITING_SYNC' | 'FIXTURE_BOUND';

export type ArchitectureCard = {
  universeId: string;
  tenantId: string;
  layerKind: 'SIMULATION';
  fingerprint: string;
  companyCount: number;
  supplyLinkCount: number;
  agentPopulationTotal: number;
  worldEntityCount: number;
  branchCount: number;
  cityLadder: string;
  routeTarget: null;
  manifestStatus: ArchitectureManifestStatus;
  /** Explicit: fixture/simulation only — not live dimensional fabric. */
  liveFabric: false;
};

export type CouncilStoryRank = {
  priorityRank: number;
  storyId: string;
  title: string;
  domain: string;
  composite: number | null;
  worthExecuting: boolean;
  waitingProviders: string[];
  readyProviders: string[];
};

export type ArchitectureReaderView = {
  status: 'READY' | 'WAITING_DATA' | 'WAITING_PROVIDER';
  role: 'executive';
  readOnly: true;
  l4Autonomy: false;
  productionAutoApply: false;
  layerKind: 'SIMULATION';
  fabricGate: ArchitectureFabricGate;
  tenantScope: string | null;
  universeScope: string | null;
  architectureCard: ArchitectureCard | null;
  councilTop: CouncilStoryRank[] | null;
  waitingProviders: string[];
  readyProviders: string[];
  banners: string[];
  note: string;
};

export type ArchitectureReaderFixtureBundle = {
  boundAt: string;
  universeId: string;
  tenantId: string;
  architectureCard: ArchitectureCard;
  councilTop: CouncilStoryRank[];
  waitingProviders: string[];
  readyProviders: string[];
  banners: string[];
};

export const DEFAULT_WAITING_PROVIDERS = ['GROK', 'CHATGPT', 'GEMINI'] as const;
export const DEFAULT_READY_PROVIDERS = ['LOCAL_RULES'] as const;

export const BUILTIN_ARCHITECTURE_FIXTURE: Omit<
  ArchitectureReaderFixtureBundle,
  'boundAt'
> = {
  universeId: 'demo-cc',
  tenantId: 'xiv',
  architectureCard: {
    universeId: 'demo-cc',
    tenantId: 'xiv',
    layerKind: 'SIMULATION',
    fingerprint: 'dg1:91897df34528e1e5',
    companyCount: 2,
    supplyLinkCount: 1,
    agentPopulationTotal: 18,
    worldEntityCount: 1,
    branchCount: 0,
    cityLadder:
      'device -> local_shard -> company_brain -> regional_brain -> global_brain',
    routeTarget: null,
    manifestStatus: 'FIXTURE_BOUND',
    liveFabric: false,
  },
  councilTop: [
    {
      priorityRank: 1,
      storyId: 'XIV-US-00000014',
      title: 'SECURITY capability increment 14',
      domain: 'SECURITY',
      composite: 0.723,
      worthExecuting: true,
      waitingProviders: [...DEFAULT_WAITING_PROVIDERS],
      readyProviders: [...DEFAULT_READY_PROVIDERS],
    },
    {
      priorityRank: 2,
      storyId: 'XIV-US-00000011',
      title: 'DATABASE capability increment 11',
      domain: 'DATABASE',
      composite: 0.658,
      worthExecuting: true,
      waitingProviders: [...DEFAULT_WAITING_PROVIDERS],
      readyProviders: [...DEFAULT_READY_PROVIDERS],
    },
    {
      priorityRank: 3,
      storyId: 'XIV-US-00000012',
      title: 'AI_RUNTIME capability increment 12',
      domain: 'AI_RUNTIME',
      composite: 0.6505,
      worthExecuting: true,
      waitingProviders: [...DEFAULT_WAITING_PROVIDERS],
      readyProviders: [...DEFAULT_READY_PROVIDERS],
    },
    {
      priorityRank: 4,
      storyId: 'XIV-US-00000010',
      title: 'PLATFORM capability increment 10',
      domain: 'PLATFORM',
      composite: 0.648,
      worthExecuting: true,
      waitingProviders: [...DEFAULT_WAITING_PROVIDERS],
      readyProviders: [...DEFAULT_READY_PROVIDERS],
    },
    {
      priorityRank: 5,
      storyId: 'XIV-US-00000013',
      title: 'MOBILE capability increment 13',
      domain: 'MOBILE',
      composite: 0.6455,
      worthExecuting: true,
      waitingProviders: [...DEFAULT_WAITING_PROVIDERS],
      readyProviders: [...DEFAULT_READY_PROVIDERS],
    },
    {
      priorityRank: 6,
      storyId: 'XIV-US-00000015',
      title: 'CLOUD capability increment 15',
      domain: 'CLOUD',
      composite: 0.638,
      worthExecuting: true,
      waitingProviders: [...DEFAULT_WAITING_PROVIDERS],
      readyProviders: [...DEFAULT_READY_PROVIDERS],
    },
    {
      priorityRank: 7,
      storyId: 'XIV-US-00000016',
      title: 'SIMULATION capability increment 16',
      domain: 'SIMULATION',
      composite: 0.6055,
      worthExecuting: true,
      waitingProviders: [...DEFAULT_WAITING_PROVIDERS],
      readyProviders: [...DEFAULT_READY_PROVIDERS],
    },
    {
      priorityRank: 8,
      storyId: 'XIV-US-00000009',
      title: 'XR capability increment 9',
      domain: 'XR',
      composite: 0.498,
      worthExecuting: true,
      waitingProviders: [...DEFAULT_WAITING_PROVIDERS],
      readyProviders: [...DEFAULT_READY_PROVIDERS],
    },
  ],
  waitingProviders: [...DEFAULT_WAITING_PROVIDERS],
  readyProviders: [...DEFAULT_READY_PROVIDERS],
  banners: [
    'READ ONLY — Command Center consumer over SIMULATION layers only.',
    'productionAutoApply=false — never auto-apply production.',
    'Dimensional fabric unbound on product lane — fixture metrics are labeled FIXTURE_SIMULATION.',
  ],
};

const globalStore = globalThis as typeof globalThis & {
  __xivArchitectureReaderFixture?: ArchitectureReaderFixtureBundle | null;
};

export function resetArchitectureReaderSession() {
  globalStore.__xivArchitectureReaderFixture = null;
}

export function isArchitectureReaderFabricBound(): boolean {
  return Boolean(globalStore.__xivArchitectureReaderFixture);
}

export function architectureReaderAllowsL4(): false {
  return false;
}

export function architectureReaderAllowsProductionAutoApply(): false {
  return false;
}

export function architectureReaderIsReadOnly(): true {
  return true;
}

export function bindArchitectureReaderFixture(input?: {
  universeId?: string;
  tenantId?: string;
}): ArchitectureReaderFixtureBundle {
  const universeId = (input?.universeId ?? BUILTIN_ARCHITECTURE_FIXTURE.universeId).trim();
  const tenantId = (input?.tenantId ?? BUILTIN_ARCHITECTURE_FIXTURE.tenantId).trim();
  if (!universeId) {
    throw new Error('universe_required — architecture reader fixture bind requires universeId');
  }
  if (!tenantId) {
    throw new Error('tenant_required — architecture reader fixture bind requires tenantId');
  }

  const card: ArchitectureCard = {
    ...BUILTIN_ARCHITECTURE_FIXTURE.architectureCard,
    universeId,
    tenantId,
    layerKind: 'SIMULATION',
    liveFabric: false,
    routeTarget: null,
    manifestStatus: 'FIXTURE_BOUND',
  };

  const bundle: ArchitectureReaderFixtureBundle = {
    boundAt: new Date().toISOString(),
    universeId,
    tenantId,
    architectureCard: card,
    councilTop: BUILTIN_ARCHITECTURE_FIXTURE.councilTop.map((row) => ({
      ...row,
      waitingProviders: [...row.waitingProviders],
      readyProviders: [...row.readyProviders],
      composite: row.composite,
    })),
    waitingProviders: [...BUILTIN_ARCHITECTURE_FIXTURE.waitingProviders],
    readyProviders: [...BUILTIN_ARCHITECTURE_FIXTURE.readyProviders],
    banners: [...BUILTIN_ARCHITECTURE_FIXTURE.banners],
  };

  globalStore.__xivArchitectureReaderFixture = bundle;
  return bundle;
}

export function clearArchitectureReaderFixture() {
  globalStore.__xivArchitectureReaderFixture = null;
}

export function listArchitectureReaderView(input?: {
  tenantId?: string;
  universeId?: string;
}): ArchitectureReaderView {
  const fixture = globalStore.__xivArchitectureReaderFixture ?? null;
  const requestedTenant = input?.tenantId?.trim() || null;
  const requestedUniverse = input?.universeId?.trim() || null;

  if (!fixture) {
    return {
      status: 'WAITING_DATA',
      role: 'executive',
      readOnly: true,
      l4Autonomy: false,
      productionAutoApply: false,
      layerKind: 'SIMULATION',
      fabricGate: 'WAITING_DATA',
      tenantScope: null,
      universeScope: null,
      architectureCard: null,
      councilTop: null,
      waitingProviders: [...DEFAULT_WAITING_PROVIDERS],
      readyProviders: [...DEFAULT_READY_PROVIDERS],
      banners: [
        'WAITING_DATA — dimensional fabric unbound on product lane.',
        'Bind an explicit SIMULATION fixture to surface labeled demo topology. Never fabricate live fabric metrics.',
        'productionAutoApply=false; L4=false; readOnly=true.',
      ],
      note:
        'WAITING_DATA — Architecture Reader fabric unbound. architectureCard=null; councilTop=null. Cloud providers WAITING_PROVIDER. Nothing fabricated. L4 false; productionAutoApply false.',
    };
  }

  if (
    (requestedTenant && requestedTenant !== fixture.tenantId) ||
    (requestedUniverse && requestedUniverse !== fixture.universeId)
  ) {
    return {
      status: 'WAITING_DATA',
      role: 'executive',
      readOnly: true,
      l4Autonomy: false,
      productionAutoApply: false,
      layerKind: 'SIMULATION',
      fabricGate: 'WAITING_DATA',
      tenantScope: requestedTenant,
      universeScope: requestedUniverse,
      architectureCard: null,
      councilTop: null,
      waitingProviders: [...DEFAULT_WAITING_PROVIDERS],
      readyProviders: [...DEFAULT_READY_PROVIDERS],
      banners: [
        'WAITING_DATA — requested tenant/universe does not match bound SIMULATION fixture.',
        'Cross-tenant fabric metrics are never leaked.',
      ],
      note:
        'WAITING_DATA — tenant/universe scope mismatch against bound fixture. architectureCard=null; councilTop=null. No fabricated fabric metrics.',
    };
  }

  const providersStillWaiting = fixture.waitingProviders.length > 0;
  const status: ArchitectureReaderView['status'] = providersStillWaiting
    ? 'WAITING_PROVIDER'
    : 'READY';

  return {
    status,
    role: 'executive',
    readOnly: true,
    l4Autonomy: false,
    productionAutoApply: false,
    layerKind: 'SIMULATION',
    fabricGate: 'FIXTURE_SIMULATION',
    tenantScope: fixture.tenantId,
    universeScope: fixture.universeId,
    architectureCard: { ...fixture.architectureCard, liveFabric: false },
    councilTop: fixture.councilTop.map((row) => ({
      ...row,
      waitingProviders: [...row.waitingProviders],
      readyProviders: [...row.readyProviders],
    })),
    waitingProviders: [...fixture.waitingProviders],
    readyProviders: [...fixture.readyProviders],
    banners: [...fixture.banners],
    note: providersStillWaiting
      ? `FIXTURE_SIMULATION bound (${fixture.universeId}/${fixture.tenantId}). Cloud providers remain WAITING_PROVIDER (${fixture.waitingProviders.join(', ')}). liveFabric=false; productionAutoApply=false; L4 false. Not live dimensional fabric.`
      : `FIXTURE_SIMULATION bound (${fixture.universeId}/${fixture.tenantId}). liveFabric=false; productionAutoApply=false; L4 false. Not live dimensional fabric.`,
  };
}