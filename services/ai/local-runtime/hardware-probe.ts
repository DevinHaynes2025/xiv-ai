/**
 * 62L-EL EL2 — Read-only Windows hardware probe contract.
 *
 * Read-only. No stealth persistence. No permission bypass.
 * Privacy-minimal collection — only scheduling-relevant capability metadata.
 */

import os from 'node:os';
import {
  createCapabilityRegistry,
  type CapabilityFlag,
  type CapabilityRegistry,
  type EvidenceState,
  type FlagValue,
  PREFERRED_LOCAL_STACK,
} from './types';
import { redactProbeOutput, type PrivacyMinimalProbeOutput } from './privacy';

export type RawProbeInput = {
  evidence?: Partial<Record<CapabilityFlag, FlagValue>>;
  evidenceNotes?: Partial<Record<CapabilityFlag, string>>;
  platform?: NodeJS.Platform;
  release?: string;
  arch?: string;
  hostname?: string;
  cpuModel?: string;
  cpuVendor?: string;
  logicalCores?: number;
  totalMemoryBytes?: number;
  freeMemoryBytes?: number;
  gpuNames?: string[];
  npuNames?: string[];
  windowsMlHint?: boolean | 'unknown';
  amdEpHint?: boolean | 'unknown';
  machineGuid?: string;
  serialNumber?: string;
  username?: string;
  homeDirectory?: string;
  macAddresses?: string[];
};

export type HardwareProbeRecord = {
  probeId: string;
  capturedAt: string;
  readOnly: true;
  stealthPersistence: false;
  permissionBypass: false;
  preferredStack: typeof PREFERRED_LOCAL_STACK;
  registry: CapabilityRegistry;
  platform: string;
  release: string;
  arch: string;
  logicalCores: number;
  totalMemoryBytes: number;
  freeMemoryBytes: number;
  cpuName?: string;
  cpuVendor?: string;
  gpuNames: string[];
  npuNames: string[];
  notes: string[];
  status: 'ok' | 'unverified' | 'denied';
  state: EvidenceState;
  reason: string;
};

function inferVendor(name: string | undefined): string | undefined {
  if (!name) return undefined;
  const lower = name.toLowerCase();
  if (lower.includes('amd')) return 'AMD';
  if (lower.includes('intel')) return 'Intel';
  if (lower.includes('nvidia')) return 'NVIDIA';
  if (lower.includes('qualcomm')) return 'Qualcomm';
  return undefined;
}

/**
 * Read-only probe. Does not write files, install software, escalate privileges,
 * or inspect user content.
 */
export function runHardwareProbe(input: RawProbeInput = {}): HardwareProbeRecord {
  const platform = input.platform ?? process.platform;
  const release = input.release ?? os.release();
  const arch = input.arch ?? os.arch();
  const cpuModel = input.cpuModel ?? os.cpus()[0]?.model?.trim() ?? 'Unknown CPU';
  const cpuVendor = input.cpuVendor ?? inferVendor(cpuModel);
  const logicalCores = input.logicalCores ?? os.cpus().length;
  const totalMemoryBytes = input.totalMemoryBytes ?? os.totalmem();
  const freeMemoryBytes = input.freeMemoryBytes ?? os.freemem();
  const gpuNames = input.gpuNames ?? [];
  const npuNames = input.npuNames ?? [];

  const flags = createCapabilityRegistry().flags;
  flags.CPU_DETECTED = true;

  if (platform === 'win32') {
    flags.GPU_DETECTED = gpuNames.length > 0 ? true : input.evidence?.GPU_DETECTED ?? 'unknown';
    flags.NPU_DETECTED = npuNames.length > 0 ? true : input.evidence?.NPU_DETECTED ?? 'unknown';
    flags.WINDOWS_ML_SUPPORTED = input.windowsMlHint ?? input.evidence?.WINDOWS_ML_SUPPORTED ?? 'unknown';
    flags.AMD_EP_SUPPORTED = input.amdEpHint ?? input.evidence?.AMD_EP_SUPPORTED ?? 'unknown';
  } else {
    flags.GPU_DETECTED = input.evidence?.GPU_DETECTED ?? (gpuNames.length > 0 ? true : 'unknown');
    flags.NPU_DETECTED = input.evidence?.NPU_DETECTED ?? (npuNames.length > 0 ? true : 'unknown');
    flags.WINDOWS_ML_SUPPORTED = input.evidence?.WINDOWS_ML_SUPPORTED ?? 'unknown';
    flags.AMD_EP_SUPPORTED = input.evidence?.AMD_EP_SUPPORTED ?? 'unknown';
  }

  flags.MODEL_LOAD_VERIFIED = input.evidence?.MODEL_LOAD_VERIFIED === true ? true : false;
  flags.ONNX_LOAD_VERIFIED = input.evidence?.ONNX_LOAD_VERIFIED === true ? true : false;
  flags.WINDOWS_LOCAL_INFERENCE_VERIFIED =
    input.evidence?.WINDOWS_LOCAL_INFERENCE_VERIFIED === true ? true : false;
  flags.AMD_GPU_ACCELERATION_VERIFIED =
    input.evidence?.AMD_GPU_ACCELERATION_VERIFIED === true ? true : false;
  flags.AMD_NPU_ACCELERATION_VERIFIED =
    input.evidence?.AMD_NPU_ACCELERATION_VERIFIED === true ? true : false;
  flags.ASUS_HARDWARE_MODEL_VERIFIED =
    input.evidence?.ASUS_HARDWARE_MODEL_VERIFIED === true ? true : false;
  flags.OFFLINE_AGENTS_VERIFIED = input.evidence?.OFFLINE_AGENTS_VERIFIED === true ? true : false;
  flags.PHYSICAL_QUANTUM_HARDWARE_VERIFIED = false;
  flags.MICROSOFT_DESKTOP_INTEGRATION_VERIFIED = false;

  if (input.evidence) {
    for (const [key, value] of Object.entries(input.evidence)) {
      if (value !== undefined && key in flags) {
        flags[key as CapabilityFlag] = value;
      }
    }
    if (input.evidence.MODEL_LOAD_VERIFIED !== true) flags.MODEL_LOAD_VERIFIED = false;
    if (input.evidence.ONNX_LOAD_VERIFIED !== true) flags.ONNX_LOAD_VERIFIED = false;
  }

  const states = createCapabilityRegistry().states;
  states.CPU = flags.CPU_DETECTED === true ? 'DETECTED' : 'NOT_TESTED';
  states.GPU =
    flags.GPU_DETECTED === true
      ? 'DETECTED'
      : flags.GPU_DETECTED === false
        ? 'UNAVAILABLE'
        : 'NOT_TESTED';
  states.NPU =
    flags.NPU_DETECTED === true
      ? 'DETECTED'
      : flags.NPU_DETECTED === false
        ? 'UNAVAILABLE'
        : 'NOT_TESTED';
  states.WINDOWS_ML =
    flags.WINDOWS_ML_SUPPORTED === true
      ? 'SUPPORTED'
      : flags.WINDOWS_ML_SUPPORTED === false
        ? 'UNAVAILABLE'
        : 'NOT_TESTED';
  states.AMD_EP =
    flags.AMD_EP_SUPPORTED === true
      ? 'SUPPORTED'
      : flags.AMD_EP_SUPPORTED === false
        ? 'UNAVAILABLE'
        : 'NOT_TESTED';
  states.MODEL_LOAD = flags.MODEL_LOAD_VERIFIED === true ? 'VERIFIED' : 'NOT_TESTED';
  states.ONNX_RUNTIME = flags.ONNX_LOAD_VERIFIED === true ? 'VERIFIED' : 'NOT_TESTED';
  states.WINDOWS_OS = platform === 'win32' ? 'DETECTED' : 'NOT_TESTED';

  const anyDetected =
    flags.CPU_DETECTED === true || flags.GPU_DETECTED === true || flags.NPU_DETECTED === true;

  const registry = createCapabilityRegistry({ flags, states });

  return {
    probeId: `elprobe_${Date.now().toString(36)}`,
    capturedAt: new Date().toISOString(),
    readOnly: true,
    stealthPersistence: false,
    permissionBypass: false,
    preferredStack: PREFERRED_LOCAL_STACK,
    registry,
    platform,
    release,
    arch,
    logicalCores,
    totalMemoryBytes,
    freeMemoryBytes,
    cpuName: cpuModel,
    cpuVendor,
    gpuNames,
    npuNames,
    notes: [
      'Probe is read-only and does not inspect user files, browser data, credentials, or personal content.',
      'DETECTED does not mean SUPPORTED or VERIFIED for local inference.',
      'AMD GPU/NPU routing requires EL1–EL4 pass plus probe evidence flags.',
      platform === 'win32'
        ? 'Windows host observed; Windows-specific flags still require evidence for VERIFIED.'
        : 'Non-Windows host: Windows ML / AMD EP / ASUS model remain NOT_TESTED without injected evidence.',
    ],
    status: anyDetected ? 'ok' : 'unverified',
    state: anyDetected ? 'DETECTED' : 'NOT_TESTED',
    reason: anyDetected
      ? 'PROBE_READ_ONLY_CAPABILITY_SNAPSHOT'
      : 'PROBE_DEFAULTS_UNKNOWN_OR_FALSE_UNTIL_VERIFIED',
  };
}

export function toPrivacyMinimalProbe(
  record: HardwareProbeRecord,
  raw?: RawProbeInput,
): PrivacyMinimalProbeOutput {
  return redactProbeOutput(record, raw);
}

export function hardwareProbeHonesty() {
  return {
    readOnly: true as const,
    stealthPersistence: false as const,
    permissionBypass: false as const,
    defaultsUnknownOrFalseUntilVerified: true as const,
    preferredStack: PREFERRED_LOCAL_STACK,
    l4AutonomyEnabled: false as const,
  };
}
