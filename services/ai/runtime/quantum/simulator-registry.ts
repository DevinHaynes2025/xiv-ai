/**
 * 62L-EX4 — Local Quantum Simulator Registry.
 *
 * Candidates only after license/repo review. Do not assume third-party
 * simulators installed. VERIFIED only after detect+init+bounded circuit+
 * complete+validate+device+receipt. GPU-exists ≠ accel-exists.
 */

import {
  SIMULATOR_VERIFICATION_LADDER,
  canAdvanceSimulatorLadder,
  type PrecisionMode,
  type RuntimeType,
  type SimulatorClass,
  type SimulatorRegistryEntry,
  type SimulatorState,
  type TenantScope,
} from './types.ts';

const nowIso = (): string => new Date().toISOString();

export type RegistryAdvanceResult =
  | { ok: true; entry: SimulatorRegistryEntry }
  | { ok: false; reason: string; entry: SimulatorRegistryEntry };

export type GpuAccelProof = {
  independentProof: boolean;
  evidenceRefs: readonly string[];
  note: string;
};

/** Seeded XIV-owned local research simulator (CPU state-vector). */
export function createXivCpuStateVectorEntry(
  scope?: TenantScope | null,
): SimulatorRegistryEntry {
  return {
    simulatorId: 'xiv-sv-cpu-v1',
    name: 'XIV Research State-Vector CPU Simulator',
    version: '0.1.0',
    provider: 'XIV',
    runtimeType: 'LOCAL_CPU',
    simulatorClass: 'CUSTOM_XIV_RESEARCH_SIMULATOR',
    supportedPlatforms: ['linux', 'darwin', 'win32'],
    supportedArchitectures: ['x64', 'arm64'],
    supportedDeviceClasses: ['CPU'],
    maxQubitsEvidence: 12,
    supportedGateSet: ['I', 'X', 'Y', 'Z', 'H', 'S', 'T', 'RX', 'RY', 'RZ', 'CX', 'CZ', 'SWAP', 'MEASURE'],
    precisionModes: ['FLOAT64', 'COMPLEX128'],
    noiseModelSupport: false,
    localOnly: true,
    networkRequired: false,
    installState: 'SUPPORTED',
    runtimeState: 'SUPPORTED',
    verificationState: 'SUPPORTED',
    source: 'services/ai/runtime/quantum/simulation.ts',
    license: 'XIV_OWNED',
    sourceHash: 'xiv-sv-cpu-v1-schema',
    lastDetectedAt: nowIso(),
    lastVerifiedAt: null,
    gpuAccelerationVerified: false,
    gpuAccelerationEvidenceRefs: [],
    licenseReviewed: true,
    adapterEnabled: true,
    tenantId: scope?.tenantId ?? null,
    universeId: scope?.universeId ?? null,
  };
}

/** Documented-only third-party candidate — adapter NOT enabled without license review. */
export function createDocumentedThirdPartyCandidate(): SimulatorRegistryEntry {
  return {
    simulatorId: 'thirdparty-sv-documented',
    name: 'Third-Party State Vector (documented only)',
    version: '0.0.0-docs',
    provider: 'THIRD_PARTY_CANDIDATE',
    runtimeType: 'LOCAL_CPU',
    simulatorClass: 'STATE_VECTOR',
    supportedPlatforms: ['linux'],
    supportedArchitectures: ['x64'],
    supportedDeviceClasses: ['CPU'],
    maxQubitsEvidence: 0,
    supportedGateSet: [],
    precisionModes: ['FLOAT64'],
    noiseModelSupport: false,
    localOnly: true,
    networkRequired: false,
    installState: 'DOCUMENTED',
    runtimeState: 'NOT_CONFIGURED',
    verificationState: 'DOCUMENTED',
    source: 'docs-only-candidate',
    license: 'UNREVIEWED',
    sourceHash: 'unreviewed',
    lastDetectedAt: null,
    lastVerifiedAt: null,
    gpuAccelerationVerified: false,
    gpuAccelerationEvidenceRefs: [],
    licenseReviewed: false,
    adapterEnabled: false,
    tenantId: null,
    universeId: null,
  };
}

/** Detected-but-not-verified local binary stub. */
export function createDetectedNotVerifiedEntry(): SimulatorRegistryEntry {
  return {
    simulatorId: 'local-sv-detected',
    name: 'Local SV Binary (detected)',
    version: 'unknown',
    provider: 'LOCAL_SCAN',
    runtimeType: 'LOCAL_CPU',
    simulatorClass: 'STATE_VECTOR',
    supportedPlatforms: ['linux'],
    supportedArchitectures: ['x64'],
    supportedDeviceClasses: ['CPU'],
    maxQubitsEvidence: 0,
    supportedGateSet: ['H', 'CX'],
    precisionModes: ['FLOAT64'],
    noiseModelSupport: false,
    localOnly: true,
    networkRequired: false,
    installState: 'DETECTED',
    runtimeState: 'DETECTED',
    verificationState: 'DETECTED',
    source: 'filesystem-scan',
    license: 'UNKNOWN',
    sourceHash: 'scan-pending',
    lastDetectedAt: nowIso(),
    lastVerifiedAt: null,
    gpuAccelerationVerified: false,
    gpuAccelerationEvidenceRefs: [],
    licenseReviewed: false,
    adapterEnabled: false,
    tenantId: null,
    universeId: null,
  };
}

/** Cloud simulator requiring network — offline → WAITING_PROVIDER. */
export function createCloudSimulatorEntry(): SimulatorRegistryEntry {
  return {
    simulatorId: 'cloud-sim-remote',
    name: 'Cloud Quantum Simulator (network)',
    version: 'cloud-0',
    provider: 'CLOUD_PROVIDER_CANDIDATE',
    runtimeType: 'CLOUD_SIMULATOR',
    simulatorClass: 'SAMPLER',
    supportedPlatforms: ['cloud'],
    supportedArchitectures: ['remote'],
    supportedDeviceClasses: ['CPU'],
    maxQubitsEvidence: 0,
    supportedGateSet: [],
    precisionModes: ['FLOAT32'],
    noiseModelSupport: true,
    localOnly: false,
    networkRequired: true,
    installState: 'DOCUMENTED',
    runtimeState: 'UNAVAILABLE',
    verificationState: 'NOT_TESTED',
    source: 'provider-docs',
    license: 'UNREVIEWED',
    sourceHash: 'cloud-pending',
    lastDetectedAt: null,
    lastVerifiedAt: null,
    gpuAccelerationVerified: false,
    gpuAccelerationEvidenceRefs: [],
    licenseReviewed: false,
    adapterEnabled: false,
    tenantId: null,
    universeId: null,
  };
}

/** Web-docs-required candidate — offline → WAITING_DATA. */
export function createWebRequiredDocsEntry(): SimulatorRegistryEntry {
  return {
    simulatorId: 'web-docs-required',
    name: 'Simulator requiring web documentation fetch',
    version: '0.0.0',
    provider: 'WEB_DEPENDENT',
    runtimeType: 'LOCAL_CPU',
    simulatorClass: 'STATE_VECTOR',
    supportedPlatforms: ['linux'],
    supportedArchitectures: ['x64'],
    supportedDeviceClasses: ['CPU'],
    maxQubitsEvidence: 0,
    supportedGateSet: [],
    precisionModes: ['FLOAT64'],
    noiseModelSupport: false,
    localOnly: false,
    networkRequired: true,
    installState: 'DOCUMENTED',
    runtimeState: 'NOT_CONFIGURED',
    verificationState: 'DOCUMENTED',
    source: 'https://example.invalid/simulator-docs',
    license: 'UNREVIEWED',
    sourceHash: 'needs-web',
    lastDetectedAt: null,
    lastVerifiedAt: null,
    gpuAccelerationVerified: false,
    gpuAccelerationEvidenceRefs: [],
    licenseReviewed: false,
    adapterEnabled: false,
    tenantId: null,
    universeId: null,
  };
}

/** GPU-present entry without independent acceleration proof. */
export function createGpuUnprovenEntry(): SimulatorRegistryEntry {
  return {
    simulatorId: 'xiv-sv-gpu-unproven',
    name: 'XIV SV GPU Candidate (accel unproven)',
    version: '0.1.0-gpu',
    provider: 'XIV',
    runtimeType: 'LOCAL_GPU',
    simulatorClass: 'CUSTOM_XIV_RESEARCH_SIMULATOR',
    supportedPlatforms: ['linux'],
    supportedArchitectures: ['x64'],
    supportedDeviceClasses: ['GPU', 'CPU'],
    maxQubitsEvidence: 12,
    supportedGateSet: ['I', 'X', 'Y', 'Z', 'H', 'S', 'T', 'RX', 'RY', 'RZ', 'CX', 'CZ', 'SWAP', 'MEASURE'],
    precisionModes: ['FLOAT64', 'COMPLEX128'],
    noiseModelSupport: false,
    localOnly: true,
    networkRequired: false,
    installState: 'DETECTED',
    runtimeState: 'DETECTED',
    verificationState: 'DETECTED',
    source: 'services/ai/runtime/quantum/simulation.ts',
    license: 'XIV_OWNED',
    sourceHash: 'xiv-sv-gpu-unproven',
    lastDetectedAt: nowIso(),
    lastVerifiedAt: null,
    gpuAccelerationVerified: false,
    gpuAccelerationEvidenceRefs: [],
    licenseReviewed: true,
    adapterEnabled: true,
    tenantId: null,
    universeId: null,
  };
}

export class SimulatorRegistry {
  private readonly entries = new Map<string, SimulatorRegistryEntry>();

  seedDefaults(scope?: TenantScope | null): void {
    for (const e of [
      createXivCpuStateVectorEntry(scope),
      createDocumentedThirdPartyCandidate(),
      createDetectedNotVerifiedEntry(),
      createCloudSimulatorEntry(),
      createWebRequiredDocsEntry(),
      createGpuUnprovenEntry(),
    ]) {
      this.entries.set(e.simulatorId, e);
    }
  }

  register(entry: SimulatorRegistryEntry): { ok: true } | { ok: false; reason: string } {
    if (
      entry.provider !== 'XIV' &&
      entry.adapterEnabled &&
      !entry.licenseReviewed
    ) {
      return {
        ok: false,
        reason: 'THIRD_PARTY_ADAPTER_WITHOUT_LICENSE_REVIEW',
      };
    }
    this.entries.set(entry.simulatorId, entry);
    return { ok: true };
  }

  get(simulatorId: string): SimulatorRegistryEntry | null {
    return this.entries.get(simulatorId) ?? null;
  }

  list(): readonly SimulatorRegistryEntry[] {
    return [...this.entries.values()];
  }

  listEligibleLocal(opts?: {
    requireVerified?: boolean;
    offlineDisconnected?: boolean;
  }): readonly SimulatorRegistryEntry[] {
    return this.list().filter((e) => {
      if (!e.adapterEnabled) return false;
      if (e.verificationState === 'REVOKED' || e.verificationState === 'UNAVAILABLE') {
        return false;
      }
      if (opts?.offlineDisconnected && e.networkRequired) return false;
      if (opts?.requireVerified && e.verificationState !== 'VERIFIED') return false;
      if (!e.localOnly && opts?.offlineDisconnected) return false;
      return (
        e.verificationState === 'SUPPORTED' ||
        e.verificationState === 'VERIFIED' ||
        e.runtimeState === 'SUPPORTED'
      );
    });
  }

  /**
   * Advance verification ladder one hop only.
   * DOCUMENTED / DETECTED cannot jump to VERIFIED.
   */
  advanceVerification(
    simulatorId: string,
    to: SimulatorState,
    proof?: {
      detected?: boolean;
      initialized?: boolean;
      boundedCircuitCompleted?: boolean;
      validated?: boolean;
      deviceRecorded?: boolean;
      receiptId?: string | null;
    },
  ): RegistryAdvanceResult {
    const entry = this.get(simulatorId);
    if (!entry) {
      return {
        ok: false,
        reason: 'SIMULATOR_NOT_FOUND',
        entry: createXivCpuStateVectorEntry(),
      };
    }

    if (to === 'VERIFIED') {
      const ready =
        proof?.detected === true &&
        proof?.initialized === true &&
        proof?.boundedCircuitCompleted === true &&
        proof?.validated === true &&
        proof?.deviceRecorded === true &&
        Boolean(proof?.receiptId);
      if (!ready) {
        return {
          ok: false,
          reason: 'VERIFIED_REQUIRES_DETECT_INIT_BOUNDED_COMPLETE_VALIDATE_DEVICE_RECEIPT',
          entry,
        };
      }
      if (entry.verificationState !== 'SUPPORTED') {
        return {
          ok: false,
          reason: 'TRUTH_LADDER_SKIP_DENIED',
          entry,
        };
      }
    } else if (!canAdvanceSimulatorLadder(entry.verificationState, to)) {
      return {
        ok: false,
        reason: 'TRUTH_LADDER_SKIP_DENIED',
        entry,
      };
    }

    const next: SimulatorRegistryEntry = {
      ...entry,
      verificationState: to,
      lastVerifiedAt: to === 'VERIFIED' ? nowIso() : entry.lastVerifiedAt,
      lastDetectedAt:
        to === 'DETECTED' || to === 'SUPPORTED' || to === 'VERIFIED'
          ? entry.lastDetectedAt ?? nowIso()
          : entry.lastDetectedAt,
    };
    this.entries.set(simulatorId, next);
    return { ok: true, entry: next };
  }

  /**
   * GPU acceleration requires independent proof.
   * GPU device presence alone never verifies acceleration.
   */
  attachGpuAccelerationProof(
    simulatorId: string,
    proof: GpuAccelProof,
  ): RegistryAdvanceResult {
    const entry = this.get(simulatorId);
    if (!entry) {
      return {
        ok: false,
        reason: 'SIMULATOR_NOT_FOUND',
        entry: createXivCpuStateVectorEntry(),
      };
    }
    if (!proof.independentProof || proof.evidenceRefs.length === 0) {
      return {
        ok: false,
        reason: 'GPU_EXISTS_NE_ACCEL_EXISTS',
        entry,
      };
    }
    const next: SimulatorRegistryEntry = {
      ...entry,
      gpuAccelerationVerified: true,
      gpuAccelerationEvidenceRefs: [...proof.evidenceRefs],
    };
    this.entries.set(simulatorId, next);
    return { ok: true, entry: next };
  }

  markStale(simulatorId: string): RegistryAdvanceResult {
    const entry = this.get(simulatorId);
    if (!entry) {
      return {
        ok: false,
        reason: 'SIMULATOR_NOT_FOUND',
        entry: createXivCpuStateVectorEntry(),
      };
    }
    const next = { ...entry, verificationState: 'STALE' as const, runtimeState: 'STALE' as const };
    this.entries.set(simulatorId, next);
    return { ok: true, entry: next };
  }
}

export function createSimulatorRegistry(
  scope?: TenantScope | null,
): SimulatorRegistry {
  const reg = new SimulatorRegistry();
  reg.seedDefaults(scope);
  return reg;
}

export function isVerifiedEligible(entry: SimulatorRegistryEntry): boolean {
  return entry.verificationState === 'VERIFIED' && entry.adapterEnabled;
}

export function documentedCannotSatisfyVerified(
  entry: SimulatorRegistryEntry,
): boolean {
  return entry.verificationState === 'DOCUMENTED'
    ? false
    : entry.verificationState === 'VERIFIED';
}

export function detectedCannotSatisfyVerified(
  entry: SimulatorRegistryEntry,
): boolean {
  return entry.verificationState === 'DETECTED'
    ? false
    : entry.verificationState === 'VERIFIED';
}

export function ladderHops(): readonly string[] {
  return [...SIMULATOR_VERIFICATION_LADDER];
}

export type { PrecisionMode, RuntimeType, SimulatorClass };
