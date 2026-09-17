// 12D-319 — the credential-shape screen BROADENED, tested adversarially.
// The 12D-318 defensive observation measured a live CircleCI badge
// token sailing past the old screen inside a public README. This suite
// pins the broadened shapes, the benign shapes that must keep passing,
// and the REAL doors' refusals (the 12D-274 ingest door and the 12D-276
// register door) with the secret NEVER echoed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SECRET_CONTENT_RE, prepareDocumentStories } from './xiv-document-ingest';
import { registerReadingSource } from './xiv-reading-source-register';

const CIRCLE_TOKEN_URL_SHAPE = '&circle-token=1addd775339738a3d90869ddd8201110d561feaa'; // the exact 12D-318 shape

test('12D-319: the broadened screen matches every new credential shape', () => {
  assert.equal(SECRET_CONTENT_RE.test('see https://ci.example/build.svg?style=shield' + CIRCLE_TOKEN_URL_SHAPE), true);
  assert.equal(SECRET_CONTENT_RE.test('endpoint?token=ABCDEF0123456789abcdef01'), true);
  assert.equal(SECRET_CONTENT_RE.test('key sk_test_51AbcdefghijKlmnop'), true);
  assert.equal(SECRET_CONTENT_RE.test('key pk_live_9Zz8yYx7WwV'), true);
  assert.equal(SECRET_CONTENT_RE.test('github_pat_11ABCDEFG0abcdefghijklmnopqrstuvwxyz12345678'), true);
  assert.equal(SECRET_CONTENT_RE.test('glpat-AbCdEfGhIjKlMnOpQrSt'), true);
  assert.equal(SECRET_CONTENT_RE.test('npm_AbCdEfGhIjKlMnOpQrStUvWxYz0123456789'), true);
  assert.equal(SECRET_CONTENT_RE.test('AIzaSyA1234567890abcdefghijklmnopqrstuvwx-8'), true);
  assert.equal(SECRET_CONTENT_RE.test('xoxb-123456789012-abcdef'), true);
  assert.equal(SECRET_CONTENT_RE.test('Authorization: Bearer AbCdEf1234567890AbCdEf1234567890'), true);
});

test('12D-319: the old shapes still match — nothing was loosened', () => {
  assert.equal(SECRET_CONTENT_RE.test('-----BEGIN RSA PRIVATE KEY-----'), true);
  assert.equal(SECRET_CONTENT_RE.test('sk-Aa1Bb2Cc3Dd4Ee5Ff6Gg7'), true);
  assert.equal(SECRET_CONTENT_RE.test('ghp_' + 'a'.repeat(30)), true);
  assert.equal(SECRET_CONTENT_RE.test('AKIA' + 'B2C3D4E5F6G7H8I9J0K1'), true);
  assert.equal(SECRET_CONTENT_RE.test('ASIA' + 'B2C3D4E5F6G7H8I9J0K1'), true);
});

test('12D-319: benign content still passes — the screen is conservative', () => {
  assert.equal(SECRET_CONTENT_RE.test('the token=abc in the query is short and public'), false);
  assert.equal(SECRET_CONTENT_RE.test('an access token expired yesterday'), false);
  assert.equal(SECRET_CONTENT_RE.test('Authorization: Bearer (issued at runtime)'), false);
  assert.equal(SECRET_CONTENT_RE.test('Authorization: Bearer short123'), false);
  assert.equal(SECRET_CONTENT_RE.test('digest abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'), false);
  assert.equal(SECRET_CONTENT_RE.test('npm packages install from the registry'), false);
  assert.equal(SECRET_CONTENT_RE.test('AIza is the key prefix Google uses — prose about the shape'), false);
  assert.equal(SECRET_CONTENT_RE.test('https://example.com/page?token=short'), false);
  assert.equal(SECRET_CONTENT_RE.test('the glpat- prefix identifies GitLab personal access tokens'), false);
  assert.equal(SECRET_CONTENT_RE.test('pk_test_ short form is not a key'), false);
});

test('12D-319: the REAL 12D-274 ingest door refuses the exact 12D-318 badge-token shape', () => {
  const body = 'A readme body that embeds a CI badge:\n\n<img src="https://circleci.com/gh/org/repo.svg?style=shield' + CIRCLE_TOKEN_URL_SHAPE + '"></img>\n\nMore benign prose follows.';
  assert.throws(() => prepareDocumentStories({
    tenantId: 'tenant-x', documentId: 'badge-token-doc', title: 'Badge token doc', bodyText: body,
  }), (err: unknown) => {
    assert.equal(err instanceof Error, true);
    const message = err instanceof Error ? err.message : String(err);
    assert.equal(/credential-shaped content/.test(message), true);
    // The secret never echoes back in the refusal.
    assert.equal(message.includes('1addd775339738a3d90869ddd8201110d561feaa'), false);
    return true;
  });
});

test('12D-319: the REAL ingest door still admits a badge WITHOUT the token (fail-closed, not fail-shut)', () => {
  const body = 'A readme body that embeds a CLEAN ci badge:\n\n<img src="https://circleci.com/gh/org/repo.svg?style=shield"></img>\n\nMore benign prose follows, padded here to keep the chunk honest and readable for the queue surface.';
  const result = prepareDocumentStories({
    tenantId: 'tenant-x', documentId: 'clean-badge-doc', title: 'Clean badge doc', bodyText: body,
  });
  assert.equal(result.chunkCount, 1);
  assert.equal(result.stories.length, 1);
});

test('12D-319: the REAL 12D-276 register door refuses a source URL carrying a query token', () => {
  class MemStore { private lines: string[] = []; load() { return this.lines; } save(l: readonly string[]) { this.lines = [...l]; } }
  assert.throws(() => registerReadingSource(new MemStore() as never, 'register-genesis-319', {
    tenantId: 'tenant-x', sourceId: 'tokened-url-source', title: 'Tokened URL source',
    sourceUrl: 'https://example.com/data?token=ABCDEF0123456789abcdef01',
    sourceClass: 'PUBLIC_WEB', licenseNote: 'public page — license verify before reuse',
  }), (err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    assert.equal(/credential-shaped content/.test(message), true);
    assert.equal(message.includes('ABCDEF0123456789abcdef01'), false);
    return true;
  });
});

test('12D-319: the register still admits a token-free URL of the same shape', () => {
  class MemStore { private lines: string[] = []; load() { return this.lines; } save(l: readonly string[]) { this.lines = [...l]; } }
  const entry = registerReadingSource(new MemStore() as never, 'register-genesis-319b', {
    tenantId: 'tenant-x', sourceId: 'clean-url-source', title: 'Clean URL source',
    sourceUrl: 'https://example.com/data?style=shield&ref=main',
    sourceClass: 'PUBLIC_WEB', licenseNote: 'public page — license verify before reuse',
  });
  assert.equal(entry.op, 'SOURCE_REGISTERED');
});