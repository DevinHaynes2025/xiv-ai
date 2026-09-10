/**
 * US-SEC-01 — Security Center: policy denials visible.
 * Guardian read-only checks catalog (not live exploit tooling).
 * Surfaces real policy denials from evaluatePolicy — never fabricates incidents.
 * Honest WAITING_DATA when unbound / empty. L4 false. No autonomous production mutations.
 */

import { listGuardianChecks, type GuardianCheckDefinition } from './runtime/guardian/checks';
import { evaluatePolicy, type PolicyEvaluation, type PolicyInput, type RuntimeEnvironment } from './runtime/policy';

export const SECURITY_CENTER_POLICY = {
  l4Autonomy: false as const,
  productionMutation: false as const,
  liveExploitTooling: false as const,
  guardianMode: 'read_only_checks' as const,
  surface: 'policy_denials' as const,
  label: 'SECURITY_CENTER_POLICY_DENIALS',
} as const;

export type PolicyDenialVerdict = 'denied';

export type PolicyDenialRecord = {
  id: string;
  recordedAt: string;
  agentId: string;
  toolId: string;
  verdict: PolicyDenialVerdict;
  reason: string;
  environment: RuntimeEnvironment;
  authorityLevel?: string;
  source: 'policy_evaluation';
  /** Explicit: this is a policy denial surface, not a security incident feed. */
  incidentFabricated: false;
  liveExploitTooling: false;
  productionMutation: false;
};

export type GuardianReadOnlyCheckView = {
  id: string;
  name: string;
  description: string;
  category: GuardianCheckDefinition['category'];
  severity: GuardianCheckDefinition['severity'];
  executionType: GuardianCheckDefinition['executionType'];
  safeToRun: boolean;
  enabled: boolean;
  readOnly: true;
  note: string;
};

export type DenialGate = 'WAITING_DATA' | 'SESSION_DENIALS';

export type SecurityCenterView = {
  status: 'READY' | 'WAITING_DATA';
  role: 'executive';
  l4Autonomy: false;
  productionMutation: false;
  liveExploitTooling: false;
  guardianMode: 'read_only_checks';
  guardianChecks: GuardianReadOnlyCheckView[];
  denialGate: DenialGate;
  /** null when unbound/empty — honest empty; never invent denial rows. */
  denials: PolicyDenialRecord[] | null;
  /** Always null — Security Center never fabricates incidents. */
  incidents: null;
  note: string;
};

const globalStore = globalThis as typeof globalThis & {
  __xivSecurityCenterDenials?: PolicyDenialRecord[];
};

function denialStore(): PolicyDenialRecord[] {
  if (!globalStore.__xivSecurityCenterDenials) {
    globalStore.__xivSecurityCenterDenials = [];
  }
  return globalStore.__xivSecurityCenterDenials;
}

export function resetSecurityCenterSession() {
  globalStore.__xivSecurityCenterDenials = [];
}

export function securityCenterAllowsL4(): false {
  return false;
}

export function securityCenterAllowsProductionMutation(): false {
  return false;
}

export function securityCenterAllowsLiveExploitTooling(): false {
  return false;
}

export function listGuardianReadOnlyChecks(): GuardianReadOnlyCheckView[] {
  return listGuardianChecks().map((check) => ({
    id: check.id,
    name: check.name,
    description: check.description,
    category: check.category,
    severity: check.severity,
    executionType: check.executionType,
    safeToRun: check.safeToRun,
    enabled: check.enabled,
    readOnly: true as const,
    note:
      check.executionType === 'host_process'
        ? 'Guardian read-only check definition. Host runner only on trusted host — not live exploit tooling; not auto-run from mobile Security Center.'
        : 'Guardian read-only check definition. In-process / injected validation only — not live exploit tooling.',
  }));
}

function makeDenialId(evaluation: PolicyEvaluation, recordedAt: string): string {
  const stamp = recordedAt.replace(/[^0-9T]/g, '').slice(0, 15);
  return `denial-${evaluation.agentId}-${evaluation.toolId}-${stamp}-${denialStore().length + 1}`;
}

/**
 * Record a policy denial into session memory for Executive visibility.
 * Only accepts verdict === 'denied'. Does not fabricate incidents.
 * Does not enable exploit tooling or production mutations.
 */
export function recordPolicyDenial(evaluation: PolicyEvaluation): PolicyDenialRecord | null {
  if (evaluation.verdict !== 'denied') {
    return null;
  }
  const recordedAt = new Date().toISOString();
  const record: PolicyDenialRecord = {
    id: makeDenialId(evaluation, recordedAt),
    recordedAt,
    agentId: evaluation.agentId,
    toolId: evaluation.toolId,
    verdict: 'denied',
    reason: evaluation.reason,
    environment: evaluation.environment,
    authorityLevel: evaluation.authorityLevel,
    source: 'policy_evaluation',
    incidentFabricated: false,
    liveExploitTooling: false,
    productionMutation: false,
  };
  denialStore().unshift(record);
  return record;
}

/**
 * Evaluate policy and, when denied, record it for Security Center visibility.
 * Returns the evaluation always; record is null when not a denial.
 */
export function evaluateAndRecordPolicyDenial(input: PolicyInput): {
  evaluation: PolicyEvaluation;
  record: PolicyDenialRecord | null;
} {
  const evaluation = evaluatePolicy(input);
  const record = recordPolicyDenial(evaluation);
  return { evaluation, record };
}

/**
 * Probe known deny paths via real evaluatePolicy (not fabricated incidents).
 * Session memory only. Safe for Executive demo of denial visibility.
 */
export function probeKnownPolicyDenials(): PolicyDenialRecord[] {
  const probes: PolicyInput[] = [
    { agentId: 'guardian', toolId: 'business_context_reader', environment: 'prototype' },
    { agentId: 'executive', toolId: 'human_only_production_change', environment: 'prototype' },
    { agentId: 'operations', toolId: 'not_a_real_tool_id', environment: 'prototype' },
  ];
  const recorded: PolicyDenialRecord[] = [];
  for (const input of probes) {
    const { record } = evaluateAndRecordPolicyDenial(input);
    if (record) recorded.push(record);
  }
  return recorded;
}

export function clearPolicyDenials() {
  globalStore.__xivSecurityCenterDenials = [];
}

export function listRecordedPolicyDenials(): PolicyDenialRecord[] {
  return denialStore().slice();
}

/**
 * Executive Security Center view.
 * Unbound / empty → WAITING_DATA with null denials and null incidents (honest).
 * After real policy denials are recorded → SESSION_DENIALS labeled rows only.
 * Guardian checks are always the read-only registry catalog (definitions, not exploit runs).
 */
export function listSecurityCenterView(): SecurityCenterView {
  const guardianChecks = listGuardianReadOnlyChecks();
  const stored = denialStore();
  const hasDenials = stored.length > 0;

  if (!hasDenials) {
    return {
      status: 'WAITING_DATA',
      role: 'executive',
      l4Autonomy: false,
      productionMutation: false,
      liveExploitTooling: false,
      guardianMode: 'read_only_checks',
      guardianChecks,
      denialGate: 'WAITING_DATA',
      denials: null,
      incidents: null,
      note:
        'WAITING_DATA — no policy denials recorded in this session. Incidents are not fabricated. Guardian checks listed are read-only definitions (not live exploit tooling). L4 false; no autonomous production mutations.',
    };
  }

  return {
    status: 'READY',
    role: 'executive',
    l4Autonomy: false,
    productionMutation: false,
    liveExploitTooling: false,
    guardianMode: 'read_only_checks',
    guardianChecks,
    denialGate: 'SESSION_DENIALS',
    denials: stored.slice(),
    incidents: null,
    note:
      'SESSION_DENIALS — showing real evaluatePolicy denials from session memory only. Not an incident feed; incidents remain null (never fabricated). Guardian checks are read-only definitions. L4 false; no exploit tooling; no production mutations.',
  };
}
