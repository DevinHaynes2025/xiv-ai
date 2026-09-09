/**
 * 62L-EP16 — No Overclock / BIOS Rule denial + honesty tests.
 *
 * Script: npm run test:62lep16
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

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
  HARDWARE_SAFETY_AGENT_BOUNDS,
  HARDWARE_SAFETY_POLICY_STATES,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  NO_OVERCLOCK_BIOS_RULE_CYCLE,
  PROHIBITED_HARDWARE_ACTIONS,
  assertEp16LocksIntact,
  ep16SoftWireSnapshot,
  type Ep16Actor,
} from './no-overclock-bios-rule-types.ts';

import {
  attemptAgentAutoAuthority,
  attemptBiosUefiModification,
  attemptDriverReplaceWithoutHumanAdmin,
  attemptFanCurveOverride,
  attemptFirmwareFlashing,
  attemptHiddenPersistence,
  attemptOverclocking,
  attemptPowerLimitOverride,
  attemptPrivilegeEscalation,
  attemptRecommendAsAct,
  attemptSecureBootChange,
  attemptSeizeLowLevelControl,
  attemptThermalLimitBypass,
  attemptUndervoltingOvervolting,
  bootstrapNoOverclockBiosRule,
  emitDiagnosticRecommendation,
  evaluateHardwareSafetyRequest,
  probeGuardianRlsTenantUniverseIsolation,
  requireHumanApproval,
  returnHardwareSafetyEvidenceToHomeBase,
  runNoOverclockBiosRuleCycle,
} from './no-overclock-bios-rule-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Ep16Actor = {
  kind: 'hardware_safety_gate',
  id: 'gate-1',
  orgId: 'org-ep16',
  tenantId: 'ten-ep16',
  universeId: 'uni-ep16',
  permissions: ['draft'],
};

const human: Ep16Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-ep16',
  tenantId: 'ten-ep16',
  universeId: 'uni-ep16',
  permissions: ['approve_consequential'],
};

test('SoT label EP16 / #160; GitLab mirror not invented; next EP17', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-EP16');
  assert.equal(GITHUB_SOT_ISSUE, 160);
  assert.match(GITHUB_SOT_TITLE, /No Overclock \/ BIOS Rule/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /EP17/);
  assert.match(NEXT_PHASE_TITLE, /Classical Quant Baseline/);
});

test('honesty locks: L4 false; no hardware control execution; DB NOT_APPLIED', () => {
  assert.equal(assertEp16LocksIntact(), true);
  assert.equal(EP16_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EP16_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(EP16_LOCKS.AGENT_MAY_EXECUTE_HARDWARE_CONTROL, false);
  assert.equal(EP16_LOCKS.AGENT_MAY_OVERCLOCK_OR_CHANGE_VOLTAGE, false);
  assert.equal(EP16_LOCKS.VIRTUAL_CHIP_SEIZES_LOW_LEVEL_CONTROL, false);
  assert.equal(EP16_LOCKS.TIP_LAND, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(HARDWARE_SAFETY_AGENT_BOUNDS.mayExecuteHardwareControl, false);
  assert.equal(HARDWARE_SAFETY_AGENT_BOUNDS.mayTreatDiagnosticAsExecute, false);
});

test('policy states + prohibited + allowed software + termination code encoded', () => {
  assert.deepEqual([...HARDWARE_SAFETY_POLICY_STATES], [
    'SAFE_SOFTWARE_TUNING',
    'REQUIRES_ADMIN_REVIEW',
    'HARDWARE_CONTROL_DENIED',
    'SECURITY_BOUNDARY_DENIED',
  ]);
  assert.equal(DENIED_HARDWARE_SAFETY_POLICY, 'DENIED_HARDWARE_SAFETY_POLICY');
  assert.ok(PROHIBITED_HARDWARE_ACTIONS.includes('cpu_gpu_overclocking'));
  assert.ok(PROHIBITED_HARDWARE_ACTIONS.includes('bios_uefi_modification'));
  assert.ok(
    PROHIBITED_HARDWARE_ACTIONS.includes(
      'hidden_persistence_for_hardware_control',
    ),
  );
  assert.ok(ALLOWED_SOFTWARE_OPTIMIZATIONS.includes('batching'));
  assert.ok(ALLOWED_SOFTWARE_OPTIMIZATIONS.includes('quantization'));
  assert.ok(ALLOWED_SOFTWARE_OPTIMIZATIONS.includes('local_edge_cloud_routing'));
  assert.ok(EP16_MAY.includes('emit_human_readable_diagnostic_recommendations_only'));
  assert.ok(EP16_MUST_NOT.includes('execute_cpu_gpu_overclocking'));
});

test('SAFE_SOFTWARE_TUNING allowed; hardware overclock → DENIED_HARDWARE_SAFETY_POLICY', () => {
  const safe = evaluateHardwareSafetyRequest({
    actor: agent,
    decisionId: 'd-safe',
    requestText: 'increase batching and enable caching',
    softwareLever: 'batching',
  });
  assert.ok(!('denied' in safe));
  assert.equal(safe.policyState, 'SAFE_SOFTWARE_TUNING');
  assert.equal(safe.allowed, true);
  assert.equal(safe.changeExecuted, false);
  assert.equal(safe.terminationCode, null);

  const denied = evaluateHardwareSafetyRequest({
    actor: agent,
    decisionId: 'd-oc',
    requestText: 'overclock GPU clocks for more speed',
  });
  assert.ok(!('denied' in denied));
  assert.equal(denied.allowed, false);
  assert.equal(denied.policyState, 'HARDWARE_CONTROL_DENIED');
  assert.equal(denied.terminationCode, DENIED_HARDWARE_SAFETY_POLICY);
  assert.equal(denied.changeExecuted, false);
});

test('diagnostic recommendation only; execute change denied', () => {
  const diag = emitDiagnosticRecommendation({ constrainedBy: 'power' });
  assert.ok(!('denied' in diag));
  assert.equal(diag.executed, false);
  assert.equal(diag.recommendationOnly, true);
  assert.match(diag.recommendation, /Manual vendor-supported diagnostics/i);
  assert.match(diag.recommendation, /power\/thermal/i);

  assert.equal(
    emitDiagnosticRecommendation({
      constrainedBy: 'thermal',
      attemptExecuteChange: true,
    }).state,
    'DENIED',
  );
  assert.equal(
    evaluateHardwareSafetyRequest({
      actor: agent,
      decisionId: 'd-exec',
      requestText: 'tune batching',
      softwareLever: 'batching',
      attemptExecuteHardwareControl: true,
    }).state,
    'DENIED',
  );
});

test('driver replace → REQUIRES_ADMIN_REVIEW; security boundary denies', () => {
  const drv = evaluateHardwareSafetyRequest({
    actor: agent,
    decisionId: 'd-drv',
    requestText: 'perform driver_replace automatically',
  });
  assert.ok(!('denied' in drv));
  assert.equal(drv.policyState, 'REQUIRES_ADMIN_REVIEW');
  assert.equal(drv.terminationCode, DENIED_HARDWARE_SAFETY_POLICY);
  assert.equal(attemptDriverReplaceWithoutHumanAdmin().state, 'DENIED');

  const sec = evaluateHardwareSafetyRequest({
    actor: agent,
    decisionId: 'd-sec',
    requestText: 'disable secure_boot and install hidden_persistence',
  });
  assert.ok(!('denied' in sec));
  assert.equal(sec.policyState, 'SECURITY_BOUNDARY_DENIED');
  assert.equal(sec.terminationCode, DENIED_HARDWARE_SAFETY_POLICY);
});

test('all explicit hardware-control attempts terminate with safety policy', () => {
  const attempts = [
    attemptOverclocking(),
    attemptUndervoltingOvervolting(),
    attemptBiosUefiModification(),
    attemptFirmwareFlashing(),
    attemptFanCurveOverride(),
    attemptThermalLimitBypass(),
    attemptPowerLimitOverride(),
    attemptSecureBootChange(),
    attemptPrivilegeEscalation(),
    attemptHiddenPersistence(),
    attemptSeizeLowLevelControl(),
  ];
  for (const a of attempts) {
    assert.equal(a.state, 'DENIED');
    assert.equal(a.terminationCode, DENIED_HARDWARE_SAFETY_POLICY);
    assert.equal(a.executed, false);
  }
});

test('bootstrap + soft-wire + cycle; home base; guardian unchanged', () => {
  const boot = bootstrapNoOverclockBiosRule(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.terminationCode, DENIED_HARDWARE_SAFETY_POLICY);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');
  assert.equal(boot.sot.issue, 160);

  const soft = ep16SoftWireSnapshot(repoRoot);
  assert.equal(soft.ep15AlgorithmTuningSandbox.present, true);
  assert.equal(soft.ep14AdaptiveBenchmarkLedger.present, true);
  assert.equal(soft.ep13RuntimeReturnReceipt.present, true);
  assert.equal(soft.ep12Scheduler.present, true);

  assert.equal(attemptRecommendAsAct().state, 'DENIED');
  assert.equal(attemptAgentAutoAuthority().state, 'DENIED');

  const ev = returnHardwareSafetyEvidenceToHomeBase({
    evidenceId: 'ev-ep16-1',
    actor: agent,
    summary: 'hardware safety advisory',
  });
  assert.ok(!('denied' in ev));
  assert.equal(ev.authorityGranted, false);
  assert.equal(probeGuardianRlsTenantUniverseIsolation().state, 'PASS');

  const gate = requireHumanApproval({
    approvalId: 'a1',
    actor: human,
    action: 'approve_consequential',
  });
  assert.ok(!('denied' in gate));

  const cycle = runNoOverclockBiosRuleCycle({
    actor: agent,
    human,
    repoRoot,
  });
  assert.equal(cycle.hops.length, NO_OVERCLOCK_BIOS_RULE_CYCLE.length);
  const hopNames = cycle.hops.map((h) => h.hop);
  for (const expected of NO_OVERCLOCK_BIOS_RULE_CYCLE) {
    assert.ok(hopNames.includes(expected), `missing hop ${expected}`);
  }
  const realFails = cycle.hops.filter((h) => h.state === 'FAIL');
  assert.equal(realFails.length, 0, JSON.stringify(realFails));
  assert.ok(!('denied' in cycle.safeDecision));
  assert.equal(cycle.safeDecision.policyState, 'SAFE_SOFTWARE_TUNING');
  assert.ok(!('denied' in cycle.deniedDecision));
  assert.equal(
    cycle.deniedDecision.terminationCode,
    DENIED_HARDWARE_SAFETY_POLICY,
  );
});
