import { RuntimeFabric, createRuntimeFabric, signRuntimeProof, type ProofPurpose } from '../control-plane';
import type {
  CallerContext,
  DeviceClass,
  ModelRecord,
  NodeSecurityPolicy,
  ResourceBudget,
  Result,
  RuntimeCapabilityRecord,
  TenantScope,
  TrustLevel,
  WorkloadKind,
  WorkloadRequest,
} from '../types';

export const ORG_A: TenantScope = { organizationId: 'org_alpha', universeId: 'universe_alpha' };
export const ORG_B: TenantScope = { organizationId: 'org_beta', universeId: 'universe_beta' };

export const APPROVED_IMAGE = 'xur-runtime:0.1.0-queued';

export function newFabric(): RuntimeFabric {
  let tick = 0;
  return createRuntimeFabric({
    fabricKey: 'test-fabric-key',
    clock: () => new Date(Date.UTC(2026, 0, 1) + tick++ * 1000),
  });
}

export function operator(scope: TenantScope = ORG_A, actorId = 'human_operator_1'): CallerContext {
  return { actorType: 'human_operator', actorId, scope };
}

export function guardian(scope: TenantScope = ORG_A): CallerContext {
  return { actorType: 'guardian', actorId: 'guardian', scope };
}

export function agentCaller(agentId: string, scope: TenantScope = ORG_A): CallerContext {
  return { actorType: 'agent', actorId: agentId, scope, agentId };
}

export function nodeCaller(nodeId: string, scope: TenantScope = ORG_A): CallerContext {
  return { actorType: 'runtime_node', actorId: nodeId, scope, nodeId };
}

export function expectOk<T>(result: Result<T>, label: string): { ok: true } & T {
  if (!result.ok) throw new Error(`${label} was denied: ${result.code} — ${result.message}`);
  return result;
}

export function expectDenied<T>(result: Result<T>, label: string) {
  if (result.ok) throw new Error(`${label} unexpectedly succeeded`);
  return result;
}

/* ------------------------------------------------------------------ */
/* Hardware presets                                                     */
/* ------------------------------------------------------------------ */

type HardwareOverrides = Partial<RuntimeCapabilityRecord>;

function hardware(base: RuntimeCapabilityRecord, overrides: HardwareOverrides = {}): RuntimeCapabilityRecord {
  return { ...base, ...overrides };
}

const SECURE_POSTURE = {
  secureBoot: true,
  diskEncryption: true,
  keystore: 'hardware' as const,
  screenLock: true,
  osPatchState: 'current' as const,
};

export function intelWorkstation(scope = ORG_A, overrides: HardwareOverrides = {}): RuntimeCapabilityRecord {
  return hardware(
    {
      runtimeNode: 'intel-workstation',
      deviceClass: 'workstation',
      architecture: 'x86_64',
      cpuVendor: 'intel',
      cpuFamily: 'xeon-w',
      gpuVendor: 'none',
      gpuFamily: 'none',
      memoryAvailableMb: 65_536,
      storageAvailableMb: 1_048_576,
      networkState: 'online',
      acceleratorSupport: ['cpu_simd'],
      energyState: { source: 'wall', batteryPercent: null, charging: true },
      thermalState: 'nominal',
      securityState: SECURE_POSTURE,
      trustLevel: 'untrusted',
      region: 'eu-north',
      tenantScope: scope,
      runtimeVersion: '0.1.0',
      lastAttestation: null,
    },
    overrides,
  );
}

export function amdWorkstation(scope = ORG_A, overrides: HardwareOverrides = {}): RuntimeCapabilityRecord {
  return hardware(intelWorkstation(scope), {
    runtimeNode: 'amd-workstation',
    cpuVendor: 'amd',
    cpuFamily: 'epyc',
    ...overrides,
  });
}

export function nvidiaGpuHost(scope = ORG_A, overrides: HardwareOverrides = {}): RuntimeCapabilityRecord {
  return hardware(intelWorkstation(scope), {
    runtimeNode: 'nvidia-gpu-host',
    deviceClass: 'cloud_gpu',
    cpuVendor: 'amd',
    cpuFamily: 'epyc',
    gpuVendor: 'nvidia',
    gpuFamily: 'ada',
    memoryAvailableMb: 131_072,
    acceleratorSupport: ['cpu_simd', 'gpu_cuda'],
    region: 'eu-north',
    ...overrides,
  });
}

export function appleLaptop(scope = ORG_A, overrides: HardwareOverrides = {}): RuntimeCapabilityRecord {
  return hardware(intelWorkstation(scope), {
    runtimeNode: 'apple-laptop',
    deviceClass: 'laptop',
    architecture: 'arm64',
    cpuVendor: 'apple',
    cpuFamily: 'm-series',
    gpuVendor: 'apple',
    gpuFamily: 'apple-gpu',
    memoryAvailableMb: 32_768,
    storageAvailableMb: 524_288,
    acceleratorSupport: ['cpu_simd', 'gpu_metal', 'npu'],
    energyState: { source: 'battery', batteryPercent: 88, charging: false },
    securityState: { ...SECURE_POSTURE, keystore: 'secure_enclave' },
    ...overrides,
  });
}

export function iosPhone(scope = ORG_A, overrides: HardwareOverrides = {}): RuntimeCapabilityRecord {
  return hardware(intelWorkstation(scope), {
    runtimeNode: 'ios-phone',
    deviceClass: 'mobile_phone',
    architecture: 'arm64',
    cpuVendor: 'apple',
    cpuFamily: 'a-series',
    gpuVendor: 'apple',
    gpuFamily: 'apple-gpu',
    memoryAvailableMb: 6_144,
    storageAvailableMb: 128_000,
    acceleratorSupport: ['cpu_simd', 'npu'],
    energyState: { source: 'battery', batteryPercent: 62, charging: false },
    securityState: { ...SECURE_POSTURE, keystore: 'secure_enclave' },
    ...overrides,
  });
}

export function androidPhone(scope = ORG_A, overrides: HardwareOverrides = {}): RuntimeCapabilityRecord {
  return hardware(iosPhone(scope), {
    runtimeNode: 'android-phone',
    cpuVendor: 'qualcomm',
    cpuFamily: 'snapdragon',
    gpuVendor: 'qualcomm',
    gpuFamily: 'adreno',
    ...overrides,
  });
}

/* ------------------------------------------------------------------ */
/* Enrollment helpers                                                   */
/* ------------------------------------------------------------------ */

export function proveFor(
  fabric: RuntimeFabric,
  caller: CallerContext,
  nodeId: string,
  secret: string,
  purpose: ProofPurpose,
): { challengeId: string; proof: string } {
  const challenge = expectOk(fabric.issueRuntimeChallenge(caller, { nodeId, purpose }), 'issueRuntimeChallenge');
  return {
    challengeId: challenge.challengeId,
    proof: signRuntimeProof(secret, { nodeId, nonce: challenge.nonce, purpose }),
  };
}

export type EnrollInput = {
  fabric: RuntimeFabric;
  caller?: CallerContext;
  scope?: TenantScope;
  hardware: RuntimeCapabilityRecord;
  nodeType: DeviceClass;
  deviceId?: string;
  allowedWorkloads: readonly WorkloadKind[];
  securityPolicy?: Partial<NodeSecurityPolicy>;
  resourceBudget?: Partial<ResourceBudget>;
  attest?: boolean;
  runtimeImage?: string;
  grantTrust?: TrustLevel;
};

export function enroll(input: EnrollInput): { nodeId: string; secret: string } {
  const scope = input.scope ?? ORG_A;
  const caller = input.caller ?? operator(scope);
  const registration = expectOk(
    input.fabric.registerRuntime(caller, {
      deviceId: input.deviceId ?? `device_${input.hardware.runtimeNode}`,
      nodeType: input.nodeType,
      hardware: input.hardware,
      allowedWorkloads: input.allowedWorkloads,
      securityPolicy: input.securityPolicy,
      resourceBudget: input.resourceBudget,
    }),
    'registerRuntime',
  );

  const nodeId = registration.node.nodeId;
  const secret = registration.nodeSecret;

  if (input.attest !== false) {
    // A node presents its own measurements: only the node holds the secret
    // issued at registration.
    const runtime = nodeCaller(nodeId, scope);
    const proof = proveFor(input.fabric, runtime, nodeId, secret, 'attest');
    expectOk(
      input.fabric.attestRuntime(runtime, {
        nodeId,
        ...proof,
        measurements: { runtime_image: input.runtimeImage ?? APPROVED_IMAGE, boot_chain: 'measured' },
      }),
      'attestRuntime',
    );
  }

  if (input.grantTrust) {
    expectOk(
      input.fabric.grantTrustLevel(caller, {
        nodeId,
        trustLevel: input.grantTrust,
        justification: 'test fixture grant recorded by an operator',
      }),
      'grantTrustLevel',
    );
  }

  return { nodeId, secret };
}

export function proveLanes(fabric: RuntimeFabric, caller: CallerContext, laneIds: readonly string[]): void {
  for (const laneId of laneIds) {
    expectOk(
      fabric.recordVendorValidation(caller, {
        laneId,
        support: 'proven',
        evidence: [`conformance-suite:${laneId}`, 'bounded-kernel-parity'],
      }),
      `recordVendorValidation:${laneId}`,
    );
  }
}

/* ------------------------------------------------------------------ */
/* Workload helpers                                                     */
/* ------------------------------------------------------------------ */

export function analysisWorkload(agentId: string, overrides: Partial<WorkloadRequest> = {}): WorkloadRequest {
  return {
    kind: 'analysis',
    requestedCapability: 'cpu.analysis.medium',
    classification: 'internal',
    dataResidency: ['eu-north'],
    latencyBudgetMs: 5_000,
    estimate: { computeUnits: 12, memoryMb: 2_048, storageMb: 16, tokens: 0, bandwidthMb: 4, runtimeMs: 2_000 },
    consequential: false,
    task: { kernel: 'checksum', input: [3, 14, 15, 92, 65, 35] },
    agentId,
    sourceLabel: 'supply-chain variance extract',
    ...overrides,
  };
}

export function gpuWorkload(agentId: string, overrides: Partial<WorkloadRequest> = {}): WorkloadRequest {
  return analysisWorkload(agentId, {
    kind: 'inference',
    requestedCapability: 'gpu.inference.medium',
    estimate: { computeUnits: 256, memoryMb: 8_192, storageMb: 32, tokens: 4_000, bandwidthMb: 16, runtimeMs: 9_000 },
    task: { kernel: 'vector_sum', input: [10, 20, 30, 40] },
    sourceLabel: 'demand-signal inference',
    ...overrides,
  });
}

export function onDeviceModel(scope: TenantScope = ORG_A, overrides: Partial<ModelRecord> = {}): Omit<ModelRecord, 'evaluationState' | 'availability'> {
  const { evaluationState: _evaluation, availability: _availability, ...rest } = {
    modelId: 'xiv-small-local',
    provider: 'xiv',
    modelFamily: 'xiv-small',
    runtimeType: 'on_device' as const,
    capabilities: ['cpu.analysis.medium', 'cpu.inference.small'],
    contextLimit: 8_000,
    approvedDomains: ['analysis', 'inference', 'agent_evaluation'] as WorkloadKind[],
    securityClassification: 'internal' as const,
    evaluationState: 'unevaluated' as const,
    costProfile: { perThousandTokensUsd: 0, perSecondUsd: 0 },
    hardwareRequirement: { acceleratorSupport: [], minMemoryMb: 2_048 },
    availability: 'unavailable' as const,
    fingerprint: 'sha256:local-weights-v1',
    scope,
    ...overrides,
  };
  return rest;
}

export function gpuModel(scope: TenantScope = ORG_A, overrides: Partial<ModelRecord> = {}): Omit<ModelRecord, 'evaluationState' | 'availability'> {
  return onDeviceModel(scope, {
    modelId: 'xiv-large-gpu',
    modelFamily: 'xiv-large',
    runtimeType: 'local_gpu',
    capabilities: ['gpu.inference.medium', 'gpu.embedding.medium'],
    contextLimit: 128_000,
    approvedDomains: ['inference', 'embedding', 'vision'],
    costProfile: { perThousandTokensUsd: 0.4, perSecondUsd: 0.001 },
    hardwareRequirement: { acceleratorSupport: ['gpu_cuda'], minMemoryMb: 16_384 },
    fingerprint: 'sha256:gpu-weights-v1',
    ...overrides,
  });
}

export function approveModel(
  fabric: RuntimeFabric,
  caller: CallerContext,
  model: Omit<ModelRecord, 'evaluationState' | 'availability'>,
): string {
  const registered = expectOk(fabric.registerModel(caller, model), 'registerModel');
  expectOk(
    fabric.recordModelEvaluation(caller, {
      modelId: registered.model.modelId,
      suite: 'xiv-model-eval-v0',
      passed: true,
      note: 'bounded evaluation for the queued architecture slice',
    }),
    'recordModelEvaluation',
  );
  return registered.model.modelId;
}
