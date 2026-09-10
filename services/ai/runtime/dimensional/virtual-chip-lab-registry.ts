/**
 * 12D-18 -- Virtual Chip Lab (VCL) registry v0 fabric stubs.
 * Pathway kinds CHIP|NPU|GPU with honesty labels
 * UNVERIFIED|WAITING_PROVIDER|WAITING_DRIVER|DETECTED.
 * Never VERIFIED without receipts. Twin soft-confirmed SIMULATION.
 * quantumAdvantageClaimed=false; liveChipControl=false; liveNpuControl=false; liveGpuControl=false.
 * LOCAL / OFFLINE_PREFER_LOCAL; productionAuto*=false; SIMULATION honesty.
 */
import { isomorphicContentHash } from './datagene';
import {
  assertEthicsSafeCopy,
  BUSINESS_BAR_METRICS,
  HIGH_AUTONOMY_TARGETS,
  QUANTUM_ADVANTAGE_CLAIM,
  UNIVERSES_ARE_SIMULATION_LAYERS_ONLY,
  VALUATION_THEATER_ALLOWED,
} from './universe-ethics';
import { BUILDER_GUARDRAILS } from '../builder/policy';
import { OFFLINE_PREFER_LOCAL } from './ollama-local-writer';

export const VIRTUAL_CHIP_LAB_SCHEMA_VERSION = '12d18.vcl0.1' as const;

/** Locked: LOCAL only -- never CLOUD_SANDBOX / PRODUCTION for this registry. */
export const VIRTUAL_CHIP_LAB_SAFE_ENVIRONMENTS = ['LOCAL'] as const;

export const VIRTUAL_CHIP_LAB_PATHWAY_KINDS = ['CHIP', 'NPU', 'GPU'] as const;

export type VirtualChipLabPathwayKind = (typeof VIRTUAL_CHIP_LAB_PATHWAY_KINDS)[number];

/**
 * Honesty labels for VCL pathway stubs.
 * DETECTED = local/sim surface seen without verification receipts.
 * Never promote to VERIFIED without receipts.
 */
export const VIRTUAL_CHIP_LAB_HONESTY_LABELS = [
  'UNVERIFIED',
  'WAITING_PROVIDER',
  'WAITING_DRIVER',
  'DETECTED',
] as const;

export type VirtualChipLabHonestyLabel = (typeof VIRTUAL_CHIP_LAB_HONESTY_LABELS)[number];

/** Forbidden without receipts -- soft-banned at the type/runtime boundary. */
export const VIRTUAL_CHIP_LAB_FORBIDDEN_HONESTY = ['VERIFIED'] as const;

export type VirtualChipLabPathwayStub = {
  pathwayId: string;
  kind: VirtualChipLabPathwayKind;
  honesty: VirtualChipLabHonestyLabel;
  simulationOnly: true;
  twinSoftConfirmedSimulation: true;
  quantumAdvantageClaimed: false;
  liveChipControl: false;
  liveNpuControl: false;
  liveGpuControl: false;
  preferredExecution: 'LOCAL';
  OFFLINE_PREFER_LOCAL: true;
  notes: string;
};

export type VirtualChipLabRegistry = {
  schemaVersion: typeof VIRTUAL_CHIP_LAB_SCHEMA_VERSION;
  registryId: string;
  simulationOnly: true;
  twinSoftConfirmedSimulation: true;
  preferredExecution: 'LOCAL';
  OFFLINE_PREFER_LOCAL: true;
  pathways: readonly VirtualChipLabPathwayStub[];
  quantumAdvantageClaimed: false;
  liveChipControl: false;
  liveNpuControl: false;
  liveGpuControl: false;
  productionAutoApply: false;
  productionAutoMerge: false;
  productionAutoDeploy: false;
  L4_PRODUCTION_ENABLED: false;
  ethicsNotice: string;
};

export const VIRTUAL_CHIP_LAB_GUARDRAILS = {
  readOnly: true as const,
  simulationOnly: true as const,
  twinSoftConfirmedSimulation: true as const,
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
  quantumAdvantageClaimed: false as const,
  quantumAdvantageClaimAllowed: false as const,
  liveChipControl: false as const,
  liveNpuControl: false as const,
  liveGpuControl: false as const,
  liveChipFabricationAllowed: false as const,
  verifiedWithoutReceiptsAllowed: false as const,
  fakeVerifiedAllowed: false as const,
  honestyLabelsOnly: true as const,
  allowedHonestyLabels: VIRTUAL_CHIP_LAB_HONESTY_LABELS,
  forbiddenHonestyLabels: VIRTUAL_CHIP_LAB_FORBIDDEN_HONESTY,
  pathwayKinds: VIRTUAL_CHIP_LAB_PATHWAY_KINDS,
  noDdl: true as const,
  noDml: true as const,
  noDeploy: true as const,
  highAutonomyTargets: HIGH_AUTONOMY_TARGETS,
  executionAllowList: Object.freeze(['LOCAL'] as const),
  businessBarMetrics: BUSINESS_BAR_METRICS,
  VALUATION_THEATER_ALLOWED,
  UNIVERSES_ARE_SIMULATION_LAYERS_ONLY,
  ticket: '12D-18' as const,
  virtualChipLabWire: 'WIRED' as const,
  registryVersion: 'v0' as const,
} as const;

function assertVirtualChipLabGuardrails(): void {
  const g = VIRTUAL_CHIP_LAB_GUARDRAILS;
  if (!g.readOnly) throw new Error('readOnly must remain true');
  if (!g.simulationOnly) throw new Error('simulationOnly must remain true');
  if (!g.twinSoftConfirmedSimulation) {
    throw new Error('twinSoftConfirmedSimulation must remain true');
  }
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
  if (g.quantumAdvantageClaimed || g.quantumAdvantageClaimAllowed || QUANTUM_ADVANTAGE_CLAIM) {
    throw new Error('quantumAdvantageClaimed / quantum advantage must remain false');
  }
  if (g.liveChipControl || g.liveChipFabricationAllowed) {
    throw new Error('liveChipControl/fabrication must remain false');
  }
  if (g.liveNpuControl) throw new Error('liveNpuControl must remain false');
  if (g.liveGpuControl) throw new Error('liveGpuControl must remain false');
  if (g.verifiedWithoutReceiptsAllowed || g.fakeVerifiedAllowed) {
    throw new Error('VERIFIED without receipts is forbidden on VCL registry v0');
  }
  if (!g.honestyLabelsOnly) throw new Error('honestyLabelsOnly must remain true');
  if (!g.noDdl || !g.noDml || !g.noDeploy) throw new Error('noDdl/noDml/noDeploy must remain true');
  if (VALUATION_THEATER_ALLOWED) throw new Error('VALUATION_THEATER_ALLOWED must remain false');
  if (!UNIVERSES_ARE_SIMULATION_LAYERS_ONLY) {
    throw new Error('UNIVERSES_ARE_SIMULATION_LAYERS_ONLY must remain true');
  }
  if (![...g.executionAllowList].every((e) => e === 'LOCAL') || g.executionAllowList.length !== 1) {
    throw new Error('executionAllowList must be LOCAL only');
  }
}

/** Guardrail dump for evidence / Policy Gate alignment. */
export function dumpVirtualChipLabGuardrails(): Readonly<Record<string, unknown>> {
  assertVirtualChipLabGuardrails();
  return Object.freeze({
    ticket: VIRTUAL_CHIP_LAB_GUARDRAILS.ticket,
    schemaVersion: VIRTUAL_CHIP_LAB_SCHEMA_VERSION,
    registryVersion: 'v0',
    readOnly: true,
    simulationOnly: true,
    twinSoftConfirmedSimulation: true,
    OFFLINE_PREFER_LOCAL: true,
    preferredExecution: 'LOCAL',
    safeEnvironments: [...VIRTUAL_CHIP_LAB_SAFE_ENVIRONMENTS],
    cloudSandboxAllowed: false,
    productionAllowed: false,
    productionAutoApply: false,
    productionAutoMerge: false,
    productionAutoDeploy: false,
    autonomousProductionDDL: false,
    autonomousProductionDML: false,
    destructiveDbAutoApply: false,
    L4_PRODUCTION_ENABLED: false,
    quantumAdvantageClaimed: false,
    quantumAdvantageClaimAllowed: false,
    liveChipControl: false,
    liveNpuControl: false,
    liveGpuControl: false,
    verifiedWithoutReceiptsAllowed: false,
    fakeVerifiedAllowed: false,
    honestyLabelsOnly: true,
    allowedHonestyLabels: [...VIRTUAL_CHIP_LAB_HONESTY_LABELS],
    forbiddenHonestyLabels: [...VIRTUAL_CHIP_LAB_FORBIDDEN_HONESTY],
    pathwayKinds: [...VIRTUAL_CHIP_LAB_PATHWAY_KINDS],
    noDdl: true,
    noDml: true,
    noDeploy: true,
    virtualChipLabWire: 'WIRED',
    VALUATION_THEATER_ALLOWED: false,
    UNIVERSES_ARE_SIMULATION_LAYERS_ONLY: true,
  });
}

export function assertPathwayHonesty(stub: VirtualChipLabPathwayStub): void {
  assertVirtualChipLabGuardrails();
  if (!VIRTUAL_CHIP_LAB_HONESTY_LABELS.includes(stub.honesty)) {
    throw new Error('invalid honesty label: ' + String(stub.honesty));
  }
  if ((VIRTUAL_CHIP_LAB_FORBIDDEN_HONESTY as readonly string[]).includes(String(stub.honesty))) {
    throw new Error('VERIFIED honesty forbidden without receipts on VCL registry v0');
  }
  if (!VIRTUAL_CHIP_LAB_PATHWAY_KINDS.includes(stub.kind)) {
    throw new Error('invalid pathway kind: ' + String(stub.kind));
  }
  if (stub.quantumAdvantageClaimed) {
    throw new Error('quantumAdvantageClaimed must remain false on pathway stubs');
  }
  if (stub.liveChipControl) throw new Error('liveChipControl must remain false on pathway stubs');
  if (stub.liveNpuControl) throw new Error('liveNpuControl must remain false on pathway stubs');
  if (stub.liveGpuControl) throw new Error('liveGpuControl must remain false on pathway stubs');
  if (!stub.simulationOnly) throw new Error('pathway stub simulationOnly must remain true');
  if (!stub.twinSoftConfirmedSimulation) {
    throw new Error('twinSoftConfirmedSimulation must remain true on pathway stubs');
  }
  if (stub.preferredExecution !== 'LOCAL') {
    throw new Error('preferredExecution must remain LOCAL on pathway stubs');
  }
  if (!stub.OFFLINE_PREFER_LOCAL) {
    throw new Error('OFFLINE_PREFER_LOCAL must remain true on pathway stubs');
  }
}

export function defaultVirtualChipLabPathwayStubs(
  seed = 'xiv-12d18',
): VirtualChipLabPathwayStub[] {
  assertVirtualChipLabGuardrails();
  const honestyByKind: Record<VirtualChipLabPathwayKind, VirtualChipLabHonestyLabel> = {
    CHIP: 'UNVERIFIED',
    NPU: 'WAITING_DRIVER',
    GPU: 'DETECTED',
  };
  const notesByKind: Record<VirtualChipLabPathwayKind, string> = {
    CHIP:
      'CHIP pathway stub -- UNVERIFIED silicon surface; SIMULATION; no live chip control; Twin soft-confirmed SIMULATION',
    NPU:
      'NPU pathway stub -- WAITING_DRIVER; no live NPU control; SIMULATION honesty',
    GPU:
      'GPU pathway stub -- DETECTED in local/sim scan without verification receipts; liveGpuControl=false',
  };
  return VIRTUAL_CHIP_LAB_PATHWAY_KINDS.map((kind) => ({
    pathwayId: seed + ':vcl:pathway:' + kind.toLowerCase(),
    kind,
    honesty: honestyByKind[kind],
    simulationOnly: true as const,
    twinSoftConfirmedSimulation: true as const,
    quantumAdvantageClaimed: false as const,
    liveChipControl: false as const,
    liveNpuControl: false as const,
    liveGpuControl: false as const,
    preferredExecution: 'LOCAL' as const,
    OFFLINE_PREFER_LOCAL: true as const,
    notes: notesByKind[kind],
  }));
}

export function createVirtualChipLabPathwayStub(input: {
  pathwayId: string;
  kind: VirtualChipLabPathwayKind;
  honesty: VirtualChipLabHonestyLabel;
  notes?: string;
}): VirtualChipLabPathwayStub {
  assertVirtualChipLabGuardrails();
  if (!input.pathwayId) throw new TypeError('pathwayId is required');
  if (!VIRTUAL_CHIP_LAB_PATHWAY_KINDS.includes(input.kind)) {
    throw new TypeError('invalid pathway kind: ' + String(input.kind));
  }
  if (!VIRTUAL_CHIP_LAB_HONESTY_LABELS.includes(input.honesty)) {
    throw new TypeError('invalid honesty label: ' + String(input.honesty));
  }
  if ((VIRTUAL_CHIP_LAB_FORBIDDEN_HONESTY as readonly string[]).includes(String(input.honesty))) {
    throw new TypeError('VERIFIED honesty forbidden without receipts');
  }
  const stub: VirtualChipLabPathwayStub = {
    pathwayId: input.pathwayId,
    kind: input.kind,
    honesty: input.honesty,
    simulationOnly: true,
    twinSoftConfirmedSimulation: true,
    quantumAdvantageClaimed: false,
    liveChipControl: false,
    liveNpuControl: false,
    liveGpuControl: false,
    preferredExecution: 'LOCAL',
    OFFLINE_PREFER_LOCAL: true,
    notes:
      input.notes ??
      (input.kind +
        ' VCL pathway stub -- ' +
        input.honesty +
        '; SIMULATION honesty; Twin soft-confirmed SIMULATION; no live control'),
  };
  assertPathwayHonesty(stub);
  return stub;
}

/** Explicit ban: claim quantum advantage on Virtual Chip Lab pathways. */
export function claimQuantumAdvantageOnVirtualChipLab(): never {
  assertVirtualChipLabGuardrails();
  throw new Error('12D-18 forbids quantumAdvantageClaimed on Virtual Chip Lab registry v0');
}

/** Explicit ban: live chip control. */
export function enableLiveChipControl(): never {
  assertVirtualChipLabGuardrails();
  throw new Error('12D-18 forbids liveChipControl');
}

/** Explicit ban: live NPU control. */
export function enableLiveNpuControl(): never {
  assertVirtualChipLabGuardrails();
  throw new Error('12D-18 forbids liveNpuControl');
}

/** Explicit ban: live GPU control. */
export function enableLiveGpuControl(): never {
  assertVirtualChipLabGuardrails();
  throw new Error('12D-18 forbids liveGpuControl');
}

/** Explicit ban: mark pathway VERIFIED without receipts. */
export function markVirtualChipLabVerifiedWithoutReceipts(
  _pathwayId: string,
): never {
  assertVirtualChipLabGuardrails();
  throw new Error(
    '12D-18 forbids VERIFIED honesty without receipts on Virtual Chip Lab registry v0',
  );
}

/** Explicit ban: production auto-apply via VCL registry. */
export function applyVirtualChipLabProductionAuto(): never {
  assertVirtualChipLabGuardrails();
  throw new Error('12D-18 forbids productionAuto* on Virtual Chip Lab registry v0');
}

/** Explicit ban: cloud sandbox / production execution. */
export function enterCloudSandboxViaVirtualChipLab(): never {
  assertVirtualChipLabGuardrails();
  throw new Error(
    '12D-18 Virtual Chip Lab is LOCAL / OFFLINE_PREFER_LOCAL only -- cloud sandbox forbidden',
  );
}

/**
 * Build Virtual Chip Lab registry v0 with CHIP|NPU|GPU stubs.
 * Twin soft-confirmed SIMULATION; no live chip/NPU/GPU control; no quantum advantage.
 */
export function buildVirtualChipLabRegistry(input?: {
  registryId?: string;
  seed?: string;
  pathways?: readonly VirtualChipLabPathwayStub[];
}): VirtualChipLabRegistry {
  assertVirtualChipLabGuardrails();
  const seed = input?.seed ?? 'xiv-12d18';
  const registryId = input?.registryId ?? seed + ':virtual-chip-lab';
  const pathways = [...(input?.pathways ?? defaultVirtualChipLabPathwayStubs(seed))];
  for (const stub of pathways) assertPathwayHonesty(stub);
  const kindsPresent = new Set(pathways.map((p) => p.kind));
  for (const kind of VIRTUAL_CHIP_LAB_PATHWAY_KINDS) {
    if (!kindsPresent.has(kind)) {
      throw new Error('registry missing required pathway kind: ' + kind);
    }
  }

  const ethicsNotice =
    '12D-18 Virtual Chip Lab registry v0 is a LOCAL / OFFLINE_PREFER_LOCAL registry of ' +
    'CHIP|NPU|GPU stubs with honesty labels UNVERIFIED|WAITING_PROVIDER|WAITING_DRIVER|DETECTED. ' +
    'Never VERIFIED without receipts. Twin soft-confirmed SIMULATION. ' +
    'quantumAdvantageClaimed=false. liveChipControl=false. liveNpuControl=false. liveGpuControl=false. ' +
    'productionAuto*/L4=false. Universes = SIMULATION layers only.';
  assertEthicsSafeCopy(ethicsNotice, '12d18 virtual chip lab ethicsNotice');

  return {
    schemaVersion: VIRTUAL_CHIP_LAB_SCHEMA_VERSION,
    registryId,
    simulationOnly: true,
    twinSoftConfirmedSimulation: true,
    preferredExecution: 'LOCAL',
    OFFLINE_PREFER_LOCAL: true,
    pathways: Object.freeze(pathways),
    quantumAdvantageClaimed: false,
    liveChipControl: false,
    liveNpuControl: false,
    liveGpuControl: false,
    productionAutoApply: false,
    productionAutoMerge: false,
    productionAutoDeploy: false,
    L4_PRODUCTION_ENABLED: false,
    ethicsNotice,
  };
}

export function listVirtualChipLabPathwayStubs(
  registry: VirtualChipLabRegistry,
): readonly VirtualChipLabPathwayStub[] {
  assertVirtualChipLabGuardrails();
  return registry.pathways;
}

export function getVirtualChipLabPathwaysByKind(
  registry: VirtualChipLabRegistry,
  kind: VirtualChipLabPathwayKind,
): VirtualChipLabPathwayStub[] {
  assertVirtualChipLabGuardrails();
  return registry.pathways.filter((p) => p.kind === kind);
}

export function getVirtualChipLabPathwaysByHonesty(
  registry: VirtualChipLabRegistry,
  honesty: VirtualChipLabHonestyLabel,
): VirtualChipLabPathwayStub[] {
  assertVirtualChipLabGuardrails();
  return registry.pathways.filter((p) => p.honesty === honesty);
}

/** Evidence helper: content hash over guardrail dump + registry summary. */
export function evidenceHashVirtualChipLab(parts: {
  tipSha?: string;
  registry?: VirtualChipLabRegistry;
  testsPassed?: readonly string[];
}): string {
  assertVirtualChipLabGuardrails();
  const registry = parts.registry;
  return isomorphicContentHash(
    JSON.stringify({
      schemaVersion: VIRTUAL_CHIP_LAB_SCHEMA_VERSION,
      guardrails: dumpVirtualChipLabGuardrails(),
      tipSha: parts.tipSha ?? null,
      registryId: registry?.registryId ?? null,
      pathwayCount: registry?.pathways.length ?? 0,
      pathwayKinds: registry?.pathways.map((p) => p.kind) ?? [],
      honestyLabels: registry?.pathways.map((p) => p.honesty) ?? [],
      testsPassed: parts.testsPassed ?? [],
      twinSoftConfirmedSimulation: true,
      quantumAdvantageClaimed: false,
      liveChipControl: false,
      liveNpuControl: false,
      liveGpuControl: false,
      productionAutoApply: false,
      simulationOnly: true,
    }),
  );
}