/**
 * 62L-EK Module B — Offline Agent Brain (supervisor stack) + Learning Mesh +
 * capability promotion pipeline + Guardian gate.
 * Device off / runtime not running → WAITING_NODE / OFFLINE_STOPPED.
 * Deny: agent learns → automatic power increase (silent authority growth).
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CAPABILITY_PROMOTION_PIPELINE,
  GUARDIAN_GATE_REQUIRED,
  MAX_BRAIN_EVENTS,
  OFFLINE_SUPERVISOR_STACK,
  OFFLINE_WHILE_OFF_DENY,
  PROMOTION_PIPELINE_REQUIRED,
  SILENT_AUTHORITY_DENY,
  type EkActor,
  type EkEvidenceState,
} from './windows-amd-local-cognitive-os-types';

export type OfflineBrainStatus = {
  id: string;
  nodeId: string;
  devicePoweredOn: boolean;
  runtimeRunning: boolean;
  stack: typeof OFFLINE_SUPERVISOR_STACK;
  status: 'ok' | 'waiting' | 'stopped' | 'denied';
  state: EkEvidenceState;
  reason: string;
  agentsClaimedWorking: false;
  at: string;
};

export type PromotionAttempt = {
  id: string;
  skillId: string;
  stagesCompleted: string[];
  skippedStages: string[];
  guardianApproved: boolean;
  humanPolicyPromoted: boolean;
  status: 'ok' | 'denied' | 'sandbox';
  state: EkEvidenceState;
  reason: string;
  boundedUse: boolean;
  automaticPowerIncrease: false;
  at: string;
};

export type SilentAuthorityDenial = {
  id: string;
  claim: string;
  status: 'denied';
  state: EkEvidenceState;
  reason: string;
  automaticPowerIncrease: false;
  at: string;
};

type Store = {
  brains: OfflineBrainStatus[];
  promotions: PromotionAttempt[];
  denials: SilentAuthorityDenial[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'offline-agent-brain.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    brains: [],
    promotions: [],
    denials: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function offlineAgentBrainHonesty() {
  return {
    supervisorStack: OFFLINE_SUPERVISOR_STACK,
    requiresDeviceOnAndRuntimeRunning: true,
    offlineWhileOffDenied: true,
    waitingNodeOrOfflineStoppedWhenOff: true,
    promotionPipeline: CAPABILITY_PROMOTION_PIPELINE,
    silentAuthorityGrowthDenied: true,
    agentLearnsNeqAutomaticPowerIncrease: true,
    guardianGateRequired: true,
    l4AutonomyEnabled: false,
  };
}

export async function registerOfflineAgentBrain(input: {
  nodeId: string;
  devicePoweredOn: boolean;
  runtimeRunning: boolean;
  root: string;
  actor: EkActor;
}): Promise<OfflineBrainStatus> {
  void input.actor;
  const store = await load(input.root);
  if (store.brains.length >= MAX_BRAIN_EVENTS) throw new Error('MAX_BRAIN_EVENTS');

  if (!input.devicePoweredOn || !input.runtimeRunning) {
    const mode =
      !input.devicePoweredOn ? 'stopped' : 'waiting';
    const rec: OfflineBrainStatus = {
      id: id('ekbrain'),
      nodeId: input.nodeId.trim(),
      devicePoweredOn: input.devicePoweredOn,
      runtimeRunning: input.runtimeRunning,
      stack: OFFLINE_SUPERVISOR_STACK,
      status: mode,
      state: mode === 'stopped' ? 'OFFLINE_STOPPED' : 'WAITING_NODE',
      reason: OFFLINE_WHILE_OFF_DENY,
      agentsClaimedWorking: false,
      at: new Date().toISOString(),
    };
    store.brains.push(rec);
    await save(input.root, store);
    return rec;
  }

  const rec: OfflineBrainStatus = {
    id: id('ekbrain'),
    nodeId: input.nodeId.trim(),
    devicePoweredOn: true,
    runtimeRunning: true,
    stack: OFFLINE_SUPERVISOR_STACK,
    status: 'ok',
    state: 'REGISTERED',
    reason: 'OFFLINE_AGENT_BRAIN_SUPERVISOR_STACK_REGISTERED',
    agentsClaimedWorking: false,
    at: new Date().toISOString(),
  };
  store.brains.push(rec);
  await save(input.root, store);
  return rec;
}

export async function denyAgentsWhileDeviceOff(input: {
  claimAgentsWorking: boolean;
  devicePoweredOn: boolean;
  runtimeRunning: boolean;
  root: string;
  actor: EkActor;
}): Promise<OfflineBrainStatus> {
  return registerOfflineAgentBrain({
    nodeId: 'deny-while-off',
    devicePoweredOn: input.devicePoweredOn,
    runtimeRunning: input.runtimeRunning,
    root: input.root,
    actor: input.actor,
  });
}

export async function attemptCapabilityPromotion(input: {
  skillId: string;
  stagesCompleted: string[];
  guardianApproved: boolean;
  humanPolicyPromoted: boolean;
  root: string;
  actor: EkActor;
}): Promise<PromotionAttempt> {
  void input.actor;
  const store = await load(input.root);
  if (store.promotions.length >= MAX_BRAIN_EVENTS) {
    throw new Error('MAX_BRAIN_EVENTS');
  }

  const required = [...CAPABILITY_PROMOTION_PIPELINE];
  const completed = new Set(input.stagesCompleted);
  const skipped = required.filter((s) => !completed.has(s));

  // Silent skip of guardian / human_policy_promotion = deny
  const missingHard =
    skipped.includes('guardian') ||
    skipped.includes('human_policy_promotion') ||
    !input.guardianApproved ||
    !input.humanPolicyPromoted;

  if (missingHard || skipped.length > 0) {
    const denied: PromotionAttempt = {
      id: id('ekpromo'),
      skillId: input.skillId.trim(),
      stagesCompleted: input.stagesCompleted,
      skippedStages: skipped,
      guardianApproved: input.guardianApproved,
      humanPolicyPromoted: input.humanPolicyPromoted,
      status: 'denied',
      state: 'PROMOTION_DENIED',
      reason:
        skipped.length > 0
          ? PROMOTION_PIPELINE_REQUIRED
          : GUARDIAN_GATE_REQUIRED,
      boundedUse: false,
      automaticPowerIncrease: false,
      at: new Date().toISOString(),
    };
    store.promotions.push(denied);
    await save(input.root, store);
    return denied;
  }

  const ok: PromotionAttempt = {
    id: id('ekpromo'),
    skillId: input.skillId.trim(),
    stagesCompleted: input.stagesCompleted,
    skippedStages: [],
    guardianApproved: true,
    humanPolicyPromoted: true,
    status: 'ok',
    state: 'BOUNDED',
    reason: 'CAPABILITY_PROMOTED_BOUNDED_USE_ONLY',
    boundedUse: true,
    automaticPowerIncrease: false,
    at: new Date().toISOString(),
  };
  store.promotions.push(ok);
  await save(input.root, store);
  return ok;
}

export async function denySilentAuthorityGrowth(input: {
  claim: string;
  root: string;
  actor: EkActor;
}): Promise<SilentAuthorityDenial> {
  void input.actor;
  const store = await load(input.root);
  const denied: SilentAuthorityDenial = {
    id: id('ekauth'),
    claim: input.claim,
    status: 'denied',
    state: 'DENIED',
    reason: SILENT_AUTHORITY_DENY,
    automaticPowerIncrease: false,
    at: new Date().toISOString(),
  };
  store.denials.push(denied);
  await save(input.root, store);
  return denied;
}

export async function guardianGate(input: {
  action: string;
  guardianApproved: boolean;
  root: string;
  actor: EkActor;
}): Promise<{
  id: string;
  action: string;
  status: 'ok' | 'denied';
  state: EkEvidenceState;
  reason: string;
  at: string;
}> {
  void input.actor;
  void input.root;
  if (!input.guardianApproved) {
    return {
      id: id('ekguard'),
      action: input.action,
      status: 'denied',
      state: 'DENIED',
      reason: GUARDIAN_GATE_REQUIRED,
      at: new Date().toISOString(),
    };
  }
  return {
    id: id('ekguard'),
    action: input.action,
    status: 'ok',
    state: 'BOUNDED',
    reason: 'GUARDIAN_APPROVED_BOUNDED',
    at: new Date().toISOString(),
  };
}
