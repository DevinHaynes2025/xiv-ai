// 12D-256 — adversarial tests for the Arena CLI.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  runArenaCli,
  mainArenaCli,
  ARENA_CLI_POLICY,
  ARENA_CLI_HONEST_FLAGS,
} from './xiv-multi-agent-arena.cli';
import {
  appendArenaStep,
  deriveArenaReceipt,
  deriveGoalDigest,
  emptyArenaTranscript,
  type ArenaRole,
  type ArenaTranscript,
} from './xiv-multi-agent-arena';
import {
  buildStoryShellPacket, verifyStoryShellPacket, type StoryShellPacket,
} from './xiv-os-wire-contract';

const GOAL = 'cli test goal: reach consensus on a local fail-closed module';
const goalDigest = deriveGoalDigest(GOAL);
const planSteps = ['read', 'write', 'test'];
const proposalA = 'proposal v1 for the cli happy path';
const failReasons = ['turn 0 objection: the proposal is underbaked'];

function envelope(role: ArenaRole, turn: number, parentDigest: string, payload: unknown): unknown {
  return { envelopeVersion: 1, role, turn, goalDigest, parentDigest, payload };
}

function runDebate(opts: Readonly<{
  verdicts: ReadonlyArray<'PASS' | 'FAIL'>;
  judgeOutcome?: 'AUTHORIZED' | 'ABORTED';
  packetId?: string | null;
}>): ArenaTranscript {
  let t = emptyArenaTranscript(goalDigest);
  t = appendArenaStep(t, envelope('ORCHESTRATOR', 0, t.headDigest, { kind: 'PLAN_TOPOLOGY', steps: planSteps }));
  opts.verdicts.forEach((verdict, i) => {
    t = appendArenaStep(t, envelope('GENERATOR', i, t.headDigest, { kind: 'PROPOSED_SOLUTION', proposal: `${proposalA} (${i})` }));
    t = appendArenaStep(t, envelope('ADVERSARY', i, t.headDigest, {
      kind: 'VERDICT', verdict, reasons: verdict === 'FAIL' ? failReasons : [],
    }));
  });
  if (opts.judgeOutcome !== undefined) {
    t = appendArenaStep(t, envelope('JUDGE', 0, t.headDigest, {
      kind: 'CONSENSUS', outcome: opts.judgeOutcome, packetId: opts.packetId ?? null,
    }));
  }
  return t;
}

function makePacket(generatedAtMs: number, headline: string): StoryShellPacket {
  const packet = buildStoryShellPacket({
    storyId: '12d-256-arena-cli-consensus-test',
    headline,
    bodyText: 'the arena cli printed this receipt for operator review only',
    generatedAtMs,
    avatar: null,
    decidingOver: 'whether the cli-verified consensus may proceed to human review',
  });
  assert.equal(verifyStoryShellPacket(packet).ok, true, 'fixture must verify');
  return packet;
}

test('12d-256: HAPPY PATH — a real PASS debate + bound packet prints the receipt (byte-compared to direct derivation)', () => {
  const packet = makePacket(1_000_000, 'arena cli happy path consensus packet');
  const transcript = runDebate({ verdicts: ['PASS'], judgeOutcome: 'AUTHORIZED', packetId: packet.packetId });

  const dir = mkdtempSync(join(tmpdir(), 'xiv-arena-cli-'));
  try {
    const transcriptPath = join(dir, 'transcript.json');
    const packetPath = join(dir, 'packet.json');
    writeFileSync(transcriptPath, JSON.stringify(transcript), 'utf8');
    writeFileSync(packetPath, JSON.stringify(packet), 'utf8');

    const cli = runArenaCli([
      `--transcript=${transcriptPath}`,
      `--packet=${packetPath}`,
    ]);
    assert.equal(cli.schemaVersion, 1);
    assert.equal(cli.action, 'arena-verdict');
    assert.equal(cli.result.outcome, 'AUTHORIZED');
    assert.match(cli.result.reason, /adversary PASS \+ judge authorize/);
    assert.equal(cli.flags.modelCalls, 0);
    assert.equal(cli.flags.remoteCalls, 0);
    assert.equal(cli.flags.readOnlyNeverWrites, true);

    // The CLI receipt must byte-match a direct derivation from the module.
    const direct = deriveArenaReceipt({ transcript, packet });
    assert.equal(cli.result.receipt, direct.receipt);
    assert.equal(cli.result.packetId, packet.packetId);
    assert.equal(cli.result.transcriptDigest, direct.transcriptDigest);
    assert.equal(cli.result.debateTurnsUsed, 1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('12d-256: strict args — unknown, malformed, duplicate, and missing keys refuse by name', () => {
  assert.throws(() => runArenaCli(['--transcript=x', '--packet=y', '--seed=z']), /unknown argument --seed/);
  assert.throws(() => runArenaCli(['--transcript=x', '--transcript=y', '--packet=z']), /duplicate argument --transcript/);
  assert.throws(() => runArenaCli(['transcript=x', '--packet=y']), /must be --key=value/);
  assert.throws(() => runArenaCli(['--transcript']), /must be --key=value/);
  // Each required key refuses individually (transcript first, then packet).
  assert.throws(() => runArenaCli([]), /missing required argument --transcript/);
  assert.throws(() => runArenaCli(['--transcript=x']), /missing required argument --packet/);
});

test('12d-256: a TAMPERED transcript file refuses — chain verification fails closed', () => {
  const packet = makePacket(1_000_000, 'arena cli tamper refusal packet');
  const transcript = runDebate({ verdicts: ['PASS'], judgeOutcome: 'AUTHORIZED', packetId: packet.packetId });
  const parsed = JSON.parse(JSON.stringify(transcript)) as { steps: Array<{ payload: Record<string, unknown> }> };
  // Flip the last adversary verdict PASS→FAIL (with reasons, so the shape
  // gate passes and the CHAIN digest is what breaks).
  const adv = parsed.steps.find((s) => (s.payload as { kind?: string }).kind === 'VERDICT');
  assert.ok(adv);
  adv.payload.verdict = 'FAIL';
  adv.payload.reasons = ['tampered by the test'];

  const dir = mkdtempSync(join(tmpdir(), 'xiv-arena-cli-'));
  try {
    const transcriptPath = join(dir, 'transcript.json');
    const packetPath = join(dir, 'packet.json');
    writeFileSync(transcriptPath, JSON.stringify(parsed), 'utf8');
    writeFileSync(packetPath, JSON.stringify(packet), 'utf8');
    assert.throws(() => runArenaCli([`--transcript=${transcriptPath}`, `--packet=${packetPath}`]), /tampered|mismatch|chain is broken|must come from/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('12d-256: an EXHAUSTED debate (3 FAILs) refuses — no verdict packet for a debate that authorized nothing', () => {
  const packet = makePacket(1_000_000, 'arena cli exhausted debate packet');
  const transcript = runDebate({ verdicts: ['FAIL', 'FAIL', 'FAIL'] });

  const dir = mkdtempSync(join(tmpdir(), 'xiv-arena-cli-'));
  try {
    const transcriptPath = join(dir, 'transcript.json');
    const packetPath = join(dir, 'packet.json');
    writeFileSync(transcriptPath, JSON.stringify(transcript), 'utf8');
    writeFileSync(packetPath, JSON.stringify(packet), 'utf8');
    assert.throws(() => runArenaCli([`--transcript=${transcriptPath}`, `--packet=${packetPath}`]), /consensus was not reached.*no judge consensus/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('12d-256: an ABORTED judge refuses', () => {
  const packet = makePacket(1_000_000, 'arena cli aborted judge packet');
  const transcript = runDebate({ verdicts: ['PASS'], judgeOutcome: 'ABORTED', packetId: null });

  const dir = mkdtempSync(join(tmpdir(), 'xiv-arena-cli-'));
  try {
    const transcriptPath = join(dir, 'transcript.json');
    const packetPath = join(dir, 'packet.json');
    writeFileSync(transcriptPath, JSON.stringify(transcript), 'utf8');
    writeFileSync(packetPath, JSON.stringify(packet), 'utf8');
    assert.throws(() => runArenaCli([`--transcript=${transcriptPath}`, `--packet=${packetPath}`]), /judge aborted/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('12d-256: a NON-BINDING packet refuses — the judge step binds exactly one packetId', () => {
  const bound = makePacket(1_000_000, 'arena cli binding test packet one');
  const other = makePacket(1_000_000, 'arena cli binding test packet two');
  const transcript = runDebate({ verdicts: ['PASS'], judgeOutcome: 'AUTHORIZED', packetId: bound.packetId });

  const dir = mkdtempSync(join(tmpdir(), 'xiv-arena-cli-'));
  try {
    const transcriptPath = join(dir, 'transcript.json');
    const packetPath = join(dir, 'packet.json');
    writeFileSync(transcriptPath, JSON.stringify(transcript), 'utf8');
    writeFileSync(packetPath, JSON.stringify(other), 'utf8');
    assert.throws(() => runArenaCli([`--transcript=${transcriptPath}`, `--packet=${packetPath}`]), /does not bind this packetId/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('12d-256: malformed files refuse — invalid JSON, arrays, and missing files', () => {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-arena-cli-'));
  try {
    const badPath = join(dir, 'bad.json');
    const arrPath = join(dir, 'arr.json');
    const missingPath = join(dir, 'missing.json');
    const packetPath = join(dir, 'packet.json');
    const packet = makePacket(1_000_000, 'arena cli malformed input packet');
    writeFileSync(packetPath, JSON.stringify(packet), 'utf8');
    writeFileSync(badPath, '{not json', 'utf8');
    writeFileSync(arrPath, '[1,2,3]', 'utf8');

    assert.throws(() => runArenaCli([`--transcript=${badPath}`, `--packet=${packetPath}`]), /not valid JSON/);
    assert.throws(() => runArenaCli([`--transcript=${arrPath}`, `--packet=${packetPath}`]), /one JSON object/);
    assert.throws(() => runArenaCli([`--transcript=${missingPath}`, `--packet=${packetPath}`]), /could not be read from local disk/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('12d-256: mainArenaCli prints an error packet to stderr and exits 2 on refusal; stdout stays empty', () => {
  const stderrWrites: string[] = [];
  const stdoutWrites: string[] = [];
  const origErr = process.stderr.write.bind(process.stderr);
  const origOut = process.stdout.write.bind(process.stdout);
  const origExit = process.exitCode;
  process.stderr.write = ((chunk: unknown) => { stderrWrites.push(String(chunk)); return true; }) as typeof process.stderr.write;
  process.stdout.write = ((chunk: unknown) => { stdoutWrites.push(String(chunk)); return true; }) as typeof process.stdout.write;
  try {
    mainArenaCli([]);
    assert.equal(process.exitCode, 2);
    assert.equal(stdoutWrites.length, 0);
    assert.equal(stderrWrites.length, 1);
    const packet = JSON.parse(stderrWrites[0]!) as { ok: boolean; error: string };
    assert.equal(packet.ok, false);
    assert.match(packet.error, /missing required argument --transcript/);
  } finally {
    process.stderr.write = origErr;
    process.stdout.write = origOut;
    process.exitCode = origExit;
  }
});

test('12d-256: policy pins the honest flags; keys are exactly transcript and packet', () => {
  assert.deepEqual([...ARENA_CLI_POLICY.keys], ['transcript', 'packet']);
  assert.equal(ARENA_CLI_HONEST_FLAGS.humanDecision, 'REQUIRED');
  assert.equal(ARENA_CLI_HONEST_FLAGS.billionUsersProven, false);
  assert.equal(Object.isFrozen(ARENA_CLI_POLICY), true);
  assert.equal(Object.isFrozen(ARENA_CLI_HONEST_FLAGS), true);
});