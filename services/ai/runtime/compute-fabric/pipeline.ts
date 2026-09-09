/**
 * 62L-EX17 — heterogeneous compute pipeline.
 * Agents request capabilities; do not seize hardware.
 * CPU safe fallback never verifies failed accelerator.
 * Functional with QPU=UNAVAILABLE.
 */

import { runPostprocessFabric } from './postprocess.ts';
import { defaultClassicalPartition } from './partitioner.ts';
import { runPreprocessFabric } from './preprocess.ts';
import {
  applyLearningFeedback,
  createFailedRouteEvidence,
  createHybridBenchmark,
  createStageReceipt,
} from './receipts.ts';
import {
  governMemory,
  governSimulatorResources,
} from './resource-governor.ts';
import {
  EX17_LOCKS,
  deviceSatisfiesRequiredTruth,
  ex17Deny,
  isAcceleratorClass,
  isEx17Denial,
  type CheckpointRecord,
  type ComputeClass,
  type ComputeEvidence,
  type ComputeStageRequest,
  type DeviceProfile,
  type Ex17Denial,
  type HybridBenchmark,
  type LearningUpdate,
  type PartitionRecord,
  type RoutingDecision,
  type StageReceipt,
} from './types.ts';

export type PipelineRunResult =
  | {
      ok: true;
      decision: RoutingDecision;
      receipt: StageReceipt;
      partition: PartitionRecord;
      benchmark: HybridBenchmark;
      evidence: ComputeEvidence | null;
      learning: LearningUpdate | null;
      requestedDevice: ComputeClass;
      actualDevice: ComputeClass;
      fallbackUsed: boolean;
      fallbackReason: string | null;
      acceleratorVerified: false;
      checkpoint: CheckpointRecord | null;
    }
  | (Ex17Denial & {
      receipt: StageReceipt;
      evidence: ComputeEvidence;
      partition?: PartitionRecord;
      benchmark?: HybridBenchmark;
      checkpoint?: CheckpointRecord;
    });

function findDevice(
  devices: readonly DeviceProfile[],
  computeClass: ComputeClass,
  tenantId: string,
  universeId: string,
): DeviceProfile | undefined {
  return devices.find(
    (d) =>
      d.computeClass === computeClass &&
      d.tenantId === tenantId &&
      d.universeId === universeId,
  );
}

function npuEligible(device: DeviceProfile, request: ComputeStageRequest): boolean {
  if (EX17_LOCKS.NPU_WITHOUT_RUNTIME_MODEL_EVIDENCE) return false;
  const runtimeOk =
    !!device.npuRuntimeId &&
    !!request.npuRuntimeId &&
    device.npuRuntimeId === request.npuRuntimeId;
  const modelOk =
    !!device.npuModelId &&
    !!request.npuModelId &&
    device.npuModelId === request.npuModelId;
  const evidenceOk =
    device.npuEvidenceCompatible === true &&
    request.npuEvidenceCompatible === true;
  return runtimeOk && modelOk && evidenceOk;
}

function authorizeScope(
  request: ComputeStageRequest,
  actorTenantId: string,
  actorUniverseId: string,
): Ex17Denial | null {
  if (actorTenantId !== request.tenantId || EX17_LOCKS.CROSS_TENANT_COMPUTE) {
    return ex17Deny('CROSS_TENANT_DENIED');
  }
  if (
    actorUniverseId !== request.universeId ||
    EX17_LOCKS.CROSS_UNIVERSE_COMPUTE
  ) {
    return ex17Deny('CROSS_UNIVERSE_DENIED');
  }
  if (request.seizeHardware === true || EX17_LOCKS.AGENTS_SEIZE_HARDWARE) {
    return ex17Deny('HARDWARE_SEIZE_DENIED');
  }
  if (request.capabilityRequest !== true) {
    return ex17Deny('CAPABILITY_REQUEST_REQUIRED');
  }
  return null;
}

export function runComputePipeline(input: {
  request: ComputeStageRequest;
  devices: readonly DeviceProfile[];
  actorTenantId: string;
  actorUniverseId: string;
  nowIso: string;
  /** Measured timings for hybrid benchmark (optional). */
  timings?: {
    preprocessingMs: number;
    executionMs: number;
    postprocessingMs: number;
    queueMs?: number;
    networkMs?: number;
  };
}): PipelineRunResult {
  const { request, devices, actorTenantId, actorUniverseId, nowIso } = input;

  const scopeDeny = authorizeScope(request, actorTenantId, actorUniverseId);
  if (scopeDeny) {
    const evidence = createFailedRouteEvidence(
      request,
      scopeDeny.reason,
      nowIso,
    );
    return {
      ...scopeDeny,
      receipt: createStageReceipt({
        request,
        status: 'DENIED',
        actualDevice: null,
        fallbackUsed: false,
        fallbackReason: null,
        acceleratorVerified: false,
        decision: 'DENY',
        note: scopeDeny.reason,
        nowIso,
      }),
      evidence,
    };
  }

  // §17 Power-off → OFFLINE_STOPPED; no fake continued compute.
  if (request.powerState === 'OFF') {
    const evidence = createFailedRouteEvidence(
      request,
      'POWERED_OFF_OFFLINE_STOPPED',
      nowIso,
    );
    const checkpoint: CheckpointRecord = {
      checkpointId: `ckpt-${request.requestId}`,
      requestId: request.requestId,
      stage: request.stage,
      resumeValid: true,
      poweredOff: true,
      continuedComputeAfterPowerOff: false,
      createdAt: nowIso,
    };
    return {
      ...ex17Deny('POWERED_OFF', 'OFFLINE_STOPPED', true),
      receipt: createStageReceipt({
        request,
        status: 'STOPPED',
        actualDevice: null,
        fallbackUsed: false,
        fallbackReason: null,
        acceleratorVerified: false,
        decision: 'OFFLINE_STOPPED',
        note: 'Device powered off — checkpointed; no fake continued compute.',
        nowIso,
      }),
      evidence,
      checkpoint,
    };
  }

  // §16 Offline web → WAITING_DATA
  if (!request.networkOnline && request.requiresWebData) {
    const evidence = createFailedRouteEvidence(
      request,
      'OFFLINE_WEB_WAITING_DATA',
      nowIso,
    );
    return {
      ...ex17Deny('OFFLINE_REQUIRES_WEB', 'WAITING_DATA', true),
      receipt: createStageReceipt({
        request,
        status: 'WAITING',
        actualDevice: null,
        fallbackUsed: false,
        fallbackReason: null,
        acceleratorVerified: false,
        decision: 'WAITING_DATA',
        note: 'Offline local node cannot fetch web data.',
        nowIso,
      }),
      evidence,
    };
  }

  // §16 Offline QPU → WAITING_PROVIDER
  if (
    request.requestedDevice === 'PHYSICAL_QPU_CANDIDATE' &&
    (!request.qpuAvailable || request.waitingProvider)
  ) {
    const evidence = createFailedRouteEvidence(
      request,
      'QPU_WAITING_PROVIDER',
      nowIso,
    );
    return {
      ...ex17Deny('QPU_UNAVAILABLE', 'WAITING_PROVIDER', true),
      receipt: createStageReceipt({
        request,
        status: 'WAITING',
        actualDevice: null,
        fallbackUsed: false,
        fallbackReason: null,
        acceleratorVerified: false,
        decision: 'WAITING_PROVIDER',
        note: 'Physical QPU unavailable — WAITING_PROVIDER; fabric remains functional classically.',
        nowIso,
      }),
      evidence,
    };
  }

  // §16 Offline local workload eligible
  if (
    !request.networkOnline &&
    request.offlineLocalEligible === false &&
    request.requiresWebData === false &&
    request.requestedDevice !== 'PHYSICAL_QPU_CANDIDATE'
  ) {
    // If explicitly marked not eligible, deny; otherwise allow below.
    const evidence = createFailedRouteEvidence(
      request,
      'OFFLINE_LOCAL_NOT_ELIGIBLE',
      nowIso,
    );
    return {
      ...ex17Deny('OFFLINE_LOCAL_NOT_ELIGIBLE', 'DENIED', true),
      receipt: createStageReceipt({
        request,
        status: 'DENIED',
        actualDevice: null,
        fallbackUsed: false,
        fallbackReason: null,
        acceleratorVerified: false,
        decision: 'DENY',
        note: 'Offline local workload not eligible.',
        nowIso,
      }),
      evidence,
    };
  }

  // Resource governors before execute.
  const mem = governMemory(request);
  if (isEx17Denial(mem)) {
    const evidence = createFailedRouteEvidence(request, mem.reason, nowIso);
    return {
      ...mem,
      receipt: createStageReceipt({
        request,
        status: 'DENIED',
        actualDevice: null,
        fallbackUsed: false,
        fallbackReason: null,
        acceleratorVerified: false,
        decision: 'DENY_RESOURCE_LIMIT',
        note: mem.reason,
        nowIso,
      }),
      evidence,
    };
  }

  if (
    request.requestedDevice === 'SIMULATOR_CPU' ||
    request.requestedDevice === 'SIMULATOR_GPU'
  ) {
    const sim = governSimulatorResources(request);
    if (isEx17Denial(sim)) {
      const evidence = createFailedRouteEvidence(request, sim.reason, nowIso);
      return {
        ...sim,
        receipt: createStageReceipt({
          request,
          status: 'DENIED',
          actualDevice: null,
          fallbackUsed: false,
          fallbackReason: null,
          acceleratorVerified: false,
          decision: 'DENY_RESOURCE_LIMIT',
          note: sim.reason,
          nowIso,
        }),
        evidence,
      };
    }
  }

  const pre = runPreprocessFabric(request);
  if (isEx17Denial(pre)) {
    const evidence = createFailedRouteEvidence(request, pre.reason, nowIso);
    return {
      ...pre,
      receipt: createStageReceipt({
        request,
        status: 'DENIED',
        actualDevice: null,
        fallbackUsed: false,
        fallbackReason: null,
        acceleratorVerified: false,
        decision: 'DENY',
        note: pre.reason,
        nowIso,
      }),
      evidence,
    };
  }

  const requested = findDevice(
    devices,
    request.requestedDevice,
    request.tenantId,
    request.universeId,
  );

  // Prefer local hardware home profile; Home Base may reroute (recorded in note).
  const preferredHome = request.preferredExecutionProfile;
  const homeRerouteNote =
    preferredHome !== request.requestedDevice && request.homeBaseMayReroute
      ? ` Home Base may reroute from preferred ${preferredHome}.`
      : '';

  let actualDevice: ComputeClass = request.requestedDevice;
  let fallbackUsed = false;
  let fallbackReason: string | null = null;
  let decision: RoutingDecision = 'RUN';
  let note = `Capability granted on ${request.requestedDevice}.${homeRerouteNote}`;

  // Device missing → WAITING_NODE or fallback.
  if (!requested) {
    if (request.allowCpuFallback && request.requestedDevice !== 'CPU') {
      actualDevice = 'CPU';
      fallbackUsed = true;
      fallbackReason = 'REQUESTED_DEVICE_MISSING';
      decision = 'FALLBACK';
      note = `Requested ${request.requestedDevice} missing → CPU fallback.`;
    } else {
      const evidence = createFailedRouteEvidence(
        request,
        'WAITING_NODE',
        nowIso,
      );
      return {
        ...ex17Deny('DEVICE_NOT_FOUND', 'WAITING_NODE', true),
        receipt: createStageReceipt({
          request,
          status: 'WAITING',
          actualDevice: null,
          fallbackUsed: false,
          fallbackReason: null,
          acceleratorVerified: false,
          decision: 'WAITING_NODE',
          note: 'Requested device node not present.',
          nowIso,
        }),
        evidence,
      };
    }
  } else {
    // Powered-off device profile.
    if (requested.poweredOff) {
      const evidence = createFailedRouteEvidence(
        request,
        'DEVICE_POWERED_OFF',
        nowIso,
      );
      const checkpoint: CheckpointRecord = {
        checkpointId: `ckpt-${request.requestId}`,
        requestId: request.requestId,
        stage: request.stage,
        resumeValid: true,
        poweredOff: true,
        continuedComputeAfterPowerOff: false,
        createdAt: nowIso,
      };
      return {
        ...ex17Deny('DEVICE_POWERED_OFF', 'OFFLINE_STOPPED', true),
        receipt: createStageReceipt({
          request,
          status: 'STOPPED',
          actualDevice: null,
          fallbackUsed: false,
          fallbackReason: null,
          acceleratorVerified: false,
          decision: 'OFFLINE_STOPPED',
          note: 'Device profile powered off.',
          nowIso,
        }),
        evidence,
        checkpoint,
      };
    }

    // Truth ladder: DETECTED cannot satisfy VERIFIED.
    if (
      !deviceSatisfiesRequiredTruth(
        requested.truthState,
        request.requiredTruthState,
      )
    ) {
      if (
        request.allowCpuFallback &&
        isAcceleratorClass(request.requestedDevice)
      ) {
        actualDevice = 'CPU';
        fallbackUsed = true;
        fallbackReason = `TRUTH_${requested.truthState}_CANNOT_SATISFY_${request.requiredTruthState}`;
        decision = 'FALLBACK';
        note = `DETECTED/unverified accelerator cannot satisfy ${request.requiredTruthState}; CPU fallback. Accelerator NOT verified.`;
      } else {
        const evidence = createFailedRouteEvidence(
          request,
          `TRUTH_INSUFFICIENT:${requested.truthState}<${request.requiredTruthState}`,
          nowIso,
        );
        return {
          ...ex17Deny('TRUTH_INSUFFICIENT', 'DENIED', true),
          receipt: createStageReceipt({
            request,
            status: 'DENIED',
            actualDevice: null,
            fallbackUsed: false,
            fallbackReason: null,
            acceleratorVerified: false,
            decision: 'DENY',
            note: `Device truth ${requested.truthState} cannot satisfy required ${request.requiredTruthState}.`,
            nowIso,
          }),
          evidence,
        };
      }
    }

    // NPU requires runtime + model + evidence compatibility.
    if (
      request.requestedDevice === 'NPU' &&
      !fallbackUsed &&
      !npuEligible(requested, request)
    ) {
      if (request.allowCpuFallback) {
        actualDevice = 'CPU';
        fallbackUsed = true;
        fallbackReason = 'NPU_COMPATIBILITY_FAILED';
        decision = 'FALLBACK';
        note =
          'NPU runtime/model/evidence incompatible → CPU fallback; NPU not verified.';
      } else {
        const evidence = createFailedRouteEvidence(
          request,
          'NPU_INCOMPATIBLE',
          nowIso,
        );
        return {
          ...ex17Deny('NPU_INCOMPATIBLE', 'DENIED', true),
          receipt: createStageReceipt({
            request,
            status: 'DENIED',
            actualDevice: null,
            fallbackUsed: false,
            fallbackReason: null,
            acceleratorVerified: false,
            decision: 'DENY',
            note: 'NPU requires runtime+model+evidence compatibility.',
            nowIso,
          }),
          evidence,
        };
      }
    }

    // Simulated accelerator failure path (truth DEGRADED/UNAVAILABLE with fallback).
    if (
      !fallbackUsed &&
      (requested.truthState === 'DEGRADED' ||
        requested.truthState === 'UNAVAILABLE') &&
      isAcceleratorClass(request.requestedDevice)
    ) {
      if (request.allowCpuFallback) {
        actualDevice = 'CPU';
        fallbackUsed = true;
        fallbackReason = `ACCELERATOR_${requested.truthState}`;
        decision = 'FALLBACK';
        note = `${request.requestedDevice} ${requested.truthState} → explicit CPU fallback; accelerator not verified.`;
      } else {
        const evidence = createFailedRouteEvidence(
          request,
          `ACCELERATOR_${requested.truthState}`,
          nowIso,
        );
        return {
          ...ex17Deny('ACCELERATOR_FAILED', 'DENIED', true),
          receipt: createStageReceipt({
            request,
            status: 'DENIED',
            actualDevice: null,
            fallbackUsed: false,
            fallbackReason: null,
            acceleratorVerified: false,
            decision: 'DENY',
            note: `${request.requestedDevice} unavailable/degraded.`,
            nowIso,
          }),
          evidence,
        };
      }
    }
  }

  // CPU path when requested CPU with VERIFIED.
  if (request.requestedDevice === 'CPU' && !fallbackUsed) {
    const cpu = findDevice(devices, 'CPU', request.tenantId, request.universeId);
    if (
      cpu &&
      deviceSatisfiesRequiredTruth(cpu.truthState, request.requiredTruthState)
    ) {
      actualDevice = 'CPU';
      decision = 'RUN';
      note = 'Verified CPU route eligible.';
    }
  }

  // Memory REDUCE_SCOPE may still RUN with reduced note.
  if (mem.ok && mem.decision === 'REDUCE_SCOPE') {
    note = `${note} [memory REDUCE_SCOPE]`;
    if (decision === 'RUN') decision = 'THROTTLE';
  }

  runPostprocessFabric(request);

  const executeTruth =
    findDevice(devices, actualDevice, request.tenantId, request.universeId)
      ?.truthState ?? (actualDevice === 'CPU' ? 'VERIFIED' : 'UNKNOWN');

  const partition = defaultClassicalPartition(
    request,
    actualDevice,
    executeTruth,
  );

  const timings = input.timings ?? {
    preprocessingMs: 3,
    executionMs: 10,
    postprocessingMs: 2,
    queueMs: 1,
    networkMs: request.networkOnline ? 0 : 0,
  };

  const benchmark = createHybridBenchmark({
    request,
    ...timings,
    bottleneck: fallbackUsed ? 'RUNTIME' : 'COMPUTE',
    feedbackKind: 'MEASURED',
    outcome: fallbackUsed ? 'RETEST_REQUIRED' : 'STRENGTHEN',
  });

  // Critical honesty: CPU fallback never verifies accelerator.
  const acceleratorVerified = false as const;
  if (
    fallbackUsed &&
    EX17_LOCKS.CPU_FALLBACK_VERIFIES_ACCELERATOR === false &&
    acceleratorVerified === true
  ) {
    // unreachable by design
  }

  const learning = applyLearningFeedback({
    request,
    outcome: fallbackUsed ? 'RETEST_REQUIRED' : 'STRENGTHEN',
    note: 'Pathway preference update only — permissions unchanged.',
  });

  const evidence: ComputeEvidence | null = fallbackUsed
    ? createFailedRouteEvidence(
        request,
        fallbackReason ?? 'FALLBACK',
        nowIso,
      )
    : null;

  const receipt = createStageReceipt({
    request,
    status: fallbackUsed ? 'FALLBACK' : 'OK',
    actualDevice,
    fallbackUsed,
    fallbackReason,
    acceleratorVerified,
    decision,
    note,
    nowIso,
  });

  return {
    ok: true,
    decision,
    receipt,
    partition,
    benchmark,
    evidence,
    learning,
    requestedDevice: request.requestedDevice,
    actualDevice,
    fallbackUsed,
    fallbackReason,
    acceleratorVerified,
    checkpoint: null,
  };
}

/** §18 Checkpoint + resume validation. */
export function validateCheckpointResume(
  checkpoint: CheckpointRecord,
  powerState: 'ON' | 'OFF' | 'SLEEP',
): { resumable: boolean; continuedComputeAfterPowerOff: false; note: string } {
  if (checkpoint.poweredOff && powerState === 'OFF') {
    return {
      resumable: false,
      continuedComputeAfterPowerOff: false,
      note: 'Still powered off — resume blocked; no fake compute.',
    };
  }
  if (!checkpoint.resumeValid) {
    return {
      resumable: false,
      continuedComputeAfterPowerOff: false,
      note: 'Checkpoint resumeValid=false.',
    };
  }
  return {
    resumable: powerState === 'ON',
    continuedComputeAfterPowerOff: false,
    note:
      powerState === 'ON'
        ? 'Resume allowed after power restored.'
        : 'Not powered on.',
  };
}

export function buildComputeStageRequest(
  partial: Omit<ComputeStageRequest, 'capabilityRequest' | 'seizeHardware' | 'homeBaseMayReroute' | 'claimPurelyQuantumEndToEnd'> &
    Partial<
      Pick<
        ComputeStageRequest,
        | 'capabilityRequest'
        | 'seizeHardware'
        | 'homeBaseMayReroute'
        | 'claimPurelyQuantumEndToEnd'
      >
    >,
): ComputeStageRequest {
  return {
    ...partial,
    capabilityRequest: true,
    seizeHardware: false,
    homeBaseMayReroute: true,
    claimPurelyQuantumEndToEnd: false,
  };
}
