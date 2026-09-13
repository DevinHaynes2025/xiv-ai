import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import {
  AUTHORITY_LADDER, ASSIGNABLE_LEVELS, AUTHORITY_LADDER_GUARDRAILS,
  ENTERPRISE_ROLE_LADDER_MAP, assertLadderMapInvariants, composeAuthorityLadderPacket,
  type AuthorityLadderEntry,
} from './enterprise-authority-ladder';
import { ENTERPRISE_WORKFORCE } from './enterprise-workforce';

test('the ladder definitions are frozen, honest governance data', () => {
  assert.equal(Object.isFrozen(AUTHORITY_LADDER), true);
  assert.equal(Object.isFrozen(ASSIGNABLE_LEVELS), true);
  assert.equal(Object.isFrozen(AUTHORITY_LADDER_GUARDRAILS), true);
  assert.equal(Object.isFrozen(ENTERPRISE_ROLE_LADDER_MAP), true);
  for (const entry of ENTERPRISE_ROLE_LADDER_MAP) assert.equal(Object.isFrozen(entry), false); // entries are data, map is the frozen boundary
  assert.equal(AUTHORITY_LADDER_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(AUTHORITY_LADDER_GUARDRAILS.automaticRecovery, false);
  assert.equal(AUTHORITY_LADDER_GUARDRAILS.mapIsCeilingsNotActivations, true);
  assert.equal(AUTHORITY_LADDER_GUARDRAILS.l4NeverAssigned, true);
  // The reserved rung exists in the vocabulary but is not assignable.
  assert.equal(AUTHORITY_LADDER.some((l) => l.level === 'L4' && l.name === 'RESERVED'), true);
  assert.equal(ASSIGNABLE_LEVELS.includes('L4'), false);
});

test('the map covers all 100 workforce roles exactly, with no reserved rung', () => {
  const packet = composeAuthorityLadderPacket({ generatedAtMs: 1_700_000_000_000 });
  assert.equal(packet.kind, 'ENTERPRISE_AUTHORITY_LADDER_MAP');
  assert.equal(packet.rolesMapped, ENTERPRISE_WORKFORCE.length);
  assert.equal(packet.rolesMapped, 100);
  const sum = Object.values(packet.levelCounts).reduce((a, b) => a + b, 0);
  assert.equal(sum, 100, 'every role mapped exactly once');
  assert.equal(packet.levelCounts.L4, 0, 'the reserved rung is never assigned');
  assert.equal(packet.maxAssignedLevel, 'L3');
  assert.equal(packet.activationState, 'PROFILE_DEFINED_NOT_ACTIVATED');
  assert.equal(packet.executionContract, 'LOCAL_DRAFT_ONLY');
  assert.equal(packet.liveAgentCount, null);
  assert.equal(packet.learningPromoted, false);
  assert.equal(packet.humanDecision, 'REQUIRED');
  // The adversarially-verified distribution (after conservative refute-downs).
  assert.deepEqual(packet.levelCounts, { L0: 22, L1: 23, L2: 48, L3: 6, L4: 0, L5: 1 });
});

test('sensitive domains sit at the verified rungs', () => {
  const levelOf = (roleId: string) => ENTERPRISE_ROLE_LADDER_MAP.find((e) => e.roleId === roleId)!.level;
  // L3: approval-gated domains (secrets, key custody, IAM, incident response, certification, recovery).
  for (const id of ['authorization', 'backup_restore', 'compliance', 'iam_auditor', 'incident_response', 'encryption']) {
    assert.equal(levelOf(id), 'L3', `${id} must sit at L3`);
  }
  // L5: the executive decision itself is human-reserved; the role prepares the brief.
  assert.equal(levelOf('executive'), 'L5');
  // Conservative refute-downs applied from adversarial review.
  assert.equal(levelOf('model_router'), 'L1');
  assert.equal(levelOf('tenant_isolation'), 'L1');
  assert.equal(levelOf('prompt_engineer'), 'L1');
  assert.equal(levelOf('agent_registry'), 'L0');
  assert.equal(levelOf('architecture_council'), 'L0');
});

test('every entry carries a substantive, mission-citing justification', () => {
  for (const e of ENTERPRISE_ROLE_LADDER_MAP) {
    assert.equal(e.justification.trim().length >= 40, true, `${e.roleId} lacks a substantive justification`);
    assert.equal(typeof e.justification, 'string');
  }
});

test('construction rejects a missing or invalid timestamp', () => {
  assert.throws(() => composeAuthorityLadderPacket({ generatedAtMs: -1 }), /packet timestamp required/);
  assert.throws(() => composeAuthorityLadderPacket({ generatedAtMs: 1.5 }), /packet timestamp required/);
});

test('the invariants fail closed against a tampered map (fail-closed detection works)', () => {
  const base = (): AuthorityLadderEntry[] => ENTERPRISE_ROLE_LADDER_MAP.map((e) => ({ ...e }));
  // A reserved L4 rung sneaks in.
  const withL4 = base(); (withL4[0] as { level: string }).level = 'L4';
  assert.throws(() => assertLadderMapInvariants(withL4), /non-assignable or reserved level/);
  // A workforce role goes missing.
  assert.throws(() => assertLadderMapInvariants(base().slice(1)), /missing from the ladder map/);
  // An unknown role sneaks in.
  const withUnknown = [...base(), { roleId: 'ghost_role', level: 'L0' as const, justification: 'x'.repeat(50) }];
  assert.throws(() => assertLadderMapInvariants(withUnknown), /unknown role/);
  // A duplicate entry.
  const withDup = [...base(), base()[0]!];
  assert.throws(() => assertLadderMapInvariants(withDup), /duplicate ladder entry/);
  // A gutted justification.
  const withWeak = base(); (withWeak[0] as { justification: string }).justification = 'too short';
  assert.throws(() => assertLadderMapInvariants(withWeak), /substantive justification/);
});