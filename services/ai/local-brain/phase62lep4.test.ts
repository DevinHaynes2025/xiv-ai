/**
 * 62L-EP4 — Proprietary-IP Firewall denial + honesty tests.
 *
 * Script: npm run test:62lep4
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  BLOCKED_SENSITIVITY_MATERIALS,
  EP4_DB_CANDIDATES_STATUS,
  EP4_LOCKS,
  EP4_MAY,
  EP4_MUST_NOT,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  IP_FIREWALL_AGENT_BOUNDS,
  IP_FIREWALL_CORE_FLOW,
  IP_FIREWALL_PROMOTION_WORKFLOW,
  NEURAL_MEMORY_FIELDS,
  NEXT_PHASE_TITLE,
  PROMOTED_NODE_AUDIT_FIELDS,
  PROPRIETARY_IP_FIREWALL_CYCLE,
  SOURCE_RIGHTS_STATES,
  assertEp4LocksIntact,
  decideFirewallAction,
  ep4SoftWireSnapshot,
  type Ep4Actor,
} from './proprietary-ip-firewall-types.ts';

import {
  attemptAgentAutoAuthority,
  attemptBlockedSensitivityIngest,
  attemptBypassPaywall,
  attemptCloneProprietaryDatabases,
  attemptHarvestCredentials,
  attemptReinterpretResearchAsCopyPermission,
  attemptScrapePrivateSystems,
  attemptSharePrivateAcrossTenants,
  attemptUseLeakedRepositories,
  bootstrapProprietaryIpFirewall,
  classifySourceRights,
  identifyDependentsOnRevocation,
  prepareKnowledgeCandidate,
  probeGuardianRlsTenantUniverseIsolation,
  promoteWithReviewerApproval,
  requireHumanApproval,
  returnAgentEvidenceToHomeBase,
  runProprietaryIpFirewallCycle,
} from './proprietary-ip-firewall-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const researcher: Ep4Actor = {
  kind: 'research_agent',
  id: 'res-1',
  orgId: 'org-ep4',
  tenantId: 'ten-ep4',
  universeId: 'uni-ep4',
  permissions: ['draft'],
};

const human: Ep4Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-ep4',
  tenantId: 'ten-ep4',
  universeId: 'uni-ep4',
  permissions: ['approve_consequential', 'authorize_graph_promotion'],
};

test('SoT label EP4 / #160; GitLab mirror not invented; next EP5', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-EP4');
  assert.equal(GITHUB_SOT_ISSUE, 160);
  assert.match(GITHUB_SOT_TITLE, /Proprietary-IP Firewall/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /EP5/);
  assert.match(NEXT_PHASE_TITLE, /Public Benchmark Memory/);
});

test('honesty locks: L4 false; UNKNOWN_RIGHTS not auto-accept; DB NOT_APPLIED', () => {
  assert.equal(assertEp4LocksIntact(), true);
  assert.equal(EP4_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EP4_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(EP4_LOCKS.UNKNOWN_RIGHTS_AUTO_ACCEPT, false);
  assert.equal(EP4_LOCKS.PRIVATE_CUSTOMER_EQ_GLOBAL_CORPUS, false);
  assert.equal(EP4_LOCKS.AUTO_GRAPH_PROMOTION_WITHOUT_REVIEW, false);
  assert.equal(EP4_LOCKS.TIP_LAND, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
});

test('core flow + rights states + blocked materials + workflow + audit fields encoded', () => {
  assert.deepEqual(
    [...IP_FIREWALL_CORE_FLOW],
    [
      'source',
      'rights_check',
      'classification',
      'allow_quarantine_or_deny',
      'research_use',
    ],
  );

  assert.equal(SOURCE_RIGHTS_STATES.length, 12);
  assert.ok(SOURCE_RIGHTS_STATES.includes('UNKNOWN_RIGHTS'));
  assert.ok(SOURCE_RIGHTS_STATES.includes('LEAKED_OR_STOLEN'));

  assert.equal(BLOCKED_SENSITIVITY_MATERIALS.length, 11);
  assert.ok(BLOCKED_SENSITIVITY_MATERIALS.includes('firmware_signing_keys'));

  assert.equal(IP_FIREWALL_PROMOTION_WORKFLOW.length, 8);
  assert.deepEqual(
    [...NEURAL_MEMORY_FIELDS],
    ['claim', 'citation', 'provenance', 'rightsState', 'confidence', 'context'],
  );
  assert.equal(PROMOTED_NODE_AUDIT_FIELDS.length, 9);

  assert.equal(decideFirewallAction('UNKNOWN_RIGHTS'), 'QUARANTINE');
  assert.equal(decideFirewallAction('LEAKED_OR_STOLEN'), 'DENY');
  assert.equal(decideFirewallAction('VENDOR_PUBLIC_DOCUMENTATION'), 'ALLOW');
});

test('UNKNOWN_RIGHTS quarantined; restricted/leaked/confidential denied', () => {
  const unknown = classifySourceRights({
    sourceId: 's-u',
    rightsState: 'UNKNOWN_RIGHTS',
    actor: researcher,
  });
  assert.equal('denied' in unknown, false);
  if (!('denied' in unknown)) {
    assert.equal(unknown.decision, 'QUARANTINE');
    assert.equal(unknown.quarantined, true);
    assert.equal(unknown.promoted, false);
  }

  const autoUnknown = classifySourceRights({
    sourceId: 's-u2',
    rightsState: 'UNKNOWN_RIGHTS',
    actor: researcher,
    attemptAutoAcceptUnknown: true,
  });
  assert.equal('denied' in autoUnknown && autoUnknown.denied, true);

  for (const state of [
    'RESTRICTED',
    'LEAKED_OR_STOLEN',
    'CONFIDENTIAL',
  ] as const) {
    const denied = classifySourceRights({
      sourceId: `s-${state}`,
      rightsState: state,
      actor: researcher,
      attemptAutoPromoteBlocked: true,
    });
    assert.equal('denied' in denied && denied.denied, true);
  }

  assert.ok(EP4_MUST_NOT.includes('auto_accept_unknown_rights'));
  assert.ok(EP4_MAY.includes('quarantine_unknown_rights'));
});

test('blocked sensitivity materials denied; lawful allow path to candidate', () => {
  for (const material of BLOCKED_SENSITIVITY_MATERIALS) {
    const denied = attemptBlockedSensitivityIngest(material);
    assert.equal(denied.state, 'DENIED');
  }

  const hit = classifySourceRights({
    sourceId: 's-hit',
    rightsState: 'VENDOR_PUBLIC_DOCUMENTATION',
    actor: researcher,
    sensitivityHits: ['trade_secrets'],
  });
  assert.equal('denied' in hit && hit.denied, true);

  const ok = classifySourceRights({
    sourceId: 's-ok',
    rightsState: 'VENDOR_PUBLIC_DOCUMENTATION',
    actor: researcher,
  });
  assert.equal('denied' in ok, false);
  if ('denied' in ok) return;

  const candidate = prepareKnowledgeCandidate({
    candidateId: 'cand-1',
    classification: ok,
    claim: 'AMD NPU documented runtime path',
    citation: 'vendor-public-doc',
    provenance: 'rights=VENDOR_PUBLIC_DOCUMENTATION',
  });
  assert.equal('denied' in candidate, false);
  if (!('denied' in candidate)) {
    assert.equal(candidate.promoted, false);
    assert.equal(candidate.proprietaryRepoCopied, false);
  }

  const copyDenied = prepareKnowledgeCandidate({
    candidateId: 'cand-bad',
    classification: ok,
    claim: 'x',
    citation: 'y',
    provenance: 'z',
    attemptCopyProprietaryRepo: true,
  });
  assert.equal('denied' in copyDenied && copyDenied.denied, true);
});

test('promotion requires human review; private ≠ global; revocation identifies dependents', () => {
  const ok = classifySourceRights({
    sourceId: 's-prom',
    rightsState: 'LICENSED',
    actor: researcher,
  });
  assert.equal('denied' in ok, false);
  if ('denied' in ok) return;

  const candidate = prepareKnowledgeCandidate({
    candidateId: 'cand-prom',
    classification: ok,
    claim: 'licensed claim',
    citation: 'license-doc',
    provenance: 'licensed',
  });
  assert.equal('denied' in candidate, false);
  if ('denied' in candidate) return;

  const noHuman = promoteWithReviewerApproval({
    candidate,
    reviewer: researcher,
    purpose: 'research',
    attemptPromoteWithoutHumanReviewer: true,
  });
  assert.equal('denied' in noHuman && noHuman.denied, true);

  const globalDenied = promoteWithReviewerApproval({
    candidate,
    reviewer: human,
    purpose: 'research',
    attemptShareToGlobalCorpus: true,
  });
  assert.equal('denied' in globalDenied && globalDenied.denied, true);

  const promoted = promoteWithReviewerApproval({
    candidate,
    reviewer: human,
    purpose: 'tenant_research',
  });
  assert.equal('denied' in promoted, false);
  if (!('denied' in promoted)) {
    assert.equal(promoted.promoted, true);
    assert.equal(promoted.globalCorpusShared, false);
    assert.ok(promoted.revocationPath.includes('revoke://'));
  }

  const skipRev = identifyDependentsOnRevocation({
    sourceId: 's-prom',
    tenantId: 'ten-ep4',
    universeId: 'uni-ep4',
    dependentArtifactIds: ['a1'],
    attemptSkipIdentification: true,
  });
  assert.equal('denied' in skipRev && skipRev.denied, true);

  const rev = identifyDependentsOnRevocation({
    sourceId: 's-prom',
    tenantId: 'ten-ep4',
    universeId: 'uni-ep4',
    dependentArtifactIds: ['a1', 'a2'],
  });
  assert.equal('denied' in rev, false);
  if (!('denied' in rev)) {
    assert.equal(rev.dependents.length, 2);
    assert.equal(rev.executed, false);
  }
});

test('agent safeguards: paywall, credentials, scrape, leak, clone, cross-tenant, research≠copy', () => {
  assert.equal(attemptBypassPaywall().state, 'DENIED');
  assert.equal(attemptHarvestCredentials().state, 'DENIED');
  assert.equal(attemptScrapePrivateSystems().state, 'DENIED');
  assert.equal(attemptUseLeakedRepositories().state, 'DENIED');
  assert.equal(attemptCloneProprietaryDatabases().state, 'DENIED');
  assert.equal(attemptSharePrivateAcrossTenants().state, 'DENIED');
  assert.equal(attemptReinterpretResearchAsCopyPermission().state, 'DENIED');

  assert.equal(IP_FIREWALL_AGENT_BOUNDS.automaticAuthority, false);
  assert.equal(attemptAgentAutoAuthority(researcher).state, 'DENIED');

  const evidence = returnAgentEvidenceToHomeBase({
    evidenceId: 'ev-1',
    actor: researcher,
    summary: 'Rights classification candidate',
  });
  assert.equal('denied' in evidence, false);

  const isolation = probeGuardianRlsTenantUniverseIsolation();
  assert.equal(isolation.unchanged, true);

  const humanOk = requireHumanApproval({
    approvalId: 'ok',
    sourceId: 's1',
    actor: human,
    action: 'authorize_graph_promotion',
  });
  assert.equal('denied' in humanOk, false);
});

test('soft-wire EP2/EP1 present; EP3 WAITING_DATA on EP2 tip', () => {
  const snap = ep4SoftWireSnapshot(repoRoot);
  assert.equal(snap.ep2CapabilityGraph.present, true);
  assert.equal(snap.ep2Report.present, true);
  assert.equal(snap.ep1VirtualChipContract.present, true);
  assert.equal(snap.ep1Report.present, true);
  assert.equal(snap.ep3ChipResearchAgentTeam.present, false);
  assert.equal(typeof snap.em157HomeBase.present, 'boolean');
});

test('cycle covers pack surfaces + bootstrap', () => {
  for (const required of [
    'core_flow_encoded',
    'source_rights_states_encoded',
    'unknown_rights_quarantined',
    'restricted_leaked_confidential_denied',
    'organization_boundary_private_neq_global',
    'no_agent_bypass_paywall',
    'no_cross_tenant_private_share',
    'revocation_identifies_dependents',
    'l4_autonomy_false',
    'ep2_soft_wire',
    'ep3_soft_wire',
  ] as const) {
    assert.ok(PROPRIETARY_IP_FIREWALL_CYCLE.includes(required), required);
  }

  const boot = bootstrapProprietaryIpFirewall(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.rightsStates.length, 12);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');

  const cycle = runProprietaryIpFirewallCycle({
    actor: researcher,
    human,
    repoRoot,
  });
  assert.ok(cycle.hops.length >= 20);
  assert.equal('denied' in cycle.classification, false);
  assert.equal(cycle.softWire.ep2CapabilityGraph.present, true);
  assert.equal(cycle.softWire.ep3ChipResearchAgentTeam.present, false);
});
