/**
 * 62L-EX4 — Local Quantum Simulator Registry facade.
 *
 * Connects to Home Base + Agent Mesh + Classical Baseline + QI Algorithm Lab +
 * Cross-Chip Graph + Benchmark/Evidence ledgers via soft-wire (existsSync).
 * Presence ≠ VERIFIED. Absent → WAITING_DATA.
 *
 * Not a second orchestration framework.
 */

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildBellPairIR,
  type CircuitModelIR,
} from './circuit-ir.ts';
import {
  createSimulationReceipt,
  type SimulationReceipt,
} from './simulation-receipt.ts';
import {
  runLocalSimulation,
  type SimulationOutcome,
} from './simulation.ts';
import {
  createSimulatorRegistry,
  type SimulatorRegistry,
} from './simulator-registry.ts';
import {
  CANONICAL_PATHWAY,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  SHARED_IR_PATH,
  assertEx4LocksIntact,
  ex4L4AutonomyEnabled,
  ex4SoftWireSnapshot,
  guardianRlsUnchangedByEx4,
  type SimulationRequest,
  type TenantScope,
} from './types.ts';

export * from './types.ts';
export * from './circuit-ir.ts';
export * from './simulator-registry.ts';
export * from './resource-estimator.ts';
export * from './simulation.ts';
export * from './simulation-receipt.ts';

const HERE = dirname(fileURLToPath(import.meta.url));

export type Ex4CycleResult = {
  ok: boolean;
  pathway: readonly string[];
  irPath: readonly string[];
  softWires: ReturnType<typeof ex4SoftWireSnapshot>;
  locksIntact: boolean;
  l4Enabled: false;
  guardianRlsUnchanged: true;
  honesty: typeof HONESTY_BANNER;
  nextPhase: typeof NEXT_PHASE_TITLE;
  classification: 'SIMULATED_QUANTUM' | null;
  physicalQpuVerified: false;
  outcome: SimulationOutcome | null;
  receipt: SimulationReceipt | null;
  dnaManifestPresent: boolean;
  dnaXivOwnedOnly: boolean;
};

export function loadQuantumDnaManifest(): {
  present: boolean;
  xivOwnedOnly: boolean;
  proprietaryClone: false;
  pathChecked: string;
  body: Record<string, unknown> | null;
} {
  const pathChecked = join(HERE, 'XIV_QUANTUM_DNA_MANIFEST.json');
  if (!existsSync(pathChecked)) {
    return {
      present: false,
      xivOwnedOnly: false,
      proprietaryClone: false,
      pathChecked,
      body: null,
    };
  }
  const body = JSON.parse(readFileSync(pathChecked, 'utf8')) as Record<
    string,
    unknown
  >;
  const xivOwnedOnly =
    body.sourceRights === 'XIV_OWNED_SCHEMAS_RECIPES_ONLY' &&
    body.proprietaryClone !== true;
  return {
    present: true,
    xivOwnedOnly,
    proprietaryClone: false,
    pathChecked,
    body,
  };
}

export function defaultSimulationRequest(
  overrides?: Partial<SimulationRequest>,
): SimulationRequest {
  const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  return {
    requestId: overrides?.requestId ?? 'req-ex4-1',
    missionId: overrides?.missionId ?? 'mission-ex4-1',
    taskId: overrides?.taskId ?? 'task-ex4-1',
    agentId: overrides?.agentId ?? 'agent-sim-1',
    tenantId: overrides?.tenantId ?? 'tenant-a',
    universeId: overrides?.universeId ?? 'universe-a',
    circuitIrId: overrides?.circuitIrId ?? 'ir-bell-pair',
    preferredSimulatorId: overrides?.preferredSimulatorId ?? 'xiv-sv-cpu-v1',
    preferredRuntimeType: overrides?.preferredRuntimeType ?? 'LOCAL_CPU',
    preferredDeviceClass: overrides?.preferredDeviceClass ?? 'CPU',
    shots: overrides?.shots ?? 256,
    seed: overrides?.seed ?? 42,
    precision: overrides?.precision ?? 'COMPLEX128',
    noiseModel: overrides?.noiseModel ?? null,
    maxQubits: overrides?.maxQubits ?? 12,
    maxDepth: overrides?.maxDepth ?? 64,
    maxMemoryMb: overrides?.maxMemoryMb ?? 256,
    maxWallClockMs: overrides?.maxWallClockMs ?? 30_000,
    classicalBaselineId: overrides?.classicalBaselineId ?? null,
    expiresAt: overrides?.expiresAt ?? expires,
    offlineDisconnected: overrides?.offlineDisconnected ?? false,
    poweredOff: overrides?.poweredOff ?? false,
    requireVerifiedSimulator: overrides?.requireVerifiedSimulator ?? false,
    networkAvailable: overrides?.networkAvailable ?? true,
    role: overrides?.role ?? 'SimulationAgent',
  };
}

/**
 * End-to-end local simulation cycle returning to XIV Home Base pathway.
 * Always SIMULATED_QUANTUM. Never PHYSICAL_QPU_VERIFIED.
 */
export function runEx4SimulatorCycle(input?: {
  scope?: TenantScope;
  request?: Partial<SimulationRequest>;
  circuit?: CircuitModelIR;
  registry?: SimulatorRegistry;
  claimPhysicalQpu?: boolean;
  actorTenantId?: string;
  actorUniverseId?: string;
  verifyAfterSuccess?: boolean;
}): Ex4CycleResult {
  const softWires = ex4SoftWireSnapshot();
  const dna = loadQuantumDnaManifest();
  const scope = input?.scope ?? {
    tenantId: 'tenant-a',
    universeId: 'universe-a',
  };
  const registry = input?.registry ?? createSimulatorRegistry(scope);
  const request = defaultSimulationRequest({
    tenantId: scope.tenantId,
    universeId: scope.universeId,
    ...input?.request,
  });
  const circuit = input?.circuit ?? buildBellPairIR(request.circuitIrId);

  const outcome = runLocalSimulation({
    request,
    circuit,
    registry,
    claimPhysicalQpu: input?.claimPhysicalQpu,
    actorTenantId: input?.actorTenantId,
    actorUniverseId: input?.actorUniverseId,
  });

  let receipt: SimulationReceipt | null = null;
  if (outcome.ok) {
    const created = createSimulationReceipt({
      receiptId: `rcpt-${request.requestId}`,
      request,
      outcome,
      classicalBaselineId: request.classicalBaselineId,
      evidenceRefs: ['ex4-local-sim'],
    });
    if (created.ok) {
      receipt = created.receipt;
      if (input?.verifyAfterSuccess !== false) {
        registry.advanceVerification(outcome.simulatorId, 'VERIFIED', {
          detected: true,
          initialized: true,
          boundedCircuitCompleted: true,
          validated: true,
          deviceRecorded: true,
          receiptId: receipt.receiptId,
        });
      }
    }
  }

  return {
    ok: outcome.ok,
    pathway: [...CANONICAL_PATHWAY],
    irPath: [...SHARED_IR_PATH],
    softWires,
    locksIntact: assertEx4LocksIntact(),
    l4Enabled: ex4L4AutonomyEnabled(),
    guardianRlsUnchanged: guardianRlsUnchangedByEx4(),
    honesty: HONESTY_BANNER,
    nextPhase: NEXT_PHASE_TITLE,
    classification: outcome.ok ? 'SIMULATED_QUANTUM' : outcome.classification,
    physicalQpuVerified: false,
    outcome,
    receipt,
    dnaManifestPresent: dna.present,
    dnaXivOwnedOnly: dna.xivOwnedOnly,
  };
}
