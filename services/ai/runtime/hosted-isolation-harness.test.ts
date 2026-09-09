/**
 * Static guards for the hosted isolation harness.
 * Does not authenticate and is not hosted RLS proof.
 */
import assert from 'node:assert/strict';

import { evaluateTenantActivation, resetTenantActivationProofs } from './tenant/activation-gate';
import {
  assertPublishableClientKey,
  hostedIsolationCredentialStatus,
  redactSecrets,
} from './tenant/hosted-isolation-harness';

function test(name: string, run: () => void) {
  run();
  console.log(`ok - ${name}`);
}

test('publishable key guard rejects service_role JWT payload', () => {
  const header = Buffer.from(JSON.stringify({ alg: 'none' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url');
  const result = assertPublishableClientKey(`${header}.${payload}.x`);
  assert.equal(result.ok, false);
});

test('publishable key guard accepts anon JWT payload', () => {
  const header = Buffer.from(JSON.stringify({ alg: 'none' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ role: 'anon' })).toString('base64url');
  const result = assertPublishableClientKey(`${header}.${payload}.x`);
  assert.equal(result.ok, true);
});

test('redactSecrets strips JWTs, emails, and bearer headers', () => {
  const jwt =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYXV0aGVudGljYXRlZCJ9.signaturetokenvaluehere';
  const redacted = redactSecrets(`Bearer ${jwt} user@example.com password=supersecret`);
  assert.equal(redacted.includes(jwt), false);
  assert.equal(/example\.com/i.test(redacted), false);
  assert.equal(/supersecret/i.test(redacted), false);
  assert.match(redacted, /redacted/i);
});

test('missing user credentials do not make tenantPersistence live', () => {
  resetTenantActivationProofs();
  const creds = hostedIsolationCredentialStatus();
  if (!creds.userAEmail || !creds.userBEmail) {
    assert.equal(evaluateTenantActivation().tenantPersistence, 'blocked');
  }
  assert.equal(evaluateTenantActivation().businessModulesTenantReady, false);
});

console.log('All hosted isolation harness guard cases passed.');
