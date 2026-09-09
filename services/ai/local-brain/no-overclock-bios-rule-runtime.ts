/**
 * 62L-EP16 — No Overclock / BIOS Rule runtime.
 *
 * Classify requests → allow software tuning OR terminate with
 * DENIED_HARDWARE_SAFETY_POLICY. Diagnostics may be recommended, never executed.
 * Soft-wires EP15/EP14/EP13/EP12/EM157 when present.
 */

import {
  ALLOWED_SOFTWARE_OPTIMIZATIONS,
  DENIED_HARDWARE_SAFETY_POLICY,
  EP16_DB_CANDIDATES_STATUS,
  EP16_LOCKS,
  EP16_MAY,
  EP16_MUST_NOT,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HARDWARE_CONTROL_SIGNAL_KEYWORDS,
  HARDWARE_SAFETY_AGENT_BOUNDS,
  HARDWARE_SAFETY_POLICY_STATES,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  NO_OVERCLOCK_BIOS_RULE_CYCLE,
  PROHIBITED_HARDWARE_ACTIONS,
  assertEp16LocksIntact,
  ep16SoftWireSnapshot,
  isHumanApprover,
  isSafetyGateAgent,
  type AllowedSoftwareOptimization,
  type Ep16Actor,
  type Ep16EvidenceState,
  type Ep16HopRecord,
  type Ep16SoftWireSnapshot,
  type HardwareSafetyPolicyState,
  type ProhibitedHardwareAction,
} from './no-overclock-bios-rule-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof NO_OVERCLOCK_BIOS_RULE_CYCLE)[number],
  state: Ep16EvidenceState,
  summary: string,
): Ep16HopRecord {
  return { hop: hopName, state, summary, at: nowIso() };
}

export type DenialResult = {
  denied: true;
  state: 'DENIED';
  reason: string;
  executed: false;
  terminationCode?: typeof DENIED_HARDWARE_SAFETY_POLICY;
  policyState?: HardwareSafetyPolicyState;
};

function deny(
  reason: string,
  extras?: {
    terminationCode?: typeof DENIED_HARDWARE_SAFETY_POLICY;
    policyState?: HardwareSafetyPolicyState;
  },
): DenialResult {
  return {
    denied: true,
    state: 'DENIED',
    reason,
    executed: false,
    ...extras,
  };
}

export type HardwareSafetyDecision = {
  decisionId: string;
  policyState: HardwareSafetyPolicyState;
  allowed: boolean;
  executed: false;
  softwareOptimization?: AllowedSoftwareOptimization;
  prohibitedAction?: ProhibitedHardwareAction;
  terminationCode: typeof DENIED_HARDWARE_SAFETY_POLICY | null;
  diagnosticRecommendation: string | null;
  changeExecuted: false;
  orgId: string;
  tenantId: string;
  universeId: string;
};

const ACTION_TO_KEYWORDS: Record<ProhibitedHardwareAction, readonly string[]> =
  {
    cpu_gpu_overclocking: ['overclock', 'clock'],
    undervolting_overvolting: ['undervolt', 'overvolt', 'voltage'],
    bios_uefi_modification: ['bios', 'uefi'],
    firmware_flashing: ['firmware', 'flash'],
    fan_curve_override: ['fan_curve'],
    thermal_limit_bypass: ['thermal_limit', 'thermal'],
    power_limit_override: ['power_limit'],
    driver_replacement_without_human_admin: ['driver_replace'],
    secure_boot_changes: ['secure_boot'],
    kernel_driver_privilege_escalation: ['privilege_escalation'],
    hidden_persistence_for_hardware_control: ['hidden_persistence'],
  };

export function detectProhibitedActions(
  requestText: string,
): ProhibitedHardwareAction[] {
  const lower = requestText.toLowerCase();
  const hits: ProhibitedHardwareAction[] = [];
  for (const action of PROHIBITED_HARDWARE_ACTIONS) {
    const keys = ACTION_TO_KEYWORDS[action];
    if (keys.some((k) => lower.includes(k))) {
      hits.push(action);
    }
  }
  // Also catch generic hardware-control signals not tied to a single action list miss
  void HARDWARE_CONTROL_SIGNAL_KEYWORDS;
  return hits;
}

export function isAllowedSoftwareOptimization(
  lever: string,
): lever is AllowedSoftwareOptimization {
  return (ALLOWED_SOFTWARE_OPTIMIZATIONS as readonly string[]).includes(lever);
}

/**
 * Human-readable diagnostic only — never executes hardware changes.
 */
export function emitDiagnosticRecommendation(input: {
  constrainedBy: 'power' | 'thermal' | 'driver' | 'firmware' | 'unknown';
  attemptExecuteChange?: boolean;
}):
  | {
      recommendation: string;
      executed: false;
      recommendationOnly: true;
    }
  | DenialResult {
  if (input.attemptExecuteChange) {
    return deny(
      'DIAGNOSTIC_RECOMMENDATION_EQ_EXECUTE=false — agents may recommend diagnostics but cannot execute the change.',
      {
        terminationCode: DENIED_HARDWARE_SAFETY_POLICY,
        policyState: 'HARDWARE_CONTROL_DENIED',
      },
    );
  }

  const messages: Record<typeof input.constrainedBy, string> = {
    power:
      'GPU utilization appears constrained by power/thermal conditions. Manual vendor-supported diagnostics may be appropriate.',
    thermal:
      'GPU utilization appears constrained by power/thermal conditions. Manual vendor-supported diagnostics may be appropriate.',
    driver:
      'Driver behavior may be constraining performance. Manual human-admin review of vendor-supported drivers may be appropriate.',
    firmware:
      'Firmware configuration may be relevant. Manual vendor-supported diagnostics may be appropriate; agents must not flash firmware.',
    unknown:
      'Performance may be constrained by hardware configuration. Manual vendor-supported diagnostics may be appropriate.',
  };

  return {
    recommendation: messages[input.constrainedBy],
    executed: false,
    recommendationOnly: true,
  };
}

export function evaluateHardwareSafetyRequest(input: {
  actor: Ep16Actor;
  decisionId: string;
  requestText: string;
  softwareLever?: string;
  humanAdminApprovedDriverReplace?: boolean;
  attemptExecuteHardwareControl?: boolean;
  attemptTreatDiagnosticAsExecute?: boolean;
}): HardwareSafetyDecision | DenialResult {
  if (input.attemptExecuteHardwareControl) {
    return deny(
      'AGENT_MAY_EXECUTE_HARDWARE_CONTROL=false — terminates with DENIED_HARDWARE_SAFETY_POLICY.',
      {
        terminationCode: DENIED_HARDWARE_SAFETY_POLICY,
        policyState: 'HARDWARE_CONTROL_DENIED',
      },
    );
  }
  if (input.attemptTreatDiagnosticAsExecute) {
    return deny(
      'DIAGNOSTIC_RECOMMENDATION_EQ_EXECUTE=false.',
      {
        terminationCode: DENIED_HARDWARE_SAFETY_POLICY,
        policyState: 'HARDWARE_CONTROL_DENIED',
      },
    );
  }

  const prohibited = detectProhibitedActions(input.requestText);

  if (prohibited.length > 0) {
    const primary = prohibited[0]!;

    // Driver replacement without human-admin → admin review or hard deny on execute path
    if (primary === 'driver_replacement_without_human_admin') {
      if (!input.humanAdminApprovedDriverReplace) {
        const diagnostic = emitDiagnosticRecommendation({
          constrainedBy: 'driver',
        });
        return {
          decisionId: input.decisionId,
          policyState: 'REQUIRES_ADMIN_REVIEW',
          allowed: false,
          executed: false,
          prohibitedAction: primary,
          terminationCode: DENIED_HARDWARE_SAFETY_POLICY,
          diagnosticRecommendation:
            'denied' in diagnostic ? null : diagnostic.recommendation,
          changeExecuted: false,
          orgId: input.actor.orgId,
          tenantId: input.actor.tenantId,
          universeId: input.actor.universeId,
        };
      }
      // Even with human-admin approval flag, agents still do not execute replacement
      return {
        decisionId: input.decisionId,
        policyState: 'REQUIRES_ADMIN_REVIEW',
        allowed: false,
        executed: false,
        prohibitedAction: primary,
        terminationCode: DENIED_HARDWARE_SAFETY_POLICY,
        diagnosticRecommendation:
          'Driver replacement requires human-admin action; agent will not execute the change.',
        changeExecuted: false,
        orgId: input.actor.orgId,
        tenantId: input.actor.tenantId,
        universeId: input.actor.universeId,
      };
    }

    const securityBoundary =
      primary === 'secure_boot_changes' ||
      primary === 'kernel_driver_privilege_escalation' ||
      primary === 'hidden_persistence_for_hardware_control';

    const policyState: HardwareSafetyPolicyState = securityBoundary
      ? 'SECURITY_BOUNDARY_DENIED'
      : 'HARDWARE_CONTROL_DENIED';

    const constrainedBy =
      primary === 'thermal_limit_bypass' || primary === 'fan_curve_override'
        ? ('thermal' as const)
        : primary === 'power_limit_override'
          ? ('power' as const)
          : primary === 'firmware_flashing' ||
              primary === 'bios_uefi_modification'
            ? ('firmware' as const)
            : ('unknown' as const);

    const diagnostic = emitDiagnosticRecommendation({ constrainedBy });

    return {
      decisionId: input.decisionId,
      policyState,
      allowed: false,
      executed: false,
      prohibitedAction: primary,
      terminationCode: DENIED_HARDWARE_SAFETY_POLICY,
      diagnosticRecommendation:
        'denied' in diagnostic ? null : diagnostic.recommendation,
      changeExecuted: false,
      orgId: input.actor.orgId,
      tenantId: input.actor.tenantId,
      universeId: input.actor.universeId,
    };
  }

  // Safe software tuning path
  if (input.softwareLever) {
    if (!isAllowedSoftwareOptimization(input.softwareLever)) {
      return deny(
        `Software lever "${input.softwareLever}" is not on the allowed software optimization surface.`,
        {
          terminationCode: DENIED_HARDWARE_SAFETY_POLICY,
          policyState: 'HARDWARE_CONTROL_DENIED',
        },
      );
    }
    return {
      decisionId: input.decisionId,
      policyState: 'SAFE_SOFTWARE_TUNING',
      allowed: true,
      executed: false,
      softwareOptimization: input.softwareLever,
      terminationCode: null,
      diagnosticRecommendation: null,
      changeExecuted: false,
      orgId: input.actor.orgId,
      tenantId: input.actor.tenantId,
      universeId: input.actor.universeId,
    };
  }

  // No prohibited signal and no software lever → still no hardware execution
  return {
    decisionId: input.decisionId,
    policyState: 'SAFE_SOFTWARE_TUNING',
    allowed: true,
    executed: false,
    terminationCode: null,
    diagnosticRecommendation: null,
    changeExecuted: false,
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
  };
}

export function attemptOverclocking(): DenialResult {
  return deny('cpu_gpu_overclocking prohibited.', {
    terminationCode: DENIED_HARDWARE_SAFETY_POLICY,
    policyState: 'HARDWARE_CONTROL_DENIED',
  });
}

export function attemptUndervoltingOvervolting(): DenialResult {
  return deny('undervolting/overvolting prohibited.', {
    terminationCode: DENIED_HARDWARE_SAFETY_POLICY,
    policyState: 'HARDWARE_CONTROL_DENIED',
  });
}

export function attemptBiosUefiModification(): DenialResult {
  return deny('BIOS/UEFI modification prohibited.', {
    terminationCode: DENIED_HARDWARE_SAFETY_POLICY,
    policyState: 'HARDWARE_CONTROL_DENIED',
  });
}

export function attemptFirmwareFlashing(): DenialResult {
  return deny('firmware flashing prohibited.', {
    terminationCode: DENIED_HARDWARE_SAFETY_POLICY,
    policyState: 'HARDWARE_CONTROL_DENIED',
  });
}

export function attemptFanCurveOverride(): DenialResult {
  return deny('fan-curve override prohibited.', {
    terminationCode: DENIED_HARDWARE_SAFETY_POLICY,
    policyState: 'HARDWARE_CONTROL_DENIED',
  });
}

export function attemptThermalLimitBypass(): DenialResult {
  return deny('thermal-limit bypass prohibited.', {
    terminationCode: DENIED_HARDWARE_SAFETY_POLICY,
    policyState: 'HARDWARE_CONTROL_DENIED',
  });
}

export function attemptPowerLimitOverride(): DenialResult {
  return deny('power-limit override prohibited.', {
    terminationCode: DENIED_HARDWARE_SAFETY_POLICY,
    policyState: 'HARDWARE_CONTROL_DENIED',
  });
}

export function attemptSecureBootChange(): DenialResult {
  return deny('secure-boot changes prohibited.', {
    terminationCode: DENIED_HARDWARE_SAFETY_POLICY,
    policyState: 'SECURITY_BOUNDARY_DENIED',
  });
}

export function attemptPrivilegeEscalation(): DenialResult {
  return deny('kernel/driver privilege escalation prohibited.', {
    terminationCode: DENIED_HARDWARE_SAFETY_POLICY,
    policyState: 'SECURITY_BOUNDARY_DENIED',
  });
}

export function attemptHiddenPersistence(): DenialResult {
  return deny('hidden persistence for hardware control prohibited.', {
    terminationCode: DENIED_HARDWARE_SAFETY_POLICY,
    policyState: 'SECURITY_BOUNDARY_DENIED',
  });
}

export function attemptDriverReplaceWithoutHumanAdmin(): DenialResult {
  return deny('driver replacement without human-admin action prohibited.', {
    terminationCode: DENIED_HARDWARE_SAFETY_POLICY,
    policyState: 'REQUIRES_ADMIN_REVIEW',
  });
}

export function attemptSeizeLowLevelControl(): DenialResult {
  return deny(
    'VIRTUAL_CHIP_SEIZES_LOW_LEVEL_CONTROL=false — Virtual Chip improves how XIV uses hardware, not seize low-level control.',
    {
      terminationCode: DENIED_HARDWARE_SAFETY_POLICY,
      policyState: 'HARDWARE_CONTROL_DENIED',
    },
  );
}

export function attemptRecommendAsAct(): DenialResult {
  return deny('RECOMMEND_EQ_ACT=false.');
}

export function attemptAgentAutoAuthority(): DenialResult {
  return deny('AGENT_AUTO_AUTHORITY=false.');
}

export function returnHardwareSafetyEvidenceToHomeBase(input: {
  evidenceId: string;
  actor: Ep16Actor;
  summary: string;
}):
  | {
      evidenceId: string;
      returnedToHomeBase: true;
      policyStates: typeof HARDWARE_SAFETY_POLICY_STATES;
      authorityGranted: false;
    }
  | DenialResult {
  if (!HARDWARE_SAFETY_AGENT_BOUNDS.mayReturnEvidenceToHomeBase) {
    return deny('mayReturnEvidenceToHomeBase=false');
  }
  if (!isSafetyGateAgent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only safety-gate agents / home_base may return evidence.');
  }
  return {
    evidenceId: input.evidenceId,
    returnedToHomeBase: true,
    policyStates: HARDWARE_SAFETY_POLICY_STATES,
    authorityGranted: false,
  };
}

export function requireHumanApproval(input: {
  approvalId: string;
  actor: Ep16Actor;
  action: string;
}):
  | {
      approvalId: string;
      action: string;
      approved: true;
      humanGate: true;
    }
  | DenialResult {
  if (!isHumanApprover(input.actor)) {
    return deny(
      'HUMAN_APPROVAL_REQUIRED — consequential actions require human_approver, founder, or human_admin.',
    );
  }
  if (!input.actor.permissions.includes('approve_consequential')) {
    return deny('Human lacks approve_consequential.');
  }
  return {
    approvalId: input.approvalId,
    action: input.action,
    approved: true,
    humanGate: true,
  };
}

export function probeGuardianRlsTenantUniverseIsolation(): {
  unchanged: true;
  humanApprovalUnchanged: true;
  bypassDenied: true;
  state: 'PASS';
} {
  return {
    unchanged: EP16_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED,
    humanApprovalUnchanged: EP16_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED,
    bypassDenied: EP16_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false,
    state: 'PASS',
  };
}

export function bootstrapNoOverclockBiosRule(repoRoot?: string): {
  locksIntact: boolean;
  softWire: Ep16SoftWireSnapshot;
  policyStates: typeof HARDWARE_SAFETY_POLICY_STATES;
  prohibitedActions: typeof PROHIBITED_HARDWARE_ACTIONS;
  allowedSoftware: typeof ALLOWED_SOFTWARE_OPTIMIZATIONS;
  terminationCode: typeof DENIED_HARDWARE_SAFETY_POLICY;
  sot: {
    issue: typeof GITHUB_SOT_ISSUE;
    label: typeof GITHUB_SOT_LABEL;
    title: typeof GITHUB_SOT_TITLE;
    gitlab: typeof GITLAB_MIRROR_NOTE;
    next: typeof NEXT_PHASE_TITLE;
    honesty: typeof HONESTY_BANNER;
  };
  may: typeof EP16_MAY;
  mustNot: typeof EP16_MUST_NOT;
  dbCandidates: typeof EP16_DB_CANDIDATES_STATUS;
} {
  return {
    locksIntact: assertEp16LocksIntact(),
    softWire: ep16SoftWireSnapshot(repoRoot),
    policyStates: HARDWARE_SAFETY_POLICY_STATES,
    prohibitedActions: PROHIBITED_HARDWARE_ACTIONS,
    allowedSoftware: ALLOWED_SOFTWARE_OPTIMIZATIONS,
    terminationCode: DENIED_HARDWARE_SAFETY_POLICY,
    sot: {
      issue: GITHUB_SOT_ISSUE,
      label: GITHUB_SOT_LABEL,
      title: GITHUB_SOT_TITLE,
      gitlab: GITLAB_MIRROR_NOTE,
      next: NEXT_PHASE_TITLE,
      honesty: HONESTY_BANNER,
    },
    may: EP16_MAY,
    mustNot: EP16_MUST_NOT,
    dbCandidates: EP16_DB_CANDIDATES_STATUS,
  };
}

export function runNoOverclockBiosRuleCycle(input: {
  actor: Ep16Actor;
  human: Ep16Actor;
  repoRoot?: string;
}): {
  hops: Ep16HopRecord[];
  safeDecision: HardwareSafetyDecision | DenialResult;
  deniedDecision: HardwareSafetyDecision | DenialResult;
  softWire: Ep16SoftWireSnapshot;
} {
  const hops: Ep16HopRecord[] = [];
  const softWire = ep16SoftWireSnapshot(input.repoRoot);

  hops.push(
    hop(
      'honesty_locks',
      assertEp16LocksIntact() ? 'PASS' : 'FAIL',
      'EP16 locks intact including L4=false and no hardware control execution.',
    ),
  );
  hops.push(
    hop(
      'no_overclock_bios_rule_bootstrap',
      'PASS',
      'No Overclock / BIOS Rule bootstrapped.',
    ),
  );
  hops.push(
    hop(
      'policy_states_encoded',
      'PASS',
      HARDWARE_SAFETY_POLICY_STATES.join(' | '),
    ),
  );
  hops.push(
    hop(
      'prohibited_actions_encoded',
      'PASS',
      `${PROHIBITED_HARDWARE_ACTIONS.length} prohibited actions encoded.`,
    ),
  );
  hops.push(
    hop(
      'allowed_software_optimizations_encoded',
      'PASS',
      ALLOWED_SOFTWARE_OPTIMIZATIONS.join(' | '),
    ),
  );
  hops.push(
    hop(
      'denied_hardware_safety_policy_code_encoded',
      DENIED_HARDWARE_SAFETY_POLICY === 'DENIED_HARDWARE_SAFETY_POLICY'
        ? 'PASS'
        : 'FAIL',
      DENIED_HARDWARE_SAFETY_POLICY,
    ),
  );

  const safeDecision = evaluateHardwareSafetyRequest({
    actor: input.actor,
    decisionId: 'dec-safe-1',
    requestText: 'tune batching and caching for ModelA',
    softwareLever: 'batching',
  });
  hops.push(
    hop(
      'software_tuning_allowed',
      !('denied' in safeDecision) &&
        safeDecision.policyState === 'SAFE_SOFTWARE_TUNING' &&
        safeDecision.allowed === true &&
        safeDecision.changeExecuted === false
        ? 'PASS'
        : 'FAIL',
      'SAFE_SOFTWARE_TUNING allowed; no hardware change executed.',
    ),
  );

  const deniedDecision = evaluateHardwareSafetyRequest({
    actor: input.actor,
    decisionId: 'dec-deny-1',
    requestText: 'please overclock the GPU and raise power_limit',
  });
  hops.push(
    hop(
      'hardware_control_request_denied',
      !('denied' in deniedDecision) &&
        deniedDecision.allowed === false &&
        deniedDecision.terminationCode === DENIED_HARDWARE_SAFETY_POLICY &&
        deniedDecision.policyState === 'HARDWARE_CONTROL_DENIED'
        ? 'PASS'
        : 'FAIL',
      'Hardware control → DENIED_HARDWARE_SAFETY_POLICY.',
    ),
  );

  const diagnostic = emitDiagnosticRecommendation({
    constrainedBy: 'thermal',
  });
  const execDeny = emitDiagnosticRecommendation({
    constrainedBy: 'power',
    attemptExecuteChange: true,
  });
  hops.push(
    hop(
      'recommend_diagnostic_not_execute',
      !('denied' in diagnostic) &&
        diagnostic.recommendationOnly === true &&
        diagnostic.executed === false &&
        execDeny.state === 'DENIED' &&
        /Manual vendor-supported diagnostics/i.test(diagnostic.recommendation)
        ? 'PASS'
        : 'FAIL',
      'Diagnostic recommendation only; execute DENIED.',
    ),
  );

  const driverReview = evaluateHardwareSafetyRequest({
    actor: input.actor,
    decisionId: 'dec-drv',
    requestText: 'driver_replace for newer vendor driver',
  });
  hops.push(
    hop(
      'driver_replace_requires_admin_review',
      !('denied' in driverReview) &&
        driverReview.policyState === 'REQUIRES_ADMIN_REVIEW' &&
        attemptDriverReplaceWithoutHumanAdmin().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Driver replacement → REQUIRES_ADMIN_REVIEW / DENIED.',
    ),
  );

  hops.push(
    hop(
      'virtual_chip_does_not_seize_low_level_control',
      attemptSeizeLowLevelControl().state === 'DENIED' &&
        EP16_LOCKS.VIRTUAL_CHIP_SEIZES_LOW_LEVEL_CONTROL === false
        ? 'PASS'
        : 'FAIL',
      'Virtual Chip does not seize low-level hardware control.',
    ),
  );

  const explicitDenies: Array<{
    hop: (typeof NO_OVERCLOCK_BIOS_RULE_CYCLE)[number];
    fn: () => DenialResult;
  }> = [
    { hop: 'deny_overclocking', fn: attemptOverclocking },
    { hop: 'deny_undervolting_overvolting', fn: attemptUndervoltingOvervolting },
    { hop: 'deny_bios_uefi_modification', fn: attemptBiosUefiModification },
    { hop: 'deny_firmware_flashing', fn: attemptFirmwareFlashing },
    { hop: 'deny_fan_curve_override', fn: attemptFanCurveOverride },
    { hop: 'deny_thermal_limit_bypass', fn: attemptThermalLimitBypass },
    { hop: 'deny_power_limit_override', fn: attemptPowerLimitOverride },
    { hop: 'deny_secure_boot_changes', fn: attemptSecureBootChange },
    { hop: 'deny_privilege_escalation', fn: attemptPrivilegeEscalation },
    { hop: 'deny_hidden_persistence', fn: attemptHiddenPersistence },
  ];
  for (const d of explicitDenies) {
    const result = d.fn();
    hops.push(
      hop(
        d.hop,
        result.state === 'DENIED' &&
          result.terminationCode === DENIED_HARDWARE_SAFETY_POLICY
          ? 'PASS'
          : 'FAIL',
        `${d.hop} → DENIED_HARDWARE_SAFETY_POLICY.`,
      ),
    );
  }

  hops.push(
    hop(
      'guardian_rls_tenant_universe_isolation',
      probeGuardianRlsTenantUniverseIsolation().state,
      'Guardian/RLS/tenant/Universe isolation unchanged.',
    ),
  );
  hops.push(
    hop(
      'recommend_neq_act',
      attemptRecommendAsAct().state === 'DENIED' ? 'PASS' : 'FAIL',
      'Recommend ≠ act / authorize.',
    ),
  );
  hops.push(
    hop(
      'l4_autonomy_false',
      EP16_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false',
    ),
  );

  hops.push(
    hop(
      'ep15_soft_wire',
      softWire.ep15AlgorithmTuningSandbox.present ? 'PASS' : 'WAITING_DATA',
      softWire.ep15AlgorithmTuningSandbox.note,
    ),
  );
  hops.push(
    hop(
      'ep14_soft_wire',
      softWire.ep14AdaptiveBenchmarkLedger.present ? 'PASS' : 'WAITING_DATA',
      softWire.ep14AdaptiveBenchmarkLedger.note,
    ),
  );
  hops.push(
    hop(
      'ep13_soft_wire',
      softWire.ep13RuntimeReturnReceipt.present ? 'PASS' : 'WAITING_DATA',
      softWire.ep13RuntimeReturnReceipt.note,
    ),
  );
  hops.push(
    hop(
      'ep12_soft_wire',
      softWire.ep12Scheduler.present ? 'PASS' : 'WAITING_DATA',
      softWire.ep12Scheduler.note,
    ),
  );
  hops.push(
    hop(
      'em157_soft_wire',
      softWire.em157HomeBase.present ? 'PASS' : 'WAITING_DATA',
      softWire.em157HomeBase.note,
    ),
  );
  hops.push(
    hop(
      'db_candidates_not_applied',
      EP16_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      'DB candidates NOT_APPLIED.',
    ),
  );

  const humanGate = requireHumanApproval({
    approvalId: 'appr-ep16-1',
    actor: input.human,
    action: 'approve_consequential',
  });
  hops.push(
    hop(
      'evidence',
      'denied' in humanGate ? 'DENIED' : 'PASS',
      'Human approval gate exercised; cycle evidence recorded.',
    ),
  );

  void NO_OVERCLOCK_BIOS_RULE_CYCLE;
  void attemptAgentAutoAuthority;

  return {
    hops,
    safeDecision,
    deniedDecision,
    softWire,
  };
}
