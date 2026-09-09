/**
 * 62L-EQ4 — Proprietary ISA Boundary denial + honesty tests.
 *
 * Script: npm run test:62leq4
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  ALLOWED_LEARNING_TARGETS,
  ALLOWED_RESEARCH_SOURCES,
  ARCHITECTURE_KNOWLEDGE_AUDIT_FIELDS,
  BLOCKED_LEARNING_TARGETS,
  BLOCKED_OR_QUARANTINED_MATERIAL,
  EQ4_DB_CANDIDATES_STATUS,
  EQ4_LOCKS,
  EQ4_MAY,
  EQ4_MUST_NOT,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  PROPRIETARY_ISA_BOUNDARY_CYCLE,
  PROPRIETARY_ISA_BOUNDARY_FLOW,
  RIGHTS_CLASSIFICATION_OUTCOMES,
  RIGHTS_GATE_AGENT_BOUNDS,
  SOURCE_RIGHTS_STATES,
  assertEq4LocksIntact,
  classifyRightsState,
  eq4SoftWireSnapshot,
  type Eq4Actor,
} from './proprietary-isa-boundary-types.ts';

import {
  attemptAutoIngestUnknownRights,
  attemptConfidentialMicroarchitectureIngestion,
  attemptCopyProprietaryDesign,
  attemptFirmwareSigningKeysIngestion,
  attemptLearnConfidentialImplementationInternals,
  attemptLeakedOrStolenIngestion,
  attemptPrivateRtlIngestion,
  attemptPromoteQuarantineToGlobal,
  attemptPromoteTenantPrivateToGlobalKb,
  attemptRecommendAsAct,
  attemptTradeSecretsIngestion,
  bootstrapProprietaryIsaBoundary,
  classifySource,
  emitArchitectureKnowledgeNode,
  exampleAuthorizedPrivateTenantOnly,
  examplePublicIsaAllow,
  exampleUnknownRightsQuarantine,
  probeGuardianRlsTenantUniverseIsolation,
  requireHumanApproval,
  returnBoundaryEvidenceToHomeBase,
  runProprietaryIsaBoundaryCycle,
} from './proprietary-isa-boundary-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Eq4Actor = {
  kind: 'rights_gate',
  id: 'rg-1',
  orgId: 'org-eq4',
  tenantId: 'ten-eq4',
  universeId: 'uni-eq4',
  permissions: ['draft'],
};

const human: Eq4Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-eq4',
  tenantId: 'ten-eq4',
  universeId: 'uni-eq4',
  permissions: ['approve_consequential'],
};

test('SoT label EQ4 / #161; GitLab mirror not invented; next EQ5', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-EQ4');
  assert.equal(GITHUB_SOT_ISSUE, 161);
  assert.equal(GITHUB_SOT_FAMILY, '62L-EQ');
  assert.match(GITHUB_SOT_TITLE, /Proprietary ISA Boundary/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /EQ5/);
  assert.match(NEXT_PHASE_TITLE, /Compiler\/IR Translation Layer/);
});

test('honesty locks: L4 false; UNKNOWN_RIGHTS not auto-ingest; DB NOT_APPLIED', () => {
  assert.equal(assertEq4LocksIntact(), true);
  assert.equal(EQ4_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EQ4_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(EQ4_LOCKS.UNKNOWN_RIGHTS_AUTO_INGEST, false);
  assert.equal(EQ4_LOCKS.TENANT_PRIVATE_EQ_GLOBAL_KB, false);
  assert.equal(EQ4_LOCKS.LEARN_CONFIDENTIAL_IMPLEMENTATION_INTERNALS, false);
  assert.equal(EQ4_LOCKS.COPY_PROPRIETARY_DESIGN, false);
  assert.equal(EQ4_LOCKS.PROMOTE_QUARANTINE_TO_GLOBAL, false);
  assert.equal(EQ4_LOCKS.TIP_LAND, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(RIGHTS_GATE_AGENT_BOUNDS.mayAutoIngestUnknownRights, false);
  assert.equal(RIGHTS_GATE_AGENT_BOUNDS.mayPromoteTenantPrivateToGlobalKb, false);
  assert.equal(classifyRightsState('UNKNOWN_RIGHTS'), 'QUARANTINE');
  assert.equal(classifyRightsState('PUBLIC_OPEN'), 'ALLOW');
  assert.equal(classifyRightsState('LEAKED_OR_STOLEN'), 'DENY');
});

test('allowed sources + blocked material + rights states + flow + audit encoded', () => {
  assert.ok(ALLOWED_RESEARCH_SOURCES.includes('public_isa_specifications'));
  assert.ok(ALLOWED_RESEARCH_SOURCES.includes('xiv_owned_benchmark_results'));
  assert.ok(BLOCKED_OR_QUARANTINED_MATERIAL.includes('private_rtl'));
  assert.ok(
    BLOCKED_OR_QUARANTINED_MATERIAL.includes(
      'reverse_engineered_restricted_implementation_details',
    ),
  );
  assert.deepEqual([...SOURCE_RIGHTS_STATES], [
    'PUBLIC_OPEN',
    'PUBLIC_VENDOR_DOC',
    'LICENSED',
    'AUTHORIZED_PRIVATE',
    'UNKNOWN_RIGHTS',
    'RESTRICTED',
    'CONFIDENTIAL',
    'LEAKED_OR_STOLEN',
  ]);
  assert.deepEqual([...RIGHTS_CLASSIFICATION_OUTCOMES], [
    'ALLOW',
    'QUARANTINE',
    'DENY',
  ]);
  assert.deepEqual([...PROPRIETARY_ISA_BOUNDARY_FLOW], [
    'source',
    'rights_provenance_check',
    'classification',
    'allow_quarantine_or_deny',
    'knowledge_graph',
  ]);
  assert.ok(ARCHITECTURE_KNOWLEDGE_AUDIT_FIELDS.includes('sourceId'));
  assert.ok(ARCHITECTURE_KNOWLEDGE_AUDIT_FIELDS.includes('rightsState'));
  assert.ok(ARCHITECTURE_KNOWLEDGE_AUDIT_FIELDS.includes('revocationPath'));
  assert.ok(ALLOWED_LEARNING_TARGETS.includes('instruction_semantics'));
  assert.ok(BLOCKED_LEARNING_TARGETS.includes('copied_proprietary_design'));
  assert.ok(EQ4_MAY.includes('quarantine_unknown_rights_instead_of_auto_ingest'));
  assert.ok(EQ4_MUST_NOT.includes('auto_ingest_unknown_rights'));
});

test('UNKNOWN_RIGHTS → QUARANTINE; public ALLOW; confidential DENY', () => {
  const q = exampleUnknownRightsQuarantine();
  assert.equal(q.outcome, 'QUARANTINE');
  assert.equal(q.entersKnowledgeGraph, false);
  assert.equal(attemptAutoIngestUnknownRights().state, 'DENIED');
  assert.equal(
    classifySource({
      sourceId: 'bad-auto',
      rightsState: 'UNKNOWN_RIGHTS',
      architectureFeature: 'x',
      claim: 'DOCUMENTED',
      purpose: 'test',
      reviewer: 'r',
      learningTarget: 'instruction_semantics',
      attemptAutoIngestUnknownRights: true,
    }).state,
    'DENIED',
  );

  const pub = examplePublicIsaAllow(agent);
  assert.equal(pub.classification.outcome, 'ALLOW');
  assert.equal(pub.node.globalKnowledgeBase, true);
  assert.equal(pub.node.revocationPath, 'eq4/revoke/src-public-isa-1');

  const denied = classifySource({
    sourceId: 'src-conf',
    rightsState: 'CONFIDENTIAL',
    architectureFeature: 'microarch',
    claim: 'DOCUMENTED',
    purpose: 'test',
    reviewer: 'r',
    learningTarget: 'instruction_semantics',
  });
  assert.ok(!('denied' in denied));
  assert.equal(denied.outcome, 'DENY');
  assert.equal(denied.entersKnowledgeGraph, false);
});

test('tenant AUTHORIZED_PRIVATE not global KB; quarantine not promotable', () => {
  const priv = exampleAuthorizedPrivateTenantOnly(agent);
  assert.equal(priv.classification.tenantUniverseOnly, true);
  assert.equal(priv.node.globalKnowledgeBase, false);
  assert.equal(attemptPromoteTenantPrivateToGlobalKb().state, 'DENIED');
  assert.equal(attemptPromoteQuarantineToGlobal().state, 'DENIED');

  assert.equal(
    classifySource({
      sourceId: 'src-priv-bad',
      rightsState: 'AUTHORIZED_PRIVATE',
      architectureFeature: 'org_doc',
      claim: 'DOCUMENTED',
      purpose: 'test',
      reviewer: 'r',
      learningTarget: 'workload_mapping',
      // missing tenant/universe
      attemptPromoteTenantPrivateToGlobal: true,
    }).state,
    'DENIED',
  );

  const noScope = classifySource({
    sourceId: 'src-priv-noscope',
    rightsState: 'AUTHORIZED_PRIVATE',
    architectureFeature: 'org_doc',
    claim: 'DOCUMENTED',
    purpose: 'test',
    reviewer: 'r',
    learningTarget: 'workload_mapping',
  });
  assert.equal(noScope.state, 'DENIED');
});

test('boundary denies RTL / keys / leaked / trade secrets / proprietary copy', () => {
  assert.equal(attemptPrivateRtlIngestion().state, 'DENIED');
  assert.equal(attemptConfidentialMicroarchitectureIngestion().state, 'DENIED');
  assert.equal(attemptFirmwareSigningKeysIngestion().state, 'DENIED');
  assert.equal(attemptLeakedOrStolenIngestion().state, 'DENIED');
  assert.equal(attemptTradeSecretsIngestion().state, 'DENIED');
  assert.equal(attemptLearnConfidentialImplementationInternals().state, 'DENIED');
  assert.equal(attemptCopyProprietaryDesign().state, 'DENIED');

  const rtl = classifySource({
    sourceId: 'src-rtl',
    rightsState: 'CONFIDENTIAL',
    architectureFeature: 'rtl',
    claim: 'DOCUMENTED',
    purpose: 'test',
    reviewer: 'r',
    learningTarget: 'instruction_semantics',
    blockedMaterial: 'private_rtl',
  });
  assert.ok(!('denied' in rtl));
  assert.equal(rtl.outcome, 'DENY');

  assert.equal(
    classifySource({
      sourceId: 'src-copy',
      rightsState: 'PUBLIC_OPEN',
      architectureFeature: 'x',
      claim: 'DOCUMENTED',
      purpose: 'test',
      reviewer: 'r',
      learningTarget: 'copied_proprietary_design',
    }).state,
    'DENIED',
  );

  assert.equal(
    emitArchitectureKnowledgeNode({
      actor: agent,
      classification: exampleUnknownRightsQuarantine(),
      architectureFeature: 'x',
      claim: 'DOCUMENTED',
      purpose: 'test',
      reviewer: 'r',
    }).state,
    'DENIED',
  );
});

test('bootstrap + soft-wire + cycle; home base; guardian unchanged', () => {
  const boot = bootstrapProprietaryIsaBoundary(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.allowedSources.length, ALLOWED_RESEARCH_SOURCES.length);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');
  assert.equal(boot.sot.issue, 161);

  const soft = eq4SoftWireSnapshot(repoRoot);
  assert.equal(soft.eq3RiscvOpenIsaKnowledgePack.present, true);
  assert.equal(soft.eq2ArmArchitectureKnowledgePack.present, true);
  assert.equal(soft.eq1CrossArchitectureContract.present, true);
  assert.equal(soft.ep16NoOverclockBiosRule.present, true);

  assert.equal(attemptRecommendAsAct().state, 'DENIED');
  const ev = returnBoundaryEvidenceToHomeBase({
    evidenceId: 'ev-eq4-1',
    actor: agent,
    summary: 'rights gate advisory',
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

  const cycle = runProprietaryIsaBoundaryCycle({
    actor: agent,
    human,
    repoRoot,
  });
  assert.equal(cycle.hops.length, PROPRIETARY_ISA_BOUNDARY_CYCLE.length);
  const hopNames = cycle.hops.map((h) => h.hop);
  for (const expected of PROPRIETARY_ISA_BOUNDARY_CYCLE) {
    assert.ok(hopNames.includes(expected), `missing hop ${expected}`);
  }
  const realFails = cycle.hops.filter((h) => h.state === 'FAIL');
  assert.equal(realFails.length, 0, JSON.stringify(realFails));
  assert.equal(cycle.quarantine.outcome, 'QUARANTINE');
  assert.equal(cycle.publicAllow.node.globalKnowledgeBase, true);
  assert.equal(cycle.tenantPrivate.node.globalKnowledgeBase, false);
});
