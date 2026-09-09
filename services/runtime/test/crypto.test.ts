import assert from 'node:assert/strict';
import { test } from 'node:test';
import { canonicalize, fingerprint, generateSigningKeys, nonce, sha256, sign, verifySignature } from '../src/crypto';

test('canonicalize is stable across key order', () => {
  const a = { z: 1, a: { c: 3, b: [1, 2, { y: 1, x: 2 }] } };
  const b = { a: { b: [1, 2, { x: 2, y: 1 }], c: 3 }, z: 1 };
  assert.equal(canonicalize(a), canonicalize(b));
});

test('canonicalize drops undefined but keeps null', () => {
  assert.equal(canonicalize({ a: undefined, b: null }), '{"b":null}');
});

test('signatures verify and detect any payload change', () => {
  const key = generateSigningKeys().grant;
  const payload = { workloadId: 'wl_1', tenant: { organizationId: 'org', universeId: 'uni' }, capabilities: ['a'] };
  const signature = sign(key, payload);

  assert.equal(verifySignature(key, payload, signature), true);
  assert.equal(verifySignature(key, { ...payload, workloadId: 'wl_2' }, signature), false);
  assert.equal(verifySignature(key, { ...payload, capabilities: ['a', 'b'] }, signature), false);
  assert.equal(verifySignature(generateSigningKeys().grant, payload, signature), false);
});

test('verifySignature rejects a malformed signature without throwing', () => {
  const key = generateSigningKeys().grant;
  const signature = sign(key, { a: 1 });
  assert.equal(verifySignature(key, { a: 1 }, signature.slice(0, -1)), false);
  assert.equal(verifySignature(key, { a: 1 }, ''), false);
  assert.equal(verifySignature(key, { a: 1 }, `${signature}0`), false);
});

test('key generation produces distinct, non-placeholder material', () => {
  const first = generateSigningKeys();
  const second = generateSigningKeys();
  const values = Object.values(first);
  assert.equal(new Set(values).size, values.length);
  for (const value of values) assert.equal(value.length, 64);
  assert.notDeepEqual(first, second);
});

test('hash helpers are deterministic and collision-sensitive', () => {
  assert.equal(sha256('a'), sha256('a'));
  assert.notEqual(sha256('a'), sha256('b'));
  assert.notEqual(fingerprint(['a', 'bc']), fingerprint(['ab', 'c']));
  assert.notEqual(nonce(), nonce());
});
