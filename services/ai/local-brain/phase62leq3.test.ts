/**
 * 62L-EQ3 — RISC-V Open ISA Knowledge Pack denial + honesty tests.
 *
 * Script: npm run test:62leq3
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  EQ3_DB_CANDIDATES_STATUS,
  EQ3_LOCKS,
  EQ3_MAY,
  EQ3_MUST_NOT,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HARDWARE_EVIDENCE_LADDER_ORDER,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  RISCV_HARDWARE_EVIDENCE_STATES,
  RISCV_KNOWLEDGE_AGENT_BOUNDS,
  RISCV_KNOWLEDGE_DOMAINS,
  RISCV_KNOWLEDGE_NODE_FIELDS,
  RISCV_NEURAL_PATHWAY,
  RISCV_OPEN_ISA_KNOWLEDGE_PACK_CYCLE,
  RISCV_RATIFICATION_STATES,
  assertEq3LocksIntact,
  eq3SoftWireSnapshot,
  ratifiedImpliesDeviceSupport,
  ratifiedImpliesXivVerifiedInference,
  type Eq3Actor,
} from './riscv-open-isa-knowledge-pack-types.ts';

import {
  advanceHardwareEvidence,
  attemptConfidentialChipDesigns,
  attemptEquateRatifiedWithDeviceSupport,
  attemptEquateRatifiedWithXivVerifiedInference,
  attemptFirmwareIngestion,
  attemptPrivateExtensions,
  attemptProprietaryRtlCopy,
  attemptRecommendAsAct,
  attemptRestrictedImplementationData,
  attemptSkipHardwareEvidenceLadder,
  bootstrapRiscvOpenIsaKnowledgePack,
  emitRiscvKnowledgeNode,
  exampleVectorExtensionNode,
  probeGuardianRlsTenantUniverseIsolation,
  requireHumanApproval,
  returnRiscvKnowledgeEvidenceToHomeBase,
  runRiscvOpenIsaKnowledgePackCycle,
} from './riscv-open-isa-knowledge-pack-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Eq3Actor = {
  kind: 'riscv_research_agent',
  id: 'rv-1',
  orgId: 'org-eq3',
  tenantId: 'ten-eq3',
  universeId: 'uni-eq3',
  permissions: ['draft'],
};

const human: Eq3Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-eq3',
  tenantId: 'ten-eq3',
  universeId: 'uni-eq3',
  permissions: ['approve_consequential'],
};

test('SoT label EQ3 / #161; GitLab mirror not invented; next EQ4', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-EQ3');
  assert.equal(GITHUB_SOT_ISSUE, 161);
  assert.equal(GITHUB_SOT_FAMILY, '62L-EQ');
  assert.match(GITHUB_SOT_TITLE, /RISC-V Open ISA Knowledge Pack/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /EQ4/);
  assert.match(NEXT_PHASE_TITLE, /Proprietary ISA Boundary/);
});

test('honesty locks: L4 false; ratified≠device≠verified; DB NOT_APPLIED', () => {
  assert.equal(assertEq3LocksIntact(), true);
  assert.equal(EQ3_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EQ3_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(EQ3_LOCKS.RATIFIED_EQ_DEVICE_SUPPORTS, false);
  assert.equal(EQ3_LOCKS.RATIFIED_EQ_XIV_VERIFIED_INFERENCE, false);
  assert.equal(EQ3_LOCKS.PROPRIETARY_RTL_COPY, false);
  assert.equal(EQ3_LOCKS.TIP_LAND, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(
    RISCV_KNOWLEDGE_AGENT_BOUNDS.mayEquateRatifiedWithDeviceSupport,
    false,
  );
  assert.equal(ratifiedImpliesDeviceSupport(), false);
  assert.equal(ratifiedImpliesXivVerifiedInference(), false);
});

test('domains + node fields + ladder + pathway encoded', () => {
  assert.ok(RISCV_KNOWLEDGE_DOMAINS.includes('base_isas'));
  assert.ok(RISCV_KNOWLEDGE_DOMAINS.includes('vector_extensions'));
  assert.ok(RISCV_KNOWLEDGE_DOMAINS.includes('ai_ml_accelerator_extensions'));
  assert.ok(RISCV_KNOWLEDGE_NODE_FIELDS.includes('specVersion'));
  assert.ok(RISCV_KNOWLEDGE_NODE_FIELDS.includes('ratificationState'));
  assert.ok(RISCV_KNOWLEDGE_NODE_FIELDS.includes('hardwareEvidence'));
  assert.ok(RISCV_RATIFICATION_STATES.includes('RATIFIED'));
  assert.deepEqual([...HARDWARE_EVIDENCE_LADDER_ORDER], [
    'DOCUMENTED',
    'DETECTED',
    'SUPPORTED',
    'VERIFIED',
  ]);
  assert.ok(RISCV_HARDWARE_EVIDENCE_STATES.includes('NOT_TESTED'));
  assert.deepEqual([...RISCV_NEURAL_PATHWAY], [
    'riscv_extension',
    'compiler_toolchain',
    'workload_capability',
    'device',
    'benchmark',
    'lesson',
  ]);
  assert.ok(EQ3_MAY.includes('record_ratification_state_separately_from_device_evidence'));
  assert.ok(EQ3_MUST_NOT.includes('equate_ratified_extension_with_device_support'));
});

test('RATIFIED V extension ≠ device support ≠ XIV verified inference', () => {
  const v = exampleVectorExtensionNode(agent);
  assert.equal(v.ratificationState, 'RATIFIED');
  assert.equal(v.hardwareEvidence, 'DOCUMENTED');
  assert.equal(v.deviceSupportsClaimed, false);
  assert.equal(v.xivVerifiedInference, false);

  assert.equal(attemptEquateRatifiedWithDeviceSupport().state, 'DENIED');
  assert.equal(attemptEquateRatifiedWithXivVerifiedInference().state, 'DENIED');
  assert.equal(
    emitRiscvKnowledgeNode({
      actor: agent,
      nodeId: 'rv-bad',
      specVersion: '1.0',
      extensionId: 'V',
      ratificationState: 'RATIFIED',
      instructionClass: 'vector',
      workloadRelevance: ['vector_workloads'],
      compilerSupport: 'llvm',
      runtimeSupport: 'linux',
      sourceRef: 'public',
      sourceDate: '2021-01-01',
      confidence: 0.5,
      attemptEquateRatifiedWithDeviceSupport: true,
    }).state,
    'DENIED',
  );
});

test('hardware evidence ladder advances step-by-step; skip/jump denied', () => {
  const v = exampleVectorExtensionNode(agent);
  const detected = advanceHardwareEvidence({
    node: v,
    to: 'DETECTED',
    evidenceRefs: ['probe-1'],
  });
  assert.ok(!('denied' in detected));
  assert.equal(detected.node.hardwareEvidence, 'DETECTED');

  assert.equal(attemptSkipHardwareEvidenceLadder().state, 'DENIED');
  assert.equal(
    advanceHardwareEvidence({
      node: v,
      to: 'VERIFIED',
      evidenceRefs: ['x'],
      attemptSkipLadder: true,
    }).state,
    'DENIED',
  );
  assert.equal(
    advanceHardwareEvidence({
      node: detected.node,
      to: 'SUPPORTED',
      evidenceRefs: [],
    }).state,
    'DENIED',
  );
  assert.equal(
    advanceHardwareEvidence({
      node: detected.node,
      to: 'VERIFIED',
      evidenceRefs: [],
      attemptJumpToVerifiedWithoutEvidence: true,
    }).state,
    'DENIED',
  );
});

test('boundary denies proprietary RTL / firmware / private extensions', () => {
  assert.equal(attemptProprietaryRtlCopy().state, 'DENIED');
  assert.equal(attemptConfidentialChipDesigns().state, 'DENIED');
  assert.equal(attemptFirmwareIngestion().state, 'DENIED');
  assert.equal(attemptPrivateExtensions().state, 'DENIED');
  assert.equal(attemptRestrictedImplementationData().state, 'DENIED');

  assert.equal(
    emitRiscvKnowledgeNode({
      actor: agent,
      nodeId: 'rv-rtl',
      specVersion: '1.0',
      extensionId: 'I',
      ratificationState: 'RATIFIED',
      instructionClass: 'base',
      workloadRelevance: ['embedded_systems'],
      compilerSupport: 'gcc',
      runtimeSupport: 'baremetal',
      sourceRef: 'public',
      sourceDate: '2019-01-01',
      confidence: 0.9,
      attemptProprietaryRtlCopy: true,
    }).state,
    'DENIED',
  );
});

test('bootstrap + soft-wire + cycle; home base; guardian unchanged', () => {
  const boot = bootstrapRiscvOpenIsaKnowledgePack(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.domains.length, RISCV_KNOWLEDGE_DOMAINS.length);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');
  assert.equal(boot.sot.issue, 161);

  const soft = eq3SoftWireSnapshot(repoRoot);
  assert.equal(soft.eq2ArmArchitectureKnowledgePack.present, true);
  assert.equal(soft.eq1CrossArchitectureContract.present, true);
  assert.equal(soft.ep18QuantumInspiredComputeLab.present, true);
  assert.equal(soft.ep12Scheduler.present, true);

  assert.equal(attemptRecommendAsAct().state, 'DENIED');
  const ev = returnRiscvKnowledgeEvidenceToHomeBase({
    evidenceId: 'ev-eq3-1',
    actor: agent,
    summary: 'riscv knowledge advisory',
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

  const cycle = runRiscvOpenIsaKnowledgePackCycle({
    actor: agent,
    human,
    repoRoot,
  });
  assert.equal(cycle.hops.length, RISCV_OPEN_ISA_KNOWLEDGE_PACK_CYCLE.length);
  const hopNames = cycle.hops.map((h) => h.hop);
  for (const expected of RISCV_OPEN_ISA_KNOWLEDGE_PACK_CYCLE) {
    assert.ok(hopNames.includes(expected), `missing hop ${expected}`);
  }
  const realFails = cycle.hops.filter((h) => h.state === 'FAIL');
  assert.equal(realFails.length, 0, JSON.stringify(realFails));
  assert.equal(cycle.vectorNode.ratificationState, 'RATIFIED');
  assert.ok(!('denied' in cycle.advanced));
  assert.equal(cycle.advanced.node.hardwareEvidence, 'DETECTED');
});
