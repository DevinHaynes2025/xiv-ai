/**
 * 62L-EK Module A — Windows Hardware & Runtime Probe + Local Cognitive OS routing gates.
 * Preferred stack: ASUS → Windows 11 → Windows ML → ONNX Runtime → AMD EP → XIV Local Runtime.
 * Probe defaults unknown/false until verified. AMD routing gated until probe evidence.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  AMD_ROUTING_GATED,
  MAX_PROBE_EVENTS,
  MODEL_LOAD_UNVERIFIED,
  PREFERRED_WINDOWS_AMD_STACK,
  PROBE_FIELDS,
  PROBE_FIRST_REQUIRED,
  type EkActor,
  type EkEvidenceState,
  type ProbeField,
} from './windows-amd-local-cognitive-os-types';

export type ProbeEvidence = Partial<Record<ProbeField, boolean | 'unknown'>>;

export type WindowsHardwareRuntimeProbe = {
  id: string;
  probeId: string;
  fields: Record<ProbeField, boolean | 'unknown'>;
  evidenceNotes: Partial<Record<ProbeField, string>>;
  preferredStack: typeof PREFERRED_WINDOWS_AMD_STACK;
  status: 'ok' | 'denied' | 'unverified';
  state: EkEvidenceState;
  reason: string;
  amdRoutingAllowed: boolean;
  at: string;
};

export type AmdRoutingGate = {
  id: string;
  probeId: string;
  requestedTarget: 'amd_cpu' | 'amd_gpu' | 'amd_npu';
  probeEvidencePresent: boolean;
  status: 'denied' | 'gated' | 'allowed';
  state: EkEvidenceState;
  reason: string;
  amdInferenceClaimed: false;
  at: string;
};

type Store = {
  probes: WindowsHardwareRuntimeProbe[];
  gates: AmdRoutingGate[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'windows-hardware-runtime-probe.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { probes: [], gates: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function defaultFields(): Record<ProbeField, boolean | 'unknown'> {
  return {
    CPU_DETECTED: 'unknown',
    GPU_DETECTED: 'unknown',
    NPU_DETECTED: 'unknown',
    WINDOWS_ML_SUPPORTED: 'unknown',
    AMD_EP_SUPPORTED: 'unknown',
    MODEL_LOAD_VERIFIED: false,
  };
}

export function windowsHardwareRuntimeProbeHonesty() {
  return {
    probeFirstRequired: true,
    defaultsUnknownOrFalseUntilVerified: true,
    preferredStackNotDirectMlFirst: true,
    preferredStack: PREFERRED_WINDOWS_AMD_STACK,
    amdRoutingGatedUntilProbeEvidence: true,
    unverifiedNeqAmdInferenceClaim: true,
    modelLoadVerifiedDefaultFalse: true,
    l4AutonomyEnabled: false,
  };
}

export async function runWindowsHardwareRuntimeProbe(input: {
  probeId: string;
  evidence?: ProbeEvidence;
  evidenceNotes?: Partial<Record<ProbeField, string>>;
  root: string;
  actor: EkActor;
}): Promise<WindowsHardwareRuntimeProbe> {
  void input.actor;
  const store = await load(input.root);
  if (store.probes.length >= MAX_PROBE_EVENTS) throw new Error('MAX_PROBE_EVENTS');

  const fields = defaultFields();
  for (const key of PROBE_FIELDS) {
    if (input.evidence && key in input.evidence && input.evidence[key] !== undefined) {
      fields[key] = input.evidence[key] as boolean | 'unknown';
    }
  }

  const anyVerifiedTrue = PROBE_FIELDS.some((k) => fields[k] === true);
  const amdEpOk = fields.AMD_EP_SUPPORTED === true;
  const modelOk = fields.MODEL_LOAD_VERIFIED === true;
  const amdRoutingAllowed = amdEpOk && anyVerifiedTrue;

  const rec: WindowsHardwareRuntimeProbe = {
    id: id('ekprobe'),
    probeId: input.probeId.trim(),
    fields,
    evidenceNotes: input.evidenceNotes ?? {},
    preferredStack: PREFERRED_WINDOWS_AMD_STACK,
    status: anyVerifiedTrue ? 'ok' : 'unverified',
    state: anyVerifiedTrue ? 'REGISTERED' : 'NOT_VERIFIED',
    reason: anyVerifiedTrue
      ? PROBE_FIRST_REQUIRED
      : 'PROBE_DEFAULTS_UNKNOWN_OR_FALSE_UNTIL_VERIFIED',
    amdRoutingAllowed,
    at: new Date().toISOString(),
  };
  if (!modelOk && fields.MODEL_LOAD_VERIFIED !== true) {
    rec.fields.MODEL_LOAD_VERIFIED = false;
  }
  store.probes.push(rec);
  await save(input.root, store);
  return rec;
}

export async function gateAmdWorkloadRouting(input: {
  probeId: string;
  requestedTarget: 'amd_cpu' | 'amd_gpu' | 'amd_npu';
  probeEvidencePresent: boolean;
  root: string;
  actor: EkActor;
}): Promise<AmdRoutingGate> {
  void input.actor;
  const store = await load(input.root);
  if (store.gates.length >= MAX_PROBE_EVENTS) throw new Error('MAX_PROBE_EVENTS');

  if (!input.probeEvidencePresent) {
    const denied: AmdRoutingGate = {
      id: id('ekamd'),
      probeId: input.probeId.trim(),
      requestedTarget: input.requestedTarget,
      probeEvidencePresent: false,
      status: 'denied',
      state: 'DENIED',
      reason: AMD_ROUTING_GATED,
      amdInferenceClaimed: false,
      at: new Date().toISOString(),
    };
    store.gates.push(denied);
    await save(input.root, store);
    return denied;
  }

  const allowed: AmdRoutingGate = {
    id: id('ekamd'),
    probeId: input.probeId.trim(),
    requestedTarget: input.requestedTarget,
    probeEvidencePresent: true,
    status: 'gated',
    state: 'BOUNDED',
    reason: 'PROBE_EVIDENCE_PRESENT_ROUTING_BOUNDED_NOT_PRODUCTION_AUTHORIZED',
    amdInferenceClaimed: false,
    at: new Date().toISOString(),
  };
  store.gates.push(allowed);
  await save(input.root, store);
  return allowed;
}

export async function probeModelLoadVerified(input: {
  probeId: string;
  claimVerified: boolean;
  evidencePresent: boolean;
  root: string;
  actor: EkActor;
}): Promise<{
  id: string;
  status: 'denied' | 'ok';
  state: EkEvidenceState;
  reason: string;
  modelLoadVerified: boolean;
  at: string;
}> {
  void input.actor;
  if (input.claimVerified && !input.evidencePresent) {
    return {
      id: id('ekml'),
      status: 'denied',
      state: 'DENIED',
      reason: MODEL_LOAD_UNVERIFIED,
      modelLoadVerified: false,
      at: new Date().toISOString(),
    };
  }
  return {
    id: id('ekml'),
    status: input.evidencePresent ? 'ok' : 'denied',
    state: input.evidencePresent ? 'VERIFIED' : 'NOT_VERIFIED',
    reason: input.evidencePresent
      ? 'MODEL_LOAD_EVIDENCE_PRESENT'
      : MODEL_LOAD_UNVERIFIED,
    modelLoadVerified: Boolean(input.evidencePresent && input.claimVerified),
    at: new Date().toISOString(),
  };
}
