/**
 * 62L-EP16 — No Overclock / BIOS Rule (park-and-implement).
 *
 * Hard hardware-safety boundary so optimization agents can never convert
 * software tuning into unsafe firmware, voltage, clock, or thermal manipulation.
 *
 * Any request involving firmware, clock, voltage, thermal, or privileged
 * hardware settings terminates with DENIED_HARDWARE_SAFETY_POLICY.
 *
 * Agents may emit human-readable diagnostic recommendations only — never execute.
 * Virtual Chip improves how XIV uses hardware; it does not seize low-level control.
 *
 * Soft-wire when PRESENT: EP15, EP14, EP13, EP12, EM (#157). Presence ≠ VERIFIED.
 *
 * SoT: GitHub #160 / 62L-EP family. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. Guardian/RLS/tenant/Universe isolation unchanged.
 * DB candidates NOT_APPLIED. tip-land=NO.
 * Next (report only): EP17 — Classical Quant Baseline Lab.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 160 as const;
export const GITHUB_SOT_LABEL = '62L-EP16' as const;
export const GITHUB_SOT_FAMILY = '62L-EP' as const;
export const GITHUB_SOT_TITLE =
  '62L-EP16 No Overclock / BIOS Rule — hard hardware-safety boundary denying firmware/clock/voltage/thermal/privileged control; agents may recommend diagnostics only; DENIED_HARDWARE_SAFETY_POLICY' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const EP16_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE =
  'EP17 — Classical Quant Baseline Lab — formalize the deterministic, OR, statistical, and optimization baselines that all advanced scheduler and quantum-inspired algorithms must be tested against.' as const;

/**
 * Hard termination code for hardware-safety violations.
 */
export const DENIED_HARDWARE_SAFETY_POLICY =
  'DENIED_HARDWARE_SAFETY_POLICY' as const;

/**
 * Required policy states.
 */
export const HARDWARE_SAFETY_POLICY_STATES = [
  'SAFE_SOFTWARE_TUNING',
  'REQUIRES_ADMIN_REVIEW',
  'HARDWARE_CONTROL_DENIED',
  'SECURITY_BOUNDARY_DENIED',
] as const;

export type HardwareSafetyPolicyState =
  (typeof HARDWARE_SAFETY_POLICY_STATES)[number];

/**
 * Explicitly prohibited automated actions (perform or recommend-for-auto-exec).
 */
export const PROHIBITED_HARDWARE_ACTIONS = [
  'cpu_gpu_overclocking',
  'undervolting_overvolting',
  'bios_uefi_modification',
  'firmware_flashing',
  'fan_curve_override',
  'thermal_limit_bypass',
  'power_limit_override',
  'driver_replacement_without_human_admin',
  'secure_boot_changes',
  'kernel_driver_privilege_escalation',
  'hidden_persistence_for_hardware_control',
] as const;

export type ProhibitedHardwareAction =
  (typeof PROHIBITED_HARDWARE_ACTIONS)[number];

/**
 * Allowed software-layer optimization surface.
 */
export const ALLOWED_SOFTWARE_OPTIMIZATIONS = [
  'batching',
  'quantization',
  'model_selection',
  'runtime_selection',
  'queue_scheduling',
  'caching',
  'concurrency_limits',
  'local_edge_cloud_routing',
] as const;

export type AllowedSoftwareOptimization =
  (typeof ALLOWED_SOFTWARE_OPTIMIZATIONS)[number];

/**
 * Classification keywords that map a request into hardware-control territory.
 */
export const HARDWARE_CONTROL_SIGNAL_KEYWORDS = [
  'overclock',
  'undervolt',
  'overvolt',
  'bios',
  'uefi',
  'firmware',
  'flash',
  'fan_curve',
  'thermal_limit',
  'power_limit',
  'driver_replace',
  'secure_boot',
  'privilege_escalation',
  'hidden_persistence',
  'clock',
  'voltage',
  'thermal',
] as const;

export const NO_OVERCLOCK_BIOS_RULE_CYCLE = [
  'honesty_locks',
  'no_overclock_bios_rule_bootstrap',
  // A — Structure
  'policy_states_encoded',
  'prohibited_actions_encoded',
  'allowed_software_optimizations_encoded',
  'denied_hardware_safety_policy_code_encoded',
  // B — Truth
  'software_tuning_allowed',
  'hardware_control_request_denied',
  'recommend_diagnostic_not_execute',
  'driver_replace_requires_admin_review',
  'virtual_chip_does_not_seize_low_level_control',
  // C — Explicit denies
  'deny_overclocking',
  'deny_undervolting_overvolting',
  'deny_bios_uefi_modification',
  'deny_firmware_flashing',
  'deny_fan_curve_override',
  'deny_thermal_limit_bypass',
  'deny_power_limit_override',
  'deny_secure_boot_changes',
  'deny_privilege_escalation',
  'deny_hidden_persistence',
  // D — Autonomy / isolation
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  // E — Soft-wires
  'ep15_soft_wire',
  'ep14_soft_wire',
  'ep13_soft_wire',
  'ep12_soft_wire',
  'em157_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Ep16Hop = (typeof NO_OVERCLOCK_BIOS_RULE_CYCLE)[number];

export type Ep16EvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'DENIED'
  | 'REJECTED'
  | 'CANDIDATE'
  | 'DOCUMENTED'
  | 'IMPLEMENTED'
  | 'AVAILABLE'
  | 'VERIFIED'
  | 'PRODUCTION_AUTHORIZED'
  | 'RECOMMENDATION_ONLY'
  | 'PLAN_ONLY'
  | 'BOUNDED'
  | 'NOT_APPLIED'
  | 'NOT_TESTED'
  | 'NOT_AVAILABLE'
  | 'NOT_VERIFIED'
  | 'WAITING_DATA'
  | 'ADVISORY_ONLY'
  | 'REGISTERED'
  | 'HUMAN_APPROVAL_REQUIRED'
  | 'UNVERIFIED'
  | 'PARTIAL'
  | 'DEGRADED'
  | 'UNKNOWN'
  | 'SAFE_SOFTWARE_TUNING'
  | 'REQUIRES_ADMIN_REVIEW'
  | 'HARDWARE_CONTROL_DENIED'
  | 'SECURITY_BOUNDARY_DENIED';

export type Ep16HopRecord = {
  hop: Ep16Hop;
  state: Ep16EvidenceState;
  summary: string;
  at: string;
};

export type Ep16ActorKind =
  | 'hardware_safety_gate'
  | 'tuning_sandbox'
  | 'scheduler'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base'
  | 'human_admin';

export type Ep16Actor = {
  kind: Ep16ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const EP16_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_HARDWARE_CONTROL_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  // Core rule
  AGENT_MAY_EXECUTE_HARDWARE_CONTROL: false as const,
  AGENT_MAY_AUTO_APPLY_BIOS_FIRMWARE: false as const,
  AGENT_MAY_OVERCLOCK_OR_CHANGE_VOLTAGE: false as const,
  AGENT_MAY_BYPASS_THERMAL_OR_POWER_LIMITS: false as const,
  AGENT_MAY_REPLACE_DRIVER_WITHOUT_HUMAN_ADMIN: false as const,
  AGENT_MAY_CHANGE_SECURE_BOOT: false as const,
  AGENT_MAY_ESCALATE_KERNEL_DRIVER_PRIVILEGE: false as const,
  AGENT_MAY_INSTALL_HIDDEN_HARDWARE_PERSISTENCE: false as const,
  VIRTUAL_CHIP_SEIZES_LOW_LEVEL_CONTROL: false as const,

  // Autonomy
  AGENT_AUTO_AUTHORITY: false as const,
  RECOMMEND_EQ_ACT: false as const,
  RECOMMEND_EQ_AUTHORIZE: false as const,
  DIAGNOSTIC_RECOMMENDATION_EQ_EXECUTE: false as const,
  HIDDEN_CHAIN_OF_THOUGHT_IN_SAFETY_GATE: false as const,

  // Isolation
  BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE: false as const,
  GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED: true as const,
  HUMAN_APPROVAL_BOUNDARIES_UNCHANGED: true as const,

  // Honesty ladder
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,

  HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS: true as const,
});

export const HARDWARE_SAFETY_AGENT_BOUNDS = Object.freeze({
  mayClassifyRequests: true as const,
  mayAllowSoftwareTuning: true as const,
  mayEmitHumanReadableDiagnostics: true as const,
  mayReturnEvidenceToHomeBase: true as const,
  automaticAuthority: false as const,
  mayExecuteHardwareControl: false as const,
  mayAutoApplyBiosOrFirmware: false as const,
  mayOverclockOrChangeVoltage: false as const,
  mayBypassThermalOrPowerLimits: false as const,
  mayReplaceDriverWithoutHumanAdmin: false as const,
  mayChangeSecureBoot: false as const,
  mayEscalateKernelDriverPrivilege: false as const,
  mayInstallHiddenHardwarePersistence: false as const,
  mayTreatDiagnosticAsExecute: false as const,
  maySeizeLowLevelHardwareControl: false as const,
  mayIncludeHiddenChainOfThought: false as const,
  mayRecommendOnly: true as const,
});

export const EP16_MAY = Object.freeze([
  'allow_safe_software_layer_tuning',
  'classify_hardware_control_requests_as_denied',
  'emit_human_readable_diagnostic_recommendations_only',
  'require_human_admin_for_driver_replacement_review',
  'preserve_portability_across_vendors_without_device_management',
] as const);

export const EP16_MUST_NOT = Object.freeze([
  'execute_cpu_gpu_overclocking',
  'execute_undervolting_or_overvolting',
  'modify_bios_or_uefi',
  'flash_firmware',
  'override_fan_curves',
  'bypass_thermal_limits',
  'override_power_limits',
  'replace_drivers_without_human_admin',
  'change_secure_boot',
  'escalate_kernel_or_driver_privilege',
  'install_hidden_persistence_for_hardware_control',
  'treat_diagnostic_recommendation_as_execution',
  'seize_low_level_hardware_control_via_virtual_chip',
  'bypass_guardian_rls_tenant_universe',
  'treat_recommend_as_act',
  'grant_agents_automatic_authority',
] as const);

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Ep16SoftWireSnapshot = {
  ep15AlgorithmTuningSandbox: SoftWirePresence;
  ep15Report: SoftWirePresence;
  ep14AdaptiveBenchmarkLedger: SoftWirePresence;
  ep14Report: SoftWirePresence;
  ep13RuntimeReturnReceipt: SoftWirePresence;
  ep13Report: SoftWirePresence;
  ep12Scheduler: SoftWirePresence;
  ep12Report: SoftWirePresence;
  em157HomeBase: SoftWirePresence;
};

export function assertEp16LocksIntact(): boolean {
  return (
    EP16_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EP16_LOCKS.AGENT_MAY_EXECUTE_HARDWARE_CONTROL === false &&
    EP16_LOCKS.AGENT_MAY_AUTO_APPLY_BIOS_FIRMWARE === false &&
    EP16_LOCKS.AGENT_MAY_OVERCLOCK_OR_CHANGE_VOLTAGE === false &&
    EP16_LOCKS.AGENT_MAY_BYPASS_THERMAL_OR_POWER_LIMITS === false &&
    EP16_LOCKS.AGENT_MAY_REPLACE_DRIVER_WITHOUT_HUMAN_ADMIN === false &&
    EP16_LOCKS.AGENT_MAY_CHANGE_SECURE_BOOT === false &&
    EP16_LOCKS.AGENT_MAY_ESCALATE_KERNEL_DRIVER_PRIVILEGE === false &&
    EP16_LOCKS.AGENT_MAY_INSTALL_HIDDEN_HARDWARE_PERSISTENCE === false &&
    EP16_LOCKS.VIRTUAL_CHIP_SEIZES_LOW_LEVEL_CONTROL === false &&
    EP16_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    EP16_LOCKS.RECOMMEND_EQ_ACT === false &&
    EP16_LOCKS.RECOMMEND_EQ_AUTHORIZE === false &&
    EP16_LOCKS.DIAGNOSTIC_RECOMMENDATION_EQ_EXECUTE === false &&
    EP16_LOCKS.HIDDEN_CHAIN_OF_THOUGHT_IN_SAFETY_GATE === false &&
    EP16_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    EP16_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    EP16_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    EP16_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    EP16_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    EP16_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    EP16_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    EP16_LOCKS.TIP_LAND === false &&
    EP16_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EP16_LOCKS.DB_CANDIDATES_APPLIED === false &&
    EP16_LOCKS.FULL_PRODUCTION_HARDWARE_CONTROL_SHIPPED === false &&
    EP16_LOCKS.MANAGE_PULL_REQUEST === false &&
    HARDWARE_SAFETY_AGENT_BOUNDS.automaticAuthority === false &&
    HARDWARE_SAFETY_AGENT_BOUNDS.mayExecuteHardwareControl === false &&
    HARDWARE_SAFETY_AGENT_BOUNDS.mayAutoApplyBiosOrFirmware === false &&
    HARDWARE_SAFETY_AGENT_BOUNDS.mayOverclockOrChangeVoltage === false &&
    HARDWARE_SAFETY_AGENT_BOUNDS.mayBypassThermalOrPowerLimits === false &&
    HARDWARE_SAFETY_AGENT_BOUNDS.mayReplaceDriverWithoutHumanAdmin === false &&
    HARDWARE_SAFETY_AGENT_BOUNDS.mayChangeSecureBoot === false &&
    HARDWARE_SAFETY_AGENT_BOUNDS.mayEscalateKernelDriverPrivilege === false &&
    HARDWARE_SAFETY_AGENT_BOUNDS.mayInstallHiddenHardwarePersistence ===
      false &&
    HARDWARE_SAFETY_AGENT_BOUNDS.mayTreatDiagnosticAsExecute === false &&
    HARDWARE_SAFETY_AGENT_BOUNDS.maySeizeLowLevelHardwareControl === false &&
    HARDWARE_SAFETY_AGENT_BOUNDS.mayIncludeHiddenChainOfThought === false
  );
}

function softWireFile(
  relFromLocalBrain: string,
  notePresent: string,
  noteAbsent: string,
): SoftWirePresence {
  const pathChecked = join(
    dirname(fileURLToPath(import.meta.url)),
    relFromLocalBrain,
  );
  const present = existsSync(pathChecked);
  return {
    present,
    pathChecked,
    note: present ? notePresent : noteAbsent,
  };
}

function softWireRepoRelative(
  repoRoot: string,
  rel: string,
  notePresent: string,
  noteAbsent: string,
): SoftWirePresence {
  const pathChecked = join(repoRoot, rel);
  const present = existsSync(pathChecked);
  return {
    present,
    pathChecked,
    note: present ? notePresent : noteAbsent,
  };
}

export function ep16SoftWireSnapshot(repoRoot?: string): Ep16SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    ep15AlgorithmTuningSandbox: softWireFile(
      './algorithm-tuning-sandbox-types.ts',
      'EP15 Algorithm Tuning Sandbox PRESENT (soft-wire).',
      'EP15 Algorithm Tuning Sandbox absent — soft-wire WAITING_DATA.',
    ),
    ep15Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EP15_ALGORITHM_TUNING_SANDBOX_REPORT.md',
      'EP15 report PRESENT.',
      'EP15 report absent — soft-wire WAITING_DATA.',
    ),
    ep14AdaptiveBenchmarkLedger: softWireFile(
      './adaptive-benchmark-ledger-types.ts',
      'EP14 Adaptive Benchmark Ledger PRESENT (soft-wire).',
      'EP14 Adaptive Benchmark Ledger absent — soft-wire WAITING_DATA.',
    ),
    ep14Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EP14_ADAPTIVE_BENCHMARK_LEDGER_REPORT.md',
      'EP14 report PRESENT.',
      'EP14 report absent — soft-wire WAITING_DATA.',
    ),
    ep13RuntimeReturnReceipt: softWireFile(
      './runtime-return-receipt-types.ts',
      'EP13 Runtime Return Receipt PRESENT (soft-wire).',
      'EP13 Runtime Return Receipt absent — soft-wire WAITING_DATA.',
    ),
    ep13Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EP13_RUNTIME_RETURN_RECEIPT_REPORT.md',
      'EP13 report PRESENT.',
      'EP13 report absent — soft-wire WAITING_DATA.',
    ),
    ep12Scheduler: softWireFile(
      './hardware-neutral-scheduler-types.ts',
      'EP12 Hardware-Neutral Scheduler PRESENT (soft-wire).',
      'EP12 Hardware-Neutral Scheduler absent — soft-wire WAITING_DATA.',
    ),
    ep12Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EP12_HARDWARE_NEUTRAL_SCHEDULER_REPORT.md',
      'EP12 report PRESENT.',
      'EP12 report absent — soft-wire WAITING_DATA.',
    ),
    em157HomeBase: softWireFile(
      './agent-compute-home-base-types.ts',
      'EM (#157) Agent Compute Home Base PRESENT (soft-wire).',
      'EM (#157) Agent Compute Home Base absent — soft-wire WAITING_DATA.',
    ),
  };
}

export function isHumanApprover(actor: Ep16Actor): boolean {
  return (
    actor.kind === 'human_approver' ||
    actor.kind === 'founder' ||
    actor.kind === 'human_admin'
  );
}

export function isSafetyGateAgent(actor: Ep16Actor): boolean {
  const agents: readonly Ep16ActorKind[] = [
    'hardware_safety_gate',
    'tuning_sandbox',
    'scheduler',
    'proposal',
  ];
  return agents.includes(actor.kind);
}
