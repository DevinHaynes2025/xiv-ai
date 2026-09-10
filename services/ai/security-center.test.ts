/**
 * US-SEC-01 Security Center — policy denials visible contract.
 * Run: npx tsx security-center.test.ts
 */

import assert from 'node:assert/strict';

import {
  SECURITY_CENTER_POLICY,
  clearPolicyDenials,
  evaluateAndRecordPolicyDenial,
  listGuardianReadOnlyChecks,
  listRecordedPolicyDenials,
  listSecurityCenterView,
  probeKnownPolicyDenials,
  recordPolicyDenial,
  resetSecurityCenterSession,
  securityCenterAllowsL4,
  securityCenterAllowsLiveExploitTooling,
  securityCenterAllowsProductionMutation,
} from './security-center';
import { evaluatePolicy } from './runtime/policy';

function main() {
  assert.equal(SECURITY_CENTER_POLICY.l4Autonomy, false);
  assert.equal(SECURITY_CENTER_POLICY.productionMutation, false);
  assert.equal(SECURITY_CENTER_POLICY.liveExploitTooling, false);
  assert.equal(SECURITY_CENTER_POLICY.guardianMode, 'read_only_checks');
  assert.equal(SECURITY_CENTER_POLICY.surface, 'policy_denials');
  assert.equal(securityCenterAllowsL4(), false);
  assert.equal(securityCenterAllowsProductionMutation(), false);
  assert.equal(securityCenterAllowsLiveExploitTooling(), false);

  resetSecurityCenterSession();
  assert.equal(listRecordedPolicyDenials().length, 0);

  const unbound = listSecurityCenterView();
  assert.equal(unbound.status, 'WAITING_DATA');
  assert.equal(unbound.role, 'executive');
  assert.equal(unbound.l4Autonomy, false);
  assert.equal(unbound.productionMutation, false);
  assert.equal(unbound.liveExploitTooling, false);
  assert.equal(unbound.guardianMode, 'read_only_checks');
  assert.equal(unbound.denialGate, 'WAITING_DATA');
  assert.equal(unbound.denials, null);
  assert.equal(unbound.incidents, null);
  assert.match(unbound.note, /WAITING_DATA/);
  assert.match(unbound.note, /not fabricated|Incidents are not fabricated/i);
  assert.ok(unbound.guardianChecks.length > 0);
  for (const check of unbound.guardianChecks) {
    assert.equal(check.readOnly, true);
    assert.match(check.note, /not live exploit tooling/i);
  }

  const catalog = listGuardianReadOnlyChecks();
  assert.equal(catalog.length, unbound.guardianChecks.length);
  assert.ok(catalog.some((c) => c.id === 'mobile-typescript'));
  assert.ok(catalog.every((c) => c.readOnly === true));

  // Allowed evaluation must NOT be recorded as a denial
  const allowed = evaluatePolicy({
    agentId: 'operations',
    toolId: 'business_context_reader',
    environment: 'prototype',
  });
  assert.equal(allowed.verdict, 'allowed');
  assert.equal(recordPolicyDenial(allowed), null);
  assert.equal(listRecordedPolicyDenials().length, 0);
  assert.equal(listSecurityCenterView().denialGate, 'WAITING_DATA');

  // Real denial path
  const { evaluation, record } = evaluateAndRecordPolicyDenial({
    agentId: 'guardian',
    toolId: 'business_context_reader',
    environment: 'prototype',
  });
  assert.equal(evaluation.verdict, 'denied');
  assert.ok(record);
  assert.equal(record!.verdict, 'denied');
  assert.equal(record!.incidentFabricated, false);
  assert.equal(record!.liveExploitTooling, false);
  assert.equal(record!.productionMutation, false);
  assert.equal(record!.source, 'policy_evaluation');
  assert.equal(record!.agentId, 'guardian');

  const bound = listSecurityCenterView();
  assert.equal(bound.status, 'READY');
  assert.equal(bound.denialGate, 'SESSION_DENIALS');
  assert.ok(bound.denials);
  assert.equal(bound.denials!.length, 1);
  assert.equal(bound.incidents, null);
  assert.equal(bound.l4Autonomy, false);
  assert.equal(bound.liveExploitTooling, false);
  assert.match(bound.note, /SESSION_DENIALS/);
  assert.match(bound.note, /never fabricated|not fabricated|Incidents remain null/i);

  // requires_approval is not a denial record
  clearPolicyDenials();
  const needsApproval = evaluatePolicy({
    agentId: 'executive',
    toolId: 'propose_operational_change',
  });
  assert.equal(needsApproval.verdict, 'requires_approval');
  assert.equal(recordPolicyDenial(needsApproval), null);
  assert.equal(listSecurityCenterView().denialGate, 'WAITING_DATA');
  assert.equal(listSecurityCenterView().denials, null);
  assert.equal(listSecurityCenterView().incidents, null);

  // Probe known deny paths — real evaluatePolicy, not invented incidents
  resetSecurityCenterSession();
  const probed = probeKnownPolicyDenials();
  assert.ok(probed.length >= 2);
  assert.ok(probed.every((d) => d.verdict === 'denied'));
  assert.ok(probed.every((d) => d.incidentFabricated === false));
  const probedView = listSecurityCenterView();
  assert.equal(probedView.denialGate, 'SESSION_DENIALS');
  assert.equal(probedView.incidents, null);
  assert.equal(probedView.productionMutation, false);
  assert.equal(probedView.liveExploitTooling, false);

  clearPolicyDenials();
  resetSecurityCenterSession();
  const again = listSecurityCenterView();
  assert.equal(again.status, 'WAITING_DATA');
  assert.equal(again.denialGate, 'WAITING_DATA');
  assert.equal(again.denials, null);
  assert.equal(again.incidents, null);

  console.log(
    'ok - US-SEC-01 security center (Guardian read-only checks; WAITING_DATA unbound; SESSION_DENIALS from real policy; never fabricate incidents; L4 false; no exploit tooling)',
  );
}

main();
