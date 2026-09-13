import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  auditAlignmentInvariants, ALIGNMENT_AUDIT_POLICY, ALIGNMENT_AUDIT_GUARDRAILS,
  AUTHORIZED_NETWORK_SURFACES, type AlignmentAuditPacket,
} from './alignment-invariant-audit';
import { KNOWN_GUARDRAILS_DEBT } from './alignment-invariant-debt';

const OFFLINE_TEAM_DIR = new URL('.', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

const runOnOfflineTeam = (): AlignmentAuditPacket =>
  auditAlignmentInvariants({ dir: OFFLINE_TEAM_DIR, auditedAtMs: 1_700_000_000_000 });

test('the audit is honest and read-only by construction', () => {
  assert.equal(Object.isFrozen(ALIGNMENT_AUDIT_POLICY), true);
  assert.equal(Object.isFrozen(ALIGNMENT_AUDIT_GUARDRAILS), true);
  assert.equal(ALIGNMENT_AUDIT_POLICY.auditOnly, true);
  assert.equal(ALIGNMENT_AUDIT_POLICY.fixesAnything, false);
  assert.equal(ALIGNMENT_AUDIT_GUARDRAILS.executesAuditedModules, false);
  assert.equal(ALIGNMENT_AUDIT_GUARDRAILS.makesNetworkCalls, false);
  assert.equal(ALIGNMENT_AUDIT_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(ALIGNMENT_AUDIT_GUARDRAILS.automaticRecovery, false);
  assert.throws(() => { (ALIGNMENT_AUDIT_GUARDRAILS as Record<string, unknown>).auditOnly = false; }, TypeError);
  // The debt ledger is frozen data.
  assert.equal(Object.isFrozen(KNOWN_GUARDRAILS_DEBT), true);
});

test('construction rejects a missing directory or timestamp', () => {
  assert.throws(() => auditAlignmentInvariants({ dir: '', auditedAtMs: 1 }), /audit directory required/);
  assert.throws(() => auditAlignmentInvariants({ dir: OFFLINE_TEAM_DIR, auditedAtMs: -1 }), /audit timestamp required/);
});

test('the real runtime has ZERO violations beyond the recorded debt ledger', () => {
  const packet = runOnOfflineTeam();
  assert.equal(packet.kind, 'ALIGNMENT_INVARIANT_AUDIT');
  assert.equal(packet.auditOnly, true);
  assert.equal(packet.liveAgentCount, null);
  assert.equal(packet.learningPromoted, false);
  assert.equal(packet.humanDecision, 'REQUIRED');
  assert.equal(packet.filesScanned > 40, true, `expected a substantive scan, got ${packet.filesScanned}`);
  assert.equal(packet.guardrailObjects >= 145, true, `expected the full guardrails surface, got ${packet.guardrailObjects}`);
  assert.equal(packet.knownDebtLedgerSize, KNOWN_GUARDRAILS_DEBT.length);
  assert.deepEqual(
    packet.findings,
    [],
    `alignment audit found violations beyond known debt:\n${packet.findings.map((f) => `${f.invariant} ${f.file}: ${f.detail}`).join('\n')}`,
  );
});

test('the debt ledger is accurate: every entry is still violating, none fixed silently', () => {
  const packet = runOnOfflineTeam();
  // Every ledger entry was observed as still violating with exactly its recorded facets.
  assert.equal(packet.knownDebtViolations, KNOWN_GUARDRAILS_DEBT.length,
    `ledger says ${KNOWN_GUARDRAILS_DEBT.length} but the audit observed ${packet.knownDebtViolations}`);
  // And the ledger never contains a compliant object (shrink-only, never hide compliance).
  const compliantListed = packet.findings.filter((f) => f.invariant === 'debt-ledger-stale');
  assert.deepEqual(compliantListed, [], 'debt ledger contains fixed entries — remove them (the ledger may only shrink)');
});

test('every authorized network surface carries its loopback justification', () => {
  for (const surface of AUTHORIZED_NETWORK_SURFACES) {
    if (surface.file === 'claude-text-reviewer.ts') continue; // local child_process, no network import
    assert.equal(
      surface.reason.includes('loopback') || surface.reason.includes('127.0.0.1') || surface.viaLoopbackModules !== undefined
        || surface.file === 'alignment-invariant-audit.ts',
      true,
      `authorized surface ${surface.file} lacks a loopback justification`,
    );
  }
});

test('the audit detects unknown violations in a synthetic directory (fail-closed detection works)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-align-113-'));
  try {
    // Violating guardrails module: no freeze, no humanDecision, and a network call.
    writeFileSync(join(dir, 'bad-guardrails.ts'),
      "import { createServer } from 'node:http';\nexport const BAD_GUARDRAILS = { humanDecision: 'AUTOMATIC' };\n");
    // Ladder module missing states.
    writeFileSync(join(dir, 'device-fleet-enrollment.ts'), "export type D = 'PAUSED';\n");
    // Scale files missing markers.
    writeFileSync(join(dir, 'offline-story-queue.ts'), 'export const maxRows = 10;\n');
    writeFileSync(join(dir, 'queue-partition-contract.ts'), 'export const billionUsersProven = true;\n');
    // Test files must be excluded from the scan.
    writeFileSync(join(dir, 'ignored.test.ts'), 'export const IGNORED_GUARDRAILS = 1;\n');
    const packet = auditAlignmentInvariants({ dir, auditedAtMs: 1_700_001_000 });
    const guardrailsFinding = packet.findings.find((f) => f.invariant === 'guardrails-definition' && f.file === 'bad-guardrails.ts');
    assert.ok(guardrailsFinding, 'missing unknown-guardrails-violation finding');
    assert.match(guardrailsFinding.detail, /missing: freeze, humanDecision/);
    assert.equal(packet.findings.some((f) => f.invariant === 'guardrails-no-network' && f.file === 'bad-guardrails.ts'), true);
    assert.equal(packet.findings.some((f) => f.invariant === 'network-surface-authorized' && f.file === 'bad-guardrails.ts'), true);
    assert.equal(packet.findings.some((f) => f.invariant === 'ladder-distinct'), true);
    assert.equal(packet.findings.some((f) => f.invariant === 'scale-honesty' && f.file === 'offline-story-queue.ts'), true);
    assert.equal(packet.findings.some((f) => f.invariant === 'scale-honesty' && f.file === 'queue-partition-contract.ts'), true);
    assert.equal(packet.filesScanned, 4, 'test files must not be scanned');
    assert.equal(packet.findings.every((f) => !f.file.endsWith('.test.ts')), true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('an authorized surface without any local-plane binding is flagged', () => {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-align-113b-'));
  try {
    writeFileSync(join(dir, 'supervisor-cli.ts'),
      "const url = 'https://remote.example.invalid/api';\nexport const run = () => fetch(url);\n");
    const packet = auditAlignmentInvariants({ dir, auditedAtMs: 1_700_002_000 });
    assert.equal(packet.findings.some((f) => f.invariant === 'network-surface-loopback' && f.file === 'supervisor-cli.ts'), true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('an unlisted network module is flagged regardless of loopback binding', () => {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-align-113c-'));
  try {
    writeFileSync(join(dir, 'rogue-net.ts'), "import { request } from 'node:http';\nexport const ping = () => request('http://127.0.0.1:1');\n");
    const packet = auditAlignmentInvariants({ dir, auditedAtMs: 1_700_003_000 });
    assert.equal(packet.findings.some((f) => f.invariant === 'network-surface-authorized' && f.file === 'rogue-net.ts'), true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a compliant object still listed in the debt ledger is flagged as stale ledger data', () => {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-align-113d-'));
  try {
    // Compliant module whose object name matches a real ledger entry's file::object.
    const entry = KNOWN_GUARDRAILS_DEBT[0];
    writeFileSync(join(dir, entry.file),
      `export const ${entry.object} = Object.freeze({ humanDecision: 'REQUIRED' as const, automaticRecovery: false });\n`);
    const packet = auditAlignmentInvariants({ dir, auditedAtMs: 1_700_004_000 });
    assert.equal(packet.findings.some((f) => f.invariant === 'debt-ledger-stale' && f.file === entry.file), true,
      'a fixed-but-still-listed debt entry must be flagged so the ledger shrinks');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});