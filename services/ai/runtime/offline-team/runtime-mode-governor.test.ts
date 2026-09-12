import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { ModeGovernor, MODE_GOVERNOR_POLICY, MODE_GOVERNOR_GUARDRAILS } from './runtime-mode-governor';

const clock = () => { let now = 1_800_000_000_000; return { now: () => now, advance: (ms: number) => { now += ms; } }; };

test('trust is graduated: OFFLINE cannot jump to ONLINE, escalations need evidence', () => {
  const c = clock(); const g = new ModeGovernor(c.now);
  assert.throws(() => g.requestTransition({ to: 'ONLINE', evidenceRef: 'e:net-1' }), /graduated trust/);
  assert.throws(() => g.requestTransition({ to: 'HYBRID', evidenceRef: '' }), /evidence ref required/);
  const p1 = g.requestTransition({ to: 'HYBRID', evidenceRef: 'e:net-1' });
  assert.equal(p1.from, 'OFFLINE');
  assert.equal(p1.to, 'HYBRID');
  const p2 = g.requestTransition({ to: 'ONLINE', evidenceRef: 'e:net-2', classificationCeiling: 'INTERNAL' });
  assert.equal(p2.to, 'ONLINE');
  assert.equal(p2.humanDecision, 'REQUIRED');
  assert.equal(p2.automaticRecovery, false);
});

test('AUTOPILOT requires a prior human authorization receipt with a bounded future expiry', () => {
  const c = clock(); const g = new ModeGovernor(c.now);
  g.requestTransition({ to: 'HYBRID', evidenceRef: 'e:net-1' });
  assert.throws(() => g.requestTransition({ to: 'AUTOPILOT', evidenceRef: 'e:3' }), /from ONLINE/);
  g.requestTransition({ to: 'ONLINE', evidenceRef: 'e:net-2' });
  assert.throws(() => g.requestTransition({ to: 'AUTOPILOT', evidenceRef: 'e:3', operatorAuthorizationRef: 'auth:1', authorizationExpiresAtMs: c.now() - 1 }), /future/);
  assert.throws(() => g.requestTransition({ to: 'AUTOPILOT', evidenceRef: 'e:3', operatorAuthorizationRef: 'auth:1', authorizationExpiresAtMs: c.now() + MODE_GOVERNOR_POLICY.maxAutopilotWindowMs + 1 }), /policy cap/);
  assert.throws(() => g.requestTransition({ to: 'AUTOPILOT', evidenceRef: 'e:3', authorizationExpiresAtMs: c.now() + 1000 }), /prior human operator authorization/);
  const engage = g.requestTransition({ to: 'AUTOPILOT', evidenceRef: 'e:3', operatorAuthorizationRef: 'op:receipt:9',
    authorizationExpiresAtMs: c.now() + 3_600_000, classificationCeiling: 'CONFIDENTIAL' });
  assert.equal(engage.to, 'AUTOPILOT');
  assert.equal(engage.humanDecision, 'SATISFIED_BY_PRIOR_RECEIPT');
  assert.equal(engage.operatorAuthorizationRef, 'op:receipt:9');
  assert.equal(MODE_GOVERNOR_GUARDRAILS.autopilotRequiresPriorHumanAuthorization, true);
});

test('expired AUTOPILOT authorization degrades the effective mode to ONLINE automatically', () => {
  const c = clock(); const g = new ModeGovernor(c.now);
  g.requestTransition({ to: 'HYBRID', evidenceRef: 'e:1' });
  g.requestTransition({ to: 'ONLINE', evidenceRef: 'e:2' });
  g.requestTransition({ to: 'AUTOPILOT', evidenceRef: 'e:3', operatorAuthorizationRef: 'op:receipt:9', authorizationExpiresAtMs: c.now() + 1_000 });
  assert.equal(g.effectiveMode().mode, 'AUTOPILOT');
  c.advance(2_000);
  const eff = g.effectiveMode();
  assert.equal(eff.mode, 'ONLINE');
  assert.equal(eff.degraded, true);
  assert.equal(eff.reason, 'authorizationExpired');
  assert.equal(MODE_GOVERNOR_GUARDRAILS.expiryDegradesAutomatically, true);
  const ack = g.acknowledgeExpiry();
  assert.equal(ack.to, 'ONLINE');
  assert.equal(ack.humanDecision, 'REQUIRED');
  assert.throws(() => g.acknowledgeExpiry(), /no expired authorization/);
});

test('TOP_SECRET ceiling locks the runtime to OFFLINE', () => {
  const c = clock(); const g = new ModeGovernor(c.now);
  const p = g.requestTransition({ to: 'OFFLINE', evidenceRef: 'e:ts-lock', classificationCeiling: 'TOP_SECRET' });
  assert.equal(p.to, 'OFFLINE');
  for (const to of ['HYBRID', 'ONLINE', 'AUTOPILOT'] as const)
    assert.throws(() => g.requestTransition({ to, evidenceRef: 'e:x', operatorAuthorizationRef: 'op:1', authorizationExpiresAtMs: c.now() + 1000 }), /TOP_SECRET/);
  assert.equal(MODE_GOVERNOR_GUARDRAILS.topSecretOfflineOnly, true);
  assert.throws(() => new ModeGovernor(c.now).requestTransition({ to: 'HYBRID', evidenceRef: 'e:x', classificationCeiling: 'TOP_SECRET' }), /TOP_SECRET/);
});

test('de-escalation is always allowed, including fail-toward-offline without evidence class', () => {
  const c = clock(); const g = new ModeGovernor(c.now);
  g.requestTransition({ to: 'HYBRID', evidenceRef: 'e:1' });
  g.requestTransition({ to: 'ONLINE', evidenceRef: 'e:2' });
  const down = g.requestTransition({ to: 'HYBRID', evidenceRef: 'e:degrade' });
  assert.equal(down.to, 'HYBRID');
  const offline = g.requestTransition({ to: 'OFFLINE', evidenceRef: 'e:fail-safe' });
  assert.equal(offline.to, 'OFFLINE');
  assert.equal(offline.automaticRecovery, false);
  assert.equal(offline.learningPromoted, false);
  assert.equal(g.snapshot().mode, 'OFFLINE');
});

test('snapshot carries the honest posture and frozen guardrails', () => {
  const g = new ModeGovernor(clock().now);
  const snap = g.snapshot();
  assert.equal(snap.humanDecision, 'REQUIRED');
  assert.equal(snap.automaticRecovery, false);
  assert.equal(snap.learningPromoted, false);
  assert.equal(snap.classificationCeiling, 'INTERNAL');
  assert.equal(snap.effectiveMode.degraded, false);
  assert.equal(MODE_GOVERNOR_GUARDRAILS.automaticRecovery, false);
  assert.throws(() => { (MODE_GOVERNOR_GUARDRAILS as Record<string, unknown>).automaticRecovery = true; }, TypeError);
});