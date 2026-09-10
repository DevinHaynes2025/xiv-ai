/**
 * 12D-15 -- Blue Brain branded LOCAL neural brain READ surface.
 * Pocket Brain ingest stubs + aspirational vs measured ADC scale labels.
 * Policy Gate in front. SIMULATION honesty. L4/productionAuto* false.
 * OFFLINE_PREFER_LOCAL only -- never CLOUD_SANDBOX / PRODUCTION.
 */
import { isomorphicContentHash } from './datagene';
import {
  assertEthicsSafeCopy,
  BUSINESS_BAR_METRICS,
  HIGH_AUTONOMY_TARGETS,
  UNIVERSES_ARE_SIMULATION_LAYERS_ONLY,
  VALUATION_THEATER_ALLOWED,
} from './universe-ethics';
import { BUILDER_GUARDRAILS } from '../builder/policy';
import { OFFLINE_PREFER_LOCAL } from './ollama-local-writer';
import { ATOMIC_DATA_CELL_GUARDRAILS } from './atomic-data-cell';
import { POCKET_BRAIN_INGEST_GUARDRAILS } from './pocket-brain-ingest';
import {
  VIRTUAL_MINI_CITY_GUARDRAILS,
  type ScaleClaim,
  type ScaleClaimKind,
  assertScaleClaimsHonest,
} from './virtual-mini-city';
import type { SiliconCapabilityClaim } from './database-city';

export const BLUE_BRAIN_LOCAL_SCHEMA_VERSION = '12d15.1' as const;

/** Locked: LOCAL only -- never CLOUD_SANDBOX / PRODUCTION for this surface. */
export const BLUE_BRAIN_LOCAL_SAFE_ENVIRONMENTS = ['LOCAL'] as const;

/** Brand token -- Blue Brain is the LOCAL neural brain READ surface name. */
export const BLUE_BRAIN_BRAND = 'Blue Brain' as const;

export type BlueBrainSurfaceMode = 'SIMULATION_READ' | 'POCKET_INGEST_STUB';

export type PocketBrainIngestStub = {
  stubId: string;
  relativePath: string;
  contentChecksum: string;
  classification: 'OFFLINE_CACHEABLE' | 'TENANT_PRIVATE';
  mayEnterGlobalBrain: false;
  cached: true;
  productionMutation: false;
  simulationOnly: true;
};

export type BlueBrainPolicyGateDecision = {
  allowed: boolean;
  reason: string;
  gateId: 'xiv-policy-gate';
  bypassAttempted: false;
};

export type BlueBrainReadReceipt = {
  outcome: 'HIT' | 'MISS' | 'GATE_DENIED' | 'WAITING_SYNC';
  surfaceId: string;
  stubId: string | null;
  mode: BlueBrainSurfaceMode;
  simulationOnly: true;
  liveCloudSyncClaimed: false;
  gate: BlueBrainPolicyGateDecision;
  notes: string;
};

export type BlueBrainLocalSurface = {
  schemaVersion: typeof BLUE_BRAIN_LOCAL_SCHEMA_VERSION;
  brand: typeof BLUE_BRAIN_BRAND;
  surfaceId: string;
  simulationOnly: true;
  preferredExecution: 'LOCAL';
  OFFLINE_PREFER_LOCAL: true;
  mode: BlueBrainSurfaceMode;
  pocketIngestStubs: readonly PocketBrainIngestStub[];
  scaleClaims: readonly ScaleClaim[];
  accelerators: readonly SiliconCapabilityClaim[];
  liveCloudSyncClaimed: false;
  productionAutoApply: false;
  L4_PRODUCTION_ENABLED: false;
  ethicsNotice: string;
};

export const BLUE_BRAIN_LOCAL_GUARDRAILS = {
  readOnly: true as const,
  simulationOnly: true as const,
  OFFLINE_PREFER_LOCAL: true as const,
  preferredExecution: 'LOCAL' as const,
  cloudSandboxAllowed: false as const,
  productionAllowed: false as const,
  productionAutoApply: false as const,
  productionAutoMerge: false as const,
  productionAutoDeploy: false as const,
  autonomousProductionDDL: false as const,
  autonomousProductionDML: false as const,
  destructiveDbAutoApply: false as const,
  L4_PRODUCTION_ENABLED: false as const,
  liveCloudSyncClaimed: false as const,
  liveCloudSyncFabricationAllowed: false as const,
  policyGateBypassAllowed: false as const,
  /** Gate must sit in front of every Blue Brain read. */
  policyGateInFront: true as const,
  noDdl: true as const,
  noDml: true as const,
  noDeploy: true as const,
  mayEnterGlobalBrain: false as const,
  promoteToGlobalBrainAllowed: false as const,
  acceleratorVerifiedAllowed: false as const,
  fakeVerifiedAcceleratorAllowed: false as const,
  aspirationalScaleAsMeasuredAllowed: false as const,
  atomDbClaimAllowed: false as const,
  pocketIngestStubsOnly: true as const,
  highAutonomyTargets: HIGH_AUTONOMY_TARGETS,
  executionAllowList: Object.freeze(['LOCAL'] as const),
  businessBarMetrics: BUSINESS_BAR_METRICS,
  VALUATION_THEATER_ALLOWED,
  UNIVERSES_ARE_SIMULATION_LAYERS_ONLY,
  ticket: '12D-15' as const,
  blueBrainLocalWire: 'WIRED' as const,
  brand: BLUE_BRAIN_BRAND,
} as const;

function assertBlueBrainLocalGuardrails(): void {
  const g = BLUE_BRAIN_LOCAL_GUARDRAILS;
  if (!g.readOnly) throw new Error('readOnly must remain true');
  if (!g.simulationOnly) throw new Error('simulationOnly must remain true');
  if (!g.OFFLINE_PREFER_LOCAL || !OFFLINE_PREFER_LOCAL) {
    throw new Error('OFFLINE_PREFER_LOCAL must remain true');
  }
  if (g.preferredExecution !== 'LOCAL') throw new Error('preferredExecution must remain LOCAL');
  if (g.cloudSandboxAllowed) throw new Error('cloudSandboxAllowed must remain false -- LOCAL only');
  if (g.productionAllowed) throw new Error('productionAllowed must remain false');
  if (g.productionAutoApply || g.productionAutoMerge || g.productionAutoDeploy) {
    throw new Error('productionAuto* must remain false');
  }
  if (
    g.autonomousProductionDDL ||
    g.autonomousProductionDML ||
    BUILDER_GUARDRAILS.autonomousProductionDDL ||
    BUILDER_GUARDRAILS.autonomousProductionDML
  ) {
    throw new Error('autonomousProductionDDL/DML must remain false');
  }
  if (g.destructiveDbAutoApply) throw new Error('destructiveDbAutoApply must remain false');
  if (g.L4_PRODUCTION_ENABLED) throw new Error('L4_PRODUCTION_ENABLED must remain false');
  if (g.liveCloudSyncClaimed || g.liveCloudSyncFabricationAllowed) {
    throw new Error('liveCloudSyncClaimed/fabrication must remain false');
  }
  if (g.policyGateBypassAllowed) throw new Error('policyGateBypassAllowed must remain false');
  if (!g.policyGateInFront) throw new Error('policyGateInFront must remain true -- Gate in front');
  if (!g.noDdl || !g.noDml || !g.noDeploy) throw new Error('noDdl/noDml/noDeploy must remain true');
  if (g.mayEnterGlobalBrain || g.promoteToGlobalBrainAllowed) {
    throw new Error('mayEnterGlobalBrain/promote must remain false');
  }
  if (g.acceleratorVerifiedAllowed || g.fakeVerifiedAcceleratorAllowed) {
    throw new Error('accelerators must remain UNVERIFIED -- never fake VERIFIED');
  }
  if (g.aspirationalScaleAsMeasuredAllowed) {
    throw new Error('aspirational scale must never be labeled measured');
  }
  if (ATOMIC_DATA_CELL_GUARDRAILS.atomDbClaimAllowed || g.atomDbClaimAllowed) {
    throw new Error('atomDbClaimAllowed must remain false');
  }
  if (POCKET_BRAIN_INGEST_GUARDRAILS.mayEnterGlobalBrain) {
    throw new Error('Pocket Brain mayEnterGlobalBrain must remain false');
  }
  if (!VIRTUAL_MINI_CITY_GUARDRAILS.simulationOnly) {
    throw new Error('Virtual Mini City simulationOnly must remain true (12D-14 base)');
  }
  if (VALUATION_THEATER_ALLOWED) throw new Error('VALUATION_THEATER_ALLOWED must remain false');
  if (!UNIVERSES_ARE_SIMULATION_LAYERS_ONLY) {
    throw new Error('UNIVERSES_ARE_SIMULATION_LAYERS_ONLY must remain true');
  }
  if (![...g.executionAllowList].every((e) => e === 'LOCAL') || g.executionAllowList.length !== 1) {
    throw new Error('executionAllowList must be LOCAL only');
  }
  if (!g.pocketIngestStubsOnly) throw new Error('pocketIngestStubsOnly must remain true');
}

/** Guardrail dump for evidence / Policy Gate alignment. */
export function dumpBlueBrainLocalGuardrails(): Readonly<Record<string, unknown>> {
  assertBlueBrainLocalGuardrails();
  return Object.freeze({
    ticket: BLUE_BRAIN_LOCAL_GUARDRAILS.ticket,
    brand: BLUE_BRAIN_BRAND,
    schemaVersion: BLUE_BRAIN_LOCAL_SCHEMA_VERSION,
    readOnly: true,
    simulationOnly: true,
    OFFLINE_PREFER_LOCAL: true,
    preferredExecution: 'LOCAL',
    safeEnvironments: [...BLUE_BRAIN_LOCAL_SAFE_ENVIRONMENTS],
    cloudSandboxAllowed: false,
    productionAllowed: false,
    productionAutoApply: false,
    productionAutoMerge: false,
    productionAutoDeploy: false,
    autonomousProductionDDL: false,
    autonomousProductionDML: false,
    destructiveDbAutoApply: false,
    L4_PRODUCTION_ENABLED: false,
    liveCloudSyncClaimed: false,
    liveCloudSyncFabricationAllowed: false,
    policyGateBypassAllowed: false,
    policyGateInFront: true,
    noDdl: true,
    noDml: true,
    noDeploy: true,
    mayEnterGlobalBrain: false,
    promoteToGlobalBrainAllowed: false,
    acceleratorVerifiedAllowed: false,
    aspirationalScaleAsMeasuredAllowed: false,
    atomDbClaimAllowed: false,
    pocketIngestStubsOnly: true,
    VALUATION_THEATER_ALLOWED: false,
    UNIVERSES_ARE_SIMULATION_LAYERS_ONLY: true,
    blueBrainLocalWire: 'WIRED',
  });
}

/** Accelerators: CPU may be VERIFIED; GPU/NPU/QPU stay UNVERIFIED (WAITING). */
export function blueBrainLocalAcceleratorClaims(): SiliconCapabilityClaim[] {
  assertBlueBrainLocalGuardrails();
  return [
    { backend: 'cpu', status: 'VERIFIED', notes: 'CPU-first LOCAL Blue Brain READ surface; research only' },
    { backend: 'gpu', status: 'WAITING', notes: 'UNVERIFIED -- never fake VERIFIED GPU' },
    { backend: 'npu', status: 'WAITING', notes: 'UNVERIFIED -- never fake VERIFIED NPU' },
    { backend: 'qpu', status: 'WAITING', notes: 'UNVERIFIED -- never fake VERIFIED QPU' },
  ];
}

export function assertBlueBrainAcceleratorsUnverifiedExceptCpu(
  claims: readonly SiliconCapabilityClaim[],
): void {
  for (const claim of claims) {
    if (claim.backend !== 'cpu' && claim.status === 'VERIFIED') {
      throw new Error(claim.backend + ' must remain UNVERIFIED on 12D-15 Blue Brain LOCAL path');
    }
  }
}

/** Default ADC / Blue Brain scale claims -- aspirational vs measured labeled honestly. */
export function defaultBlueBrainScaleClaims(): ScaleClaim[] {
  assertBlueBrainLocalGuardrails();
  return [
    {
      kind: 'measured',
      metric: 'pocket_brain_ingest_stubs',
      value: 3,
      unit: 'count',
      notes: 'Measured Pocket Brain ingest stub count in this LOCAL SIMULATION fixture only',
    },
    {
      kind: 'measured',
      metric: 'blue_brain_read_surface_fixtures',
      value: 1,
      unit: 'surface',
      notes: 'Measured LOCAL Blue Brain READ surface fixture -- not production capacity',
    },
    {
      kind: 'aspirational',
      metric: 'atomic_data_cell_addressable_scale',
      value: '1e12+',
      unit: 'cells',
      notes: 'ASPIRATIONAL Atomic Data Cell scale -- NOT measured; software analogy only',
    },
    {
      kind: 'aspirational',
      metric: 'blue_brain_neural_federation_span',
      value: 'global',
      unit: 'tier',
      notes: 'ASPIRATIONAL Blue Brain neural federation -- LOCAL stub only; NOT measured; no live cloud',
    },
  ];
}

export function createPocketBrainIngestStub(input: {
  stubId: string;
  relativePath: string;
  contentChecksum?: string;
  classification?: PocketBrainIngestStub['classification'];
}): PocketBrainIngestStub {
  assertBlueBrainLocalGuardrails();
  if (!input.stubId || !input.relativePath) {
    throw new TypeError('stubId and relativePath are required');
  }
  if (/(^|\/)(\.env|secrets?|credentials|id_rsa)/i.test(input.relativePath)) {
    throw new Error('secret_path_blocked:' + input.relativePath);
  }
  const checksum =
    input.contentChecksum ??
    isomorphicContentHash('pocket-stub:' + input.stubId + ':' + input.relativePath);
  return {
    stubId: input.stubId,
    relativePath: input.relativePath,
    contentChecksum: checksum,
    classification: input.classification ?? 'OFFLINE_CACHEABLE',
    mayEnterGlobalBrain: false,
    cached: true,
    productionMutation: false,
    simulationOnly: true,
  };
}

/**
 * Policy Gate in front -- every Blue Brain read must present an allowed gate decision.
 * Bypass is forbidden; denied gates yield GATE_DENIED receipts (never silent pass).
 */
export function assertBlueBrainPolicyGate(gate: BlueBrainPolicyGateDecision): void {
  assertBlueBrainLocalGuardrails();
  if (gate.gateId !== 'xiv-policy-gate') {
    throw new Error('Blue Brain requires xiv-policy-gate in front');
  }
  if (gate.bypassAttempted) {
    throw new Error('12D-15 Blue Brain NEVER allows Policy Gate bypass');
  }
}

export function allowBlueBrainPolicyGate(reason = 'LOCAL SIMULATION read allowed'): BlueBrainPolicyGateDecision {
  assertBlueBrainLocalGuardrails();
  return {
    allowed: true,
    reason,
    gateId: 'xiv-policy-gate',
    bypassAttempted: false,
  };
}

export function denyBlueBrainPolicyGate(reason: string): BlueBrainPolicyGateDecision {
  assertBlueBrainLocalGuardrails();
  return {
    allowed: false,
    reason,
    gateId: 'xiv-policy-gate',
    bypassAttempted: false,
  };
}

/** Explicit ban: production DDL from Blue Brain surface. */
export function applyBlueBrainProductionDdl(): never {
  assertBlueBrainLocalGuardrails();
  throw new Error('12D-15 Blue Brain forbids production DDL');
}

/** Explicit ban: Policy Gate bypass. */
export function bypassPolicyGateViaBlueBrain(): never {
  assertBlueBrainLocalGuardrails();
  throw new Error('12D-15 Blue Brain NEVER bypasses Policy Gate');
}

/** Explicit ban: re-label aspirational ADC / Blue Brain scale as measured. */
export function labelAspirationalBlueBrainScaleAsMeasured(_metric: string): never {
  assertBlueBrainLocalGuardrails();
  throw new Error('12D-15 forbids labeling aspirational Blue Brain / ADC scale as measured');
}

/** Explicit ban: promote LOCAL Blue Brain / Pocket stubs into global brain. */
export function promoteBlueBrainToGlobalBrain(): never {
  assertBlueBrainLocalGuardrails();
  throw new Error('12D-15 Blue Brain forbids mayEnterGlobalBrain / global promotion');
}

/** Explicit ban: cloud sandbox / production execution via Blue Brain. */
export function enterCloudSandboxViaBlueBrain(): never {
  assertBlueBrainLocalGuardrails();
  throw new Error('12D-15 Blue Brain is LOCAL / OFFLINE_PREFER_LOCAL only -- cloud sandbox forbidden');
}

/**
 * Build Blue Brain branded LOCAL neural brain READ surface with Pocket Brain ingest stubs.
 * SIMULATION honesty; Gate in front on reads; ADC scale aspirational vs measured.
 */
export function buildBlueBrainLocalSurface(input?: {
  surfaceId?: string;
  seed?: string;
  stubs?: readonly PocketBrainIngestStub[];
  scaleClaims?: readonly ScaleClaim[];
  mode?: BlueBrainSurfaceMode;
}): BlueBrainLocalSurface {
  assertBlueBrainLocalGuardrails();
  const seed = input?.seed ?? 'xiv-12d15';
  const surfaceId = input?.surfaceId ?? seed + ':blue-brain-local';
  const stubs: PocketBrainIngestStub[] = [
    ...(input?.stubs ?? [
      createPocketBrainIngestStub({
        stubId: seed + ':stub:manifest-index',
        relativePath: 'pocket/manifest-index.json',
      }),
      createPocketBrainIngestStub({
        stubId: seed + ':stub:neural-readout',
        relativePath: 'pocket/neural-readout.md',
      }),
      createPocketBrainIngestStub({
        stubId: seed + ':stub:adc-scale-labels',
        relativePath: 'pocket/adc-scale-labels.json',
        classification: 'TENANT_PRIVATE',
      }),
    ]),
  ];
  for (const stub of stubs) {
    if (stub.mayEnterGlobalBrain) throw new Error('stub mayEnterGlobalBrain must remain false');
    if (!stub.simulationOnly) throw new Error('stub simulationOnly must remain true');
    if (stub.productionMutation) throw new Error('stub productionMutation must remain false');
  }

  const scaleClaims = [...(input?.scaleClaims ?? defaultBlueBrainScaleClaims())];
  assertScaleClaimsHonest(scaleClaims);

  const accelerators = blueBrainLocalAcceleratorClaims();
  assertBlueBrainAcceleratorsUnverifiedExceptCpu(accelerators);

  const ethicsNotice =
    '12D-15 Blue Brain is a branded LOCAL / OFFLINE_PREFER_LOCAL neural brain READ surface over ' +
    'Pocket Brain ingest stubs. SIMULATION honesty only. Policy Gate in front of every read. ' +
    'No DDL/DML/deploy. productionAuto*/L4/liveCloudSyncClaimed=false. mayEnterGlobalBrain=false. ' +
    'Accelerators UNVERIFIED except CPU. Atomic Data Cell scale labeled aspirational vs measured. ' +
    'Universes = SIMULATION layers only.';
  assertEthicsSafeCopy(ethicsNotice, '12d15 blue brain ethicsNotice');

  return {
    schemaVersion: BLUE_BRAIN_LOCAL_SCHEMA_VERSION,
    brand: BLUE_BRAIN_BRAND,
    surfaceId,
    simulationOnly: true,
    preferredExecution: 'LOCAL',
    OFFLINE_PREFER_LOCAL: true,
    mode: input?.mode ?? 'SIMULATION_READ',
    pocketIngestStubs: Object.freeze(stubs),
    scaleClaims: Object.freeze(scaleClaims),
    accelerators: Object.freeze(accelerators),
    liveCloudSyncClaimed: false,
    productionAutoApply: false,
    L4_PRODUCTION_ENABLED: false,
    ethicsNotice,
  };
}

export function listPocketBrainIngestStubs(
  surface: BlueBrainLocalSurface,
): readonly PocketBrainIngestStub[] {
  assertBlueBrainLocalGuardrails();
  return surface.pocketIngestStubs;
}

export function getBlueBrainScaleClaimsByKind(
  surface: BlueBrainLocalSurface,
  kind: ScaleClaimKind,
): ScaleClaim[] {
  assertBlueBrainLocalGuardrails();
  return surface.scaleClaims.filter((c) => c.kind === kind);
}

/**
 * READ path -- Policy Gate must be presented and allowed before stub lookup.
 * Denied gates return GATE_DENIED (never bypass). Missing stubs -> MISS / WAITING_SYNC.
 */
export function readBlueBrainSurface(input: {
  surface: BlueBrainLocalSurface;
  stubId?: string;
  relativePath?: string;
  gate: BlueBrainPolicyGateDecision;
  unbound?: boolean;
}): BlueBrainReadReceipt {
  assertBlueBrainLocalGuardrails();
  assertBlueBrainPolicyGate(input.gate);

  if (!input.gate.allowed) {
    return {
      outcome: 'GATE_DENIED',
      surfaceId: input.surface.surfaceId,
      stubId: null,
      mode: input.surface.mode,
      simulationOnly: true,
      liveCloudSyncClaimed: false,
      gate: input.gate,
      notes: 'Policy Gate denied Blue Brain READ -- Gate stays in front',
    };
  }

  const stub =
    input.surface.pocketIngestStubs.find((s) =>
      input.stubId ? s.stubId === input.stubId : s.relativePath === input.relativePath,
    ) ?? null;

  if (!stub) {
    return {
      outcome: input.unbound ? 'WAITING_SYNC' : 'MISS',
      surfaceId: input.surface.surfaceId,
      stubId: null,
      mode: input.surface.mode,
      simulationOnly: true,
      liveCloudSyncClaimed: false,
      gate: input.gate,
      notes: input.unbound
        ? 'WAITING_SYNC honesty -- unbound Blue Brain stub not in LOCAL Pocket cache'
        : 'MISS -- Pocket Brain ingest stub not found on LOCAL Blue Brain surface',
    };
  }

  return {
    outcome: 'HIT',
    surfaceId: input.surface.surfaceId,
    stubId: stub.stubId,
    mode: input.surface.mode,
    simulationOnly: true,
    liveCloudSyncClaimed: false,
    gate: input.gate,
    notes: 'HIT -- LOCAL SIMULATION Blue Brain READ of Pocket Brain ingest stub',
  };
}

/** Evidence helper: content hash over guardrail dump + surface summary. */
export function evidenceHashBlueBrainLocal(parts: {
  tipSha?: string;
  surface?: BlueBrainLocalSurface;
  testsPassed?: readonly string[];
}): string {
  assertBlueBrainLocalGuardrails();
  const surface = parts.surface;
  return isomorphicContentHash(
    JSON.stringify({
      schemaVersion: BLUE_BRAIN_LOCAL_SCHEMA_VERSION,
      brand: BLUE_BRAIN_BRAND,
      guardrails: dumpBlueBrainLocalGuardrails(),
      tipSha: parts.tipSha ?? null,
      surfaceId: surface?.surfaceId ?? null,
      stubCount: surface?.pocketIngestStubs.length ?? 0,
      scaleClaims: surface?.scaleClaims ?? [],
      testsPassed: parts.testsPassed ?? [],
      liveCloudSyncClaimed: false,
      productionAutoApply: false,
      L4_PRODUCTION_ENABLED: false,
      simulationOnly: true,
      policyGateInFront: true,
    }),
  );
}
