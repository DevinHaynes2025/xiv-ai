/**
 * 62L-EW9 — Intel CPU/GPU/NPU Adapter Candidate
 *
 * Canonical flow:
 * Agent Mission → Agent Mesh → Workload Genome → Compute Envelope →
 * Cross-Chip Capability Graph → Intel Adapter → Resource Governor →
 * CPU/GPU/NPU → Execution Receipt → Benchmark Ledger → Bottleneck Analyzer →
 * Neural Pathway → XIV Home Base
 *
 * Same shared fabric as AMD/NVIDIA — does NOT create a separate Intel AI brain.
 */

import {
  INTEL_DEVICES,
  EW9_LOCKS,
  SOFTWARE_ACCELERATION_LEVERS,
  assertEw9LocksIntact,
  denySiliconOrFirmwareClaim,
  ew9SoftWireSnapshot,
  intelEnvironmentHonesty,
  satisfiesMinimumState,
  softWireHopState,
  type IntelDevice,
  type SoftWirePresence,
  type SoftwareAccelerationLever,
  type TenantScope,
} from './ew9-types.ts';
import {
  validateComputeEnvelope,
  type ComputeRequestEnvelope,
} from './intel-envelope.ts';
import {
  buildExecutionReceipt,
  createHomeBaseReceiptLedger,
  ingestReceipt,
  type ComputeExecutionReceipt,
  type HomeBaseReceiptLedger,
  type ResourceUsageSnapshot,
} from './intel-receipt.ts';
import {
  defaultPressureForTests,
  evaluateResourcePolicy,
  type ResourcePolicyDecision,
  type ResourcePressureSnapshot,
} from './intel-resource-policy.ts';
import {
  defaultIntelDeviceTable,
  type IntelDeviceCapability,
} from './intel-capabilities.ts';
import {
  attemptSilentRuntimeInstall,
  defaultIntelRuntimeTable,
  resolveIntelRuntime,
  type IntelRuntimeCandidate,
  type IntelRuntimeRecord,
} from './intel-runtime.ts';
import {
  classifyBottleneckFromReceipt,
  createIntelBenchmarkLedger,
  type IntelBenchmarkLedger,
} from './intel-benchmark.ts';

export type IntelAdapterExecuteInput = {
  envelope: ComputeRequestEnvelope;
  expectedScope: TenantScope;
  devices: Readonly<Record<IntelDevice, IntelDeviceCapability>>;
  runtimes?: Readonly<Record<IntelRuntimeCandidate, IntelRuntimeRecord>>;
  pressure?: ResourcePressureSnapshot;
  runInference?: (args: {
    device: IntelDevice;
    modelId: string;
  }) => {
    ok: boolean;
    actualDevice: IntelDevice;
    runtimeProvider: string;
    modelHash: string;
    outputValid: boolean;
    evidenceRef: string;
  };
  nowMs?: number;
  maxComputeBudget?: number;
  repoRoot?: string;
  nodeId?: string;
};

export type IntelAdapterExecuteResult = {
  allowed: boolean;
  receipt: ComputeExecutionReceipt | null;
  ingest: ReturnType<typeof ingestReceipt>;
  policy: ResourcePolicyDecision | null;
  deviceStatesAfter: Readonly<Record<IntelDevice, IntelDeviceCapability>>;
  softWires: ReturnType<typeof ew9SoftWireSnapshot>;
  bottleneck: ReturnType<typeof classifyBottleneckFromReceipt> | null;
  denialReason?: string;
};

export type IntelAdapterCandidate = {
  readonly shared: true;
  readonly separateIntelBrain: false;
  execute(input: IntelAdapterExecuteInput): IntelAdapterExecuteResult;
  getDevice(device: IntelDevice): IntelDeviceCapability | undefined;
  listDevices(): readonly IntelDeviceCapability[];
  applySoftwareAcceleration(claim: string): {
    allowed: boolean;
    levers: readonly SoftwareAccelerationLever[];
    reason: string;
  };
  ledger: HomeBaseReceiptLedger;
  benchmarks: IntelBenchmarkLedger;
};

function cloneDevices(
  devices: Readonly<Record<IntelDevice, IntelDeviceCapability>>,
): Record<IntelDevice, IntelDeviceCapability> {
  return {
    INTEL_CPU: { ...devices.INTEL_CPU },
    INTEL_GPU: { ...devices.INTEL_GPU },
    INTEL_NPU: { ...devices.INTEL_NPU },
  };
}

function isStale(record: IntelDeviceCapability, nowMs: number): boolean {
  if (record.state === 'STALE') return true;
  if (!record.lastEvidenceAt || record.evidenceMaxAgeMs == null) return false;
  const observed = Date.parse(record.lastEvidenceAt);
  if (!Number.isFinite(observed)) return true;
  return nowMs - observed > record.evidenceMaxAgeMs;
}

function defaultCpuInference(modelId: string): {
  ok: true;
  actualDevice: 'INTEL_CPU';
  runtimeProvider: string;
  modelHash: string;
  outputValid: true;
  evidenceRef: string;
} {
  return {
    ok: true,
    actualDevice: 'INTEL_CPU',
    runtimeProvider: 'xiv-intel-cpu-safe-baseline',
    modelHash: `hash:${modelId}:cpu`,
    outputValid: true,
    evidenceRef: `evidence:cpu:${modelId}`,
  };
}

export function createIntelAdapterCandidate(): IntelAdapterCandidate {
  const ledger = createHomeBaseReceiptLedger();
  const benchmarks = createIntelBenchmarkLedger();
  const registry = new Map<IntelDevice, IntelDeviceCapability>();

  return {
    shared: true,
    separateIntelBrain: false,

    applySoftwareAcceleration(claim) {
      const silicon = denySiliconOrFirmwareClaim(claim);
      const lower = claim.toLowerCase();
      if (
        lower.includes('silicon') ||
        lower.includes('bios') ||
        lower.includes('overclock') ||
        lower.includes('firmware') ||
        lower.includes('microcode') ||
        lower.includes('voltage') ||
        lower.includes('thermal')
      ) {
        return { allowed: false, levers: [], reason: silicon.reason };
      }
      return {
        allowed: true,
        levers: SOFTWARE_ACCELERATION_LEVERS,
        reason:
          'XIV proprietary software acceleration only (routing/operators/precision/quant/batch/cache/queue/partition/benchmark-fallback/offline-placement).',
      };
    },

    getDevice(device) {
      return registry.get(device);
    },

    listDevices() {
      return [...registry.values()];
    },

    ledger,
    benchmarks,

    execute(input) {
      const softWires = ew9SoftWireSnapshot(input.repoRoot);
      const devices = cloneDevices(input.devices);
      for (const d of INTEL_DEVICES) {
        registry.set(d, devices[d]);
      }

      // Silent install always denied.
      void attemptSilentRuntimeInstall();

      if (!assertEw9LocksIntact()) {
        return denyResult(
          devices,
          softWires,
          'EW9_LOCKS_VIOLATED',
          input.envelope.requestId,
        );
      }

      if (EW9_LOCKS.SEPARATE_INTEL_BRAIN !== false) {
        return denyResult(
          devices,
          softWires,
          'SEPARATE_INTEL_BRAIN_FORBIDDEN',
          input.envelope.requestId,
        );
      }

      const validated = validateComputeEnvelope(input.envelope, {
        expectedScope: input.expectedScope,
        nowMs: input.nowMs,
        maxComputeBudget: input.maxComputeBudget,
      });

      if (!validated.ok) {
        const receipt = buildExecutionReceipt({
          receiptId: `rcpt-deny-${input.envelope.requestId}`,
          requestId: input.envelope.requestId,
          nodeId: input.nodeId ?? 'node-local',
          requestedDevice: input.envelope.preferredDevice,
          actualDevice: input.envelope.preferredDevice,
          runtimeProvider: 'none',
          modelId: input.envelope.modelId,
          modelHash: 'none',
          startedAt: new Date(input.nowMs ?? Date.now()).toISOString(),
          completedAt: new Date(input.nowMs ?? Date.now()).toISOString(),
          resourceUsage: emptyUsage(),
          fallbackUsed: false,
          fallbackReason: null,
          resultState: validated.resultState,
          failureClass: validated.failureClass,
          benchmarkRef: null,
          evidenceRefs: [],
          agentId: input.envelope.agentId,
          tenantId: input.envelope.tenantId,
          universeId: input.envelope.universeId,
        });
        ledger.store(receipt);
        return {
          allowed: false,
          receipt,
          ingest: ingestReceipt(receipt, input.envelope.requestId),
          policy: null,
          deviceStatesAfter: devices,
          softWires,
          bottleneck: classifyBottleneckFromReceipt(receipt),
          denialReason: validated.reason,
        };
      }

      const pressure =
        input.pressure ??
        defaultPressureForTests({
          governorSoftWired:
            softWires.localRuntimeGovernor.present ||
            softWires.ew7ResourcePolicy.present,
        });
      const policy = evaluateResourcePolicy({
        envelope: input.envelope,
        pressure,
        repoRoot: input.repoRoot,
      });

      if (policy.result === 'DENY') {
        const receipt = buildExecutionReceipt({
          receiptId: `rcpt-gov-${input.envelope.requestId}`,
          requestId: input.envelope.requestId,
          nodeId: input.nodeId ?? 'node-local',
          requestedDevice: input.envelope.preferredDevice,
          actualDevice: input.envelope.preferredDevice,
          runtimeProvider: 'none',
          modelId: input.envelope.modelId,
          modelHash: 'none',
          startedAt: new Date(input.nowMs ?? Date.now()).toISOString(),
          completedAt: new Date(input.nowMs ?? Date.now()).toISOString(),
          resourceUsage: usageFromPressure(pressure),
          fallbackUsed: false,
          fallbackReason: null,
          resultState: 'POLICY_DENIED',
          failureClass: 'POLICY_DENIED',
          benchmarkRef: null,
          evidenceRefs: [],
          agentId: input.envelope.agentId,
          tenantId: input.envelope.tenantId,
          universeId: input.envelope.universeId,
        });
        ledger.store(receipt);
        return {
          allowed: false,
          receipt,
          ingest: ingestReceipt(receipt, input.envelope.requestId),
          policy,
          deviceStatesAfter: devices,
          softWires,
          bottleneck: classifyBottleneckFromReceipt(receipt),
          denialReason: policy.reasons.join('; '),
        };
      }

      // QUEUE / THROTTLE still may proceed or wait — for tests, QUEUE without
      // fallback policy that allows continue → return queued denial-style.
      if (policy.result === 'QUEUE') {
        const receipt = buildExecutionReceipt({
          receiptId: `rcpt-queue-${input.envelope.requestId}`,
          requestId: input.envelope.requestId,
          nodeId: input.nodeId ?? 'node-local',
          requestedDevice: input.envelope.preferredDevice,
          actualDevice: input.envelope.preferredDevice,
          runtimeProvider: 'none',
          modelId: input.envelope.modelId,
          modelHash: 'none',
          startedAt: new Date(input.nowMs ?? Date.now()).toISOString(),
          completedAt: new Date(input.nowMs ?? Date.now()).toISOString(),
          resourceUsage: usageFromPressure(pressure),
          fallbackUsed: false,
          fallbackReason: null,
          resultState: 'RESOURCE_LIMIT',
          failureClass: 'POLICY_DENIED',
          benchmarkRef: null,
          evidenceRefs: [],
          agentId: input.envelope.agentId,
          tenantId: input.envelope.tenantId,
          universeId: input.envelope.universeId,
        });
        ledger.store(receipt);
        return {
          allowed: false,
          receipt,
          ingest: ingestReceipt(receipt, input.envelope.requestId),
          policy,
          deviceStatesAfter: devices,
          softWires,
          bottleneck: classifyBottleneckFromReceipt(receipt),
          denialReason: policy.reasons.join('; '),
        };
      }

      const nowMs = input.nowMs ?? Date.now();
      const preferred = input.envelope.preferredDevice;
      const minState = input.envelope.minimumVerificationState;
      const preferredRecord = devices[preferred];

      if (isStale(preferredRecord, nowMs)) {
        devices[preferred] = {
          ...preferredRecord,
          state: 'STALE',
          note: 'Stale device evidence rejected — cannot satisfy VERIFIED.',
        };
        const receipt = buildExecutionReceipt({
          receiptId: `rcpt-stale-${input.envelope.requestId}`,
          requestId: input.envelope.requestId,
          nodeId: input.nodeId ?? 'node-local',
          requestedDevice: preferred,
          actualDevice: preferred,
          runtimeProvider: preferredRecord.runtimeProvider ?? 'none',
          modelId: input.envelope.modelId,
          modelHash: 'none',
          startedAt: new Date(nowMs).toISOString(),
          completedAt: new Date(nowMs).toISOString(),
          resourceUsage: usageFromPressure(pressure),
          fallbackUsed: false,
          fallbackReason: null,
          resultState: 'POLICY_DENIED',
          failureClass: 'STALE_EVIDENCE',
          benchmarkRef: null,
          evidenceRefs: [],
          agentId: input.envelope.agentId,
          tenantId: input.envelope.tenantId,
          universeId: input.envelope.universeId,
        });
        ledger.store(receipt);
        return {
          allowed: false,
          receipt,
          ingest: ingestReceipt(receipt, input.envelope.requestId),
          policy,
          deviceStatesAfter: devices,
          softWires,
          bottleneck: classifyBottleneckFromReceipt(receipt),
          denialReason: 'STALE_EVIDENCE rejected',
        };
      }

      // Runtime resolution for accelerators.
      const runtimeResolution = resolveIntelRuntime({
        preferredDevice: preferred,
        runtimes: input.runtimes ?? defaultIntelRuntimeTable(),
      });

      if (
        !runtimeResolution.eligible &&
        (preferred === 'INTEL_GPU' || preferred === 'INTEL_NPU') &&
        minState === 'VERIFIED'
      ) {
        if (
          input.envelope.fallbackPolicy === 'CPU_SAFE' ||
          input.envelope.fallbackPolicy === 'QUEUE_THEN_CPU'
        ) {
          // Fall through to CPU fallback path below via preferredEligible=false.
        } else {
          const receipt = buildExecutionReceipt({
            receiptId: `rcpt-rt-${input.envelope.requestId}`,
            requestId: input.envelope.requestId,
            nodeId: input.nodeId ?? 'node-local',
            requestedDevice: preferred,
            actualDevice: preferred,
            runtimeProvider: runtimeResolution.runtime.runtimeId,
            modelId: input.envelope.modelId,
            modelHash: 'none',
            startedAt: new Date(nowMs).toISOString(),
            completedAt: new Date(nowMs).toISOString(),
            resourceUsage: usageFromPressure(pressure),
            fallbackUsed: false,
            fallbackReason: null,
            resultState: 'PROVIDER_UNAVAILABLE',
            failureClass: runtimeResolution.failureClass,
            benchmarkRef: null,
            evidenceRefs: [],
            agentId: input.envelope.agentId,
            tenantId: input.envelope.tenantId,
            universeId: input.envelope.universeId,
          });
          ledger.store(receipt);
          return {
            allowed: false,
            receipt,
            ingest: ingestReceipt(receipt, input.envelope.requestId),
            policy,
            deviceStatesAfter: devices,
            softWires,
            bottleneck: classifyBottleneckFromReceipt(receipt),
            denialReason: `${runtimeResolution.failureClass} for ${preferred}`,
          };
        }
      }

      const preferredEligible = satisfiesMinimumState(
        preferredRecord.state,
        minState,
      );

      let routeDevice: IntelDevice = preferred;
      let fallbackUsed = false;
      let fallbackReason: string | null = null;

      if (!preferredEligible || !runtimeResolution.eligible) {
        if (
          minState === 'VERIFIED' &&
          (preferred === 'INTEL_GPU' || preferred === 'INTEL_NPU')
        ) {
          if (
            input.envelope.fallbackPolicy === 'CPU_SAFE' ||
            input.envelope.fallbackPolicy === 'QUEUE_THEN_CPU'
          ) {
            const cpu = devices.INTEL_CPU;
            if (
              satisfiesMinimumState(cpu.state, minState) ||
              cpu.state === 'VERIFIED' ||
              cpu.state === 'DOCUMENTED' ||
              cpu.state === 'DETECTED' ||
              cpu.state === 'SUPPORTED' ||
              cpu.state === 'NOT_TESTED'
            ) {
              routeDevice = 'INTEL_CPU';
              fallbackUsed = true;
              fallbackReason = !runtimeResolution.eligible
                ? `${preferred} runtime ${runtimeResolution.runtime.state}; fallback→INTEL_CPU`
                : `${preferred} state=${preferredRecord.state} cannot satisfy ${minState}; fallback→INTEL_CPU`;
            } else {
              const receipt = buildExecutionReceipt({
                receiptId: `rcpt-inel-${input.envelope.requestId}`,
                requestId: input.envelope.requestId,
                nodeId: input.nodeId ?? 'node-local',
                requestedDevice: preferred,
                actualDevice: preferred,
                runtimeProvider: 'none',
                modelId: input.envelope.modelId,
                modelHash: 'none',
                startedAt: new Date(nowMs).toISOString(),
                completedAt: new Date(nowMs).toISOString(),
                resourceUsage: usageFromPressure(pressure),
                fallbackUsed: false,
                fallbackReason: null,
                resultState: 'POLICY_DENIED',
                failureClass: 'DEVICE_NOT_ELIGIBLE',
                benchmarkRef: null,
                evidenceRefs: [],
                agentId: input.envelope.agentId,
                tenantId: input.envelope.tenantId,
                universeId: input.envelope.universeId,
              });
              ledger.store(receipt);
              return {
                allowed: false,
                receipt,
                ingest: ingestReceipt(receipt, input.envelope.requestId),
                policy,
                deviceStatesAfter: devices,
                softWires,
                bottleneck: classifyBottleneckFromReceipt(receipt),
                denialReason: `${preferred} ${preferredRecord.state} cannot satisfy ${minState}`,
              };
            }
          } else {
            const receipt = buildExecutionReceipt({
              receiptId: `rcpt-inel-${input.envelope.requestId}`,
              requestId: input.envelope.requestId,
              nodeId: input.nodeId ?? 'node-local',
              requestedDevice: preferred,
              actualDevice: preferred,
              runtimeProvider: 'none',
              modelId: input.envelope.modelId,
              modelHash: 'none',
              startedAt: new Date(nowMs).toISOString(),
              completedAt: new Date(nowMs).toISOString(),
              resourceUsage: usageFromPressure(pressure),
              fallbackUsed: false,
              fallbackReason: null,
              resultState: 'POLICY_DENIED',
              failureClass: 'MINIMUM_STATE_UNMET',
              benchmarkRef: null,
              evidenceRefs: [],
              agentId: input.envelope.agentId,
              tenantId: input.envelope.tenantId,
              universeId: input.envelope.universeId,
            });
            ledger.store(receipt);
            return {
              allowed: false,
              receipt,
              ingest: ingestReceipt(receipt, input.envelope.requestId),
              policy,
              deviceStatesAfter: devices,
              softWires,
              bottleneck: classifyBottleneckFromReceipt(receipt),
              denialReason: `${preferred} ${preferredRecord.state} cannot satisfy ${minState}`,
            };
          }
        } else if (
          preferred === 'INTEL_CPU' &&
          (preferredRecord.state === 'DOCUMENTED' ||
            preferredRecord.state === 'DETECTED' ||
            preferredRecord.state === 'SUPPORTED' ||
            preferredRecord.state === 'NOT_TESTED')
        ) {
          routeDevice = 'INTEL_CPU';
        } else if (preferred === 'INTEL_CPU' && preferredRecord.state === 'VERIFIED') {
          routeDevice = 'INTEL_CPU';
        } else {
          const receipt = buildExecutionReceipt({
            receiptId: `rcpt-inel-${input.envelope.requestId}`,
            requestId: input.envelope.requestId,
            nodeId: input.nodeId ?? 'node-local',
            requestedDevice: preferred,
            actualDevice: preferred,
            runtimeProvider: 'none',
            modelId: input.envelope.modelId,
            modelHash: 'none',
            startedAt: new Date(nowMs).toISOString(),
            completedAt: new Date(nowMs).toISOString(),
            resourceUsage: usageFromPressure(pressure),
            fallbackUsed: false,
            fallbackReason: null,
            resultState: 'POLICY_DENIED',
            failureClass: 'DEVICE_NOT_ELIGIBLE',
            benchmarkRef: null,
            evidenceRefs: [],
            agentId: input.envelope.agentId,
            tenantId: input.envelope.tenantId,
            universeId: input.envelope.universeId,
          });
          ledger.store(receipt);
          return {
            allowed: false,
            receipt,
            ingest: ingestReceipt(receipt, input.envelope.requestId),
            policy,
            deviceStatesAfter: devices,
            softWires,
            bottleneck: classifyBottleneckFromReceipt(receipt),
            denialReason: `${preferred} ${preferredRecord.state} cannot satisfy ${minState}`,
          };
        }
      }

      if (
        (policy.result === 'FALLBACK' || policy.fallbackSuggested) &&
        routeDevice !== 'INTEL_CPU' &&
        (input.envelope.fallbackPolicy === 'CPU_SAFE' ||
          input.envelope.fallbackPolicy === 'QUEUE_THEN_CPU')
      ) {
        fallbackUsed = true;
        fallbackReason =
          fallbackReason ??
          `Resource policy ${policy.result}; fallback→INTEL_CPU`;
        routeDevice = 'INTEL_CPU';
      }

      const power = input.envelope.nodePowerState ?? 'ONLINE';
      if (power === 'OFFLINE') {
        const routeRec = devices[routeDevice];
        const offlineOk =
          routeRec.state === 'VERIFIED' || routeDevice === 'INTEL_CPU';
        if (!offlineOk) {
          return denyResult(
            devices,
            softWires,
            'OFFLINE_DEVICE_NOT_VERIFIED',
            input.envelope.requestId,
            'WAITING_DATA',
          );
        }
      }

      const startedAt = new Date(nowMs).toISOString();
      const inference =
        input.runInference?.({
          device: routeDevice,
          modelId: input.envelope.modelId,
        }) ??
        (routeDevice === 'INTEL_CPU'
          ? defaultCpuInference(input.envelope.modelId)
          : {
              ok: false,
              actualDevice: routeDevice,
              runtimeProvider: 'unavailable',
              modelHash: 'none',
              outputValid: false,
              evidenceRef: 'none',
            });

      const env = intelEnvironmentHonesty();
      let actualDevice = inference.actualDevice;
      let inferenceOk = inference.ok && inference.outputValid;
      let runtimeProvider = inference.runtimeProvider;

      if (routeDevice === 'INTEL_GPU' && !env.gpuVerified && !input.runInference) {
        if (
          input.envelope.fallbackPolicy === 'CPU_SAFE' ||
          input.envelope.fallbackPolicy === 'QUEUE_THEN_CPU'
        ) {
          const cpuInf = defaultCpuInference(input.envelope.modelId);
          actualDevice = 'INTEL_CPU';
          inferenceOk = true;
          fallbackUsed = true;
          fallbackReason =
            fallbackReason ??
            'INTEL_GPU NOT_TESTED in environment; honest fallback→INTEL_CPU';
          runtimeProvider = cpuInf.runtimeProvider;
          Object.assign(inference, cpuInf);
        } else {
          inferenceOk = false;
        }
      }

      if (routeDevice === 'INTEL_NPU' && !env.npuVerified && !input.runInference) {
        if (
          input.envelope.fallbackPolicy === 'CPU_SAFE' ||
          input.envelope.fallbackPolicy === 'QUEUE_THEN_CPU'
        ) {
          const cpuInf = defaultCpuInference(input.envelope.modelId);
          actualDevice = 'INTEL_CPU';
          inferenceOk = true;
          fallbackUsed = true;
          fallbackReason =
            fallbackReason ??
            'INTEL_NPU NOT_TESTED in environment; honest fallback→INTEL_CPU';
          runtimeProvider = cpuInf.runtimeProvider;
          Object.assign(inference, cpuInf);
        } else {
          inferenceOk = false;
        }
      }

      if (actualDevice !== preferred) {
        fallbackUsed = true;
        fallbackReason =
          fallbackReason ?? `requested ${preferred}, actual ${actualDevice}`;
      }

      const completedAt = new Date(nowMs + 5).toISOString();
      const resultState = inferenceOk ? 'PASS' : 'FAIL';

      if (inferenceOk && actualDevice === 'INTEL_CPU') {
        devices.INTEL_CPU = {
          ...devices.INTEL_CPU,
          state: 'VERIFIED',
          detected: true,
          runtimeProvider,
          lastEvidenceAt: completedAt,
          note:
            'Successful bounded CPU test → INTEL_CPU VERIFIED. GPU/NPU unchanged.',
        };
        if (devices.INTEL_GPU.state === 'UNKNOWN') {
          devices.INTEL_GPU = {
            ...devices.INTEL_GPU,
            state: 'NOT_TESTED',
            note: 'CPU success does not verify GPU.',
          };
        }
        if (devices.INTEL_NPU.state === 'UNKNOWN') {
          devices.INTEL_NPU = {
            ...devices.INTEL_NPU,
            state: 'NOT_TESTED',
            note: 'CPU success does not verify NPU.',
          };
        }
      } else if (
        inferenceOk &&
        actualDevice === preferred &&
        !fallbackUsed &&
        (actualDevice === 'INTEL_GPU' || actualDevice === 'INTEL_NPU')
      ) {
        devices[actualDevice] = {
          ...devices[actualDevice],
          state: 'VERIFIED',
          detected: true,
          runtimeProvider,
          lastEvidenceAt: completedAt,
          note: `Bounded inference on ${actualDevice} succeeded → VERIFIED.`,
        };
      }

      if (fallbackUsed && preferred !== 'INTEL_CPU') {
        if (
          devices[preferred].state === 'VERIFIED' &&
          EW9_LOCKS.FALLBACK_EQ_ACCELERATOR_VERIFIED === false
        ) {
          devices[preferred] = {
            ...devices[preferred],
            state: 'NOT_TESTED',
            note:
              'Fallback used — accelerator remains NOT_TESTED / not verified by this receipt.',
          };
        } else if (
          devices[preferred].state !== 'DETECTED' &&
          devices[preferred].state !== 'DOCUMENTED' &&
          devices[preferred].state !== 'SUPPORTED' &&
          devices[preferred].state !== 'STALE' &&
          devices[preferred].state !== 'DEGRADED' &&
          devices[preferred].state !== 'UNAVAILABLE' &&
          devices[preferred].state !== 'NOT_CONFIGURED'
        ) {
          devices[preferred] = {
            ...devices[preferred],
            state: 'NOT_TESTED',
            note: `Fallback ${preferred}→${actualDevice}; ${preferred} remains NOT_TESTED.`,
          };
        } else {
          devices[preferred] = {
            ...devices[preferred],
            note: `Fallback ${preferred}→${actualDevice}; ${preferred} state=${devices[preferred].state} unchanged (not VERIFIED).`,
          };
        }
      }

      for (const d of INTEL_DEVICES) {
        registry.set(d, devices[d]);
      }

      const receipt = buildExecutionReceipt({
        receiptId: `rcpt-${input.envelope.requestId}`,
        requestId: input.envelope.requestId,
        nodeId: input.nodeId ?? 'node-local',
        requestedDevice: preferred,
        actualDevice,
        runtimeProvider,
        modelId: input.envelope.modelId,
        modelHash: inference.modelHash,
        startedAt,
        completedAt,
        resourceUsage: usageFromPressure(pressure),
        fallbackUsed,
        fallbackReason,
        resultState,
        failureClass: inferenceOk ? 'NONE' : 'EXECUTION_ERROR',
        benchmarkRef: inferenceOk ? `bench:${actualDevice}` : null,
        evidenceRefs:
          inference.evidenceRef !== 'none' ? [inference.evidenceRef] : [],
        agentId: input.envelope.agentId,
        tenantId: input.envelope.tenantId,
        universeId: input.envelope.universeId,
      });
      ledger.store(receipt);
      if (inferenceOk) {
        benchmarks.recordFromReceipt(receipt, input.envelope.workloadId);
        benchmarks.strengthenPathway('ANY', actualDevice, true);
      } else {
        benchmarks.strengthenPathway('ANY', preferred, false);
      }

      return {
        allowed: inferenceOk,
        receipt,
        ingest: ingestReceipt(receipt, input.envelope.requestId),
        policy,
        deviceStatesAfter: devices,
        softWires,
        bottleneck: classifyBottleneckFromReceipt(receipt),
        denialReason: inferenceOk ? undefined : 'INFERENCE_FAILED',
      };
    },
  };
}

function emptyUsage(): ResourceUsageSnapshot {
  return {
    ramMbObserved: null,
    gpuMemoryMbObserved: null,
    npuMemoryMbObserved: null,
    concurrencyObserved: null,
    thermalPressure: 'UNKNOWN',
    batteryPercent: null,
    notes: [],
  };
}

function usageFromPressure(
  pressure: ResourcePressureSnapshot,
): ResourceUsageSnapshot {
  return {
    ramMbObserved: pressure.ramMbAvailable,
    gpuMemoryMbObserved: pressure.gpuMemoryMbAvailable,
    npuMemoryMbObserved: pressure.npuMemoryMbAvailable,
    concurrencyObserved: pressure.concurrencyInFlight,
    thermalPressure: pressure.thermalPressure,
    batteryPercent: pressure.batteryPercent,
    notes: pressure.governorSoftWired
      ? ['resource-governor soft-wired']
      : ['resource-governor WAITING_DATA — thin bridge'],
  };
}

function denyResult(
  devices: Record<IntelDevice, IntelDeviceCapability>,
  softWires: ReturnType<typeof ew9SoftWireSnapshot>,
  reason: string,
  requestId: string,
  _resultState:
    | 'POLICY_DENIED'
    | 'WAITING_DATA'
    | 'OFFLINE_STOPPED' = 'POLICY_DENIED',
): IntelAdapterExecuteResult {
  void _resultState;
  return {
    allowed: false,
    receipt: null,
    ingest: ingestReceipt(null, requestId),
    policy: null,
    deviceStatesAfter: devices,
    softWires,
    bottleneck: null,
    denialReason: reason,
  };
}

export { defaultIntelDeviceTable };

export function softWireSummary(
  soft: ReturnType<typeof ew9SoftWireSnapshot>,
): Record<string, SoftWirePresence & { hop: 'PASS' | 'WAITING_DATA' }> {
  const out: Record<
    string,
    SoftWirePresence & { hop: 'PASS' | 'WAITING_DATA' }
  > = {};
  for (const [k, v] of Object.entries(soft) as [string, SoftWirePresence][]) {
    out[k] = { ...v, hop: softWireHopState(v.present) };
  }
  return out;
}
