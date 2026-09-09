import assert from 'node:assert/strict';

import { verifySecurity } from './security-verifier';

const clean = verifySecurity({
  currentBranch: 'chatgpt/62l-local-brain-offline',
  files: [{
    path: 'services/ai/local-brain/example.ts',
    unifiedDiff: '--- a/services/ai/local-brain/example.ts\n+++ b/services/ai/local-brain/example.ts\n+export const y = 2;\n',
  }],
});
assert.equal(clean.passed, true);
assert.equal(clean.productionAuthorization, false);

const secrets = verifySecurity({
  files: [{ path: 'app.ts', content: 'const key = "AKIAIOSFODNN7EXAMPLE";' }],
});
assert.equal(secrets.passed, false);
assert.ok(secrets.findings.some((finding) => finding.code === 'AWS_ACCESS_KEY'));

const protectedPath = verifySecurity({
  files: [{ path: '.env', unifiedDiff: '--- a/.env\n+++ b/.env\n+SECRET=1\n' }],
});
assert.equal(protectedPath.passed, false);
assert.ok(protectedPath.findings.some((finding) => finding.code === 'PROTECTED_PATH'));

const locks = verifySecurity({
  files: [{ path: 'config.ts', content: 'ok' }],
  productionLocks: { l4Autonomy: true, guardianOverride: true },
});
assert.equal(locks.passed, false);
assert.ok(locks.findings.some((finding) => finding.code === 'PRODUCTION_LOCK'));

const tenant = verifySecurity({
  files: [{ path: 'db.sql', content: 'ALTER TABLE t DISABLE ROW LEVEL SECURITY;' }],
  tenantBoundaryChanged: true,
});
assert.equal(tenant.passed, false);
assert.ok(tenant.findings.some((finding) => finding.code === 'TENANT_BOUNDARY'));

const integrity = verifySecurity({
  files: [{ path: 'a.ts', unifiedDiff: '--- a/b.ts\n+++ b/../secret.ts\n+stolen\n' }],
});
assert.equal(integrity.passed, false);
assert.ok(integrity.findings.some((finding) => finding.code === 'DIFF_INTEGRITY'));

console.log('security-verifier.test.ts PASS');
