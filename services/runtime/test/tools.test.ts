import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildSbom, parseAudit, SHIPPING_RUNTIMES, toCycloneDx } from '../tools/sbom';
import { findLeakedValues, scanContents, scanSecrets, SECRET_RULES } from '../tools/secret-scan';

/**
 * A scanner that never matches would report zero findings on a repository full
 * of credentials, so the rules are proven against synthetic material here.
 */
test('secret rules fire on synthetic credentials', () => {
  const samples: Record<string, string> = {
    aws_access_key_id: 'const key = "AKIA1234567890ABCDEF"',
    google_api_key: `const key = "AIza${'b'.repeat(35)}"`,
    openai_api_key: `const key = "sk-${'c'.repeat(40)}"`,
    anthropic_api_key: `const key = "sk-ant-${'d'.repeat(30)}"`,
    private_key_block: '-----BEGIN RSA PRIVATE KEY-----',
    github_token: `const t = "ghp_${'e'.repeat(36)}"`,
    slack_token: 'const t = "xoxb-1234567890-abcdefghij"',
    generic_jwt: `const t = "eyJ${'f'.repeat(20)}.eyJ${'g'.repeat(20)}.${'h'.repeat(30)}"`,
    assigned_secret_literal: 'const config = { client_secret: "s3cret-value-long-enough" }',
    postgres_url_with_password: 'DATABASE_URL=postgresql://user:supersecret@db.internal:5432/app',
  };

  for (const [ruleId, contents] of Object.entries(samples)) {
    const result = scanContents('src/fixture.ts', contents);
    assert.ok(
      result.findings.some((finding) => finding.ruleId === ruleId),
      `rule ${ruleId} did not fire on its own sample`,
    );
  }

  const covered = new Set(Object.keys(samples));
  const uncovered = SECRET_RULES.filter((rule) => !covered.has(rule.id)).map((rule) => rule.id);
  assert.deepEqual(uncovered, ['supabase_service_role_jwt']);
});

test('the supabase service_role rule fires on a role-bearing token', () => {
  const payload = Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url');
  const contents = `const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${payload}${'a'.repeat(20)}.${'b'.repeat(40)}"`;
  const result = scanContents('supabase/config.ts', contents);
  assert.ok(result.findings.some((finding) => finding.ruleId === 'supabase_service_role_jwt'));
});

test('placeholders are excluded but still reported separately', () => {
  const result = scanContents('src/config.ts', 'const key = "AKIAIOSFODNN7EXAMPLE" // your-key-here');
  assert.equal(result.findings.length, 0);
  assert.equal(result.placeholderMatches.length, 1);
});

test('server credentials referenced from the client bundle are violations', () => {
  const result = scanContents('apps/mobile/src/lib/api.ts', 'const key = process.env.SUPABASE_SERVICE_ROLE_KEY;');
  assert.equal(result.clientBundleViolations.length, 1);
  const serverSide = scanContents('services/ai/model-router.ts', 'const key = process.env.GEMINI_API_KEY;');
  assert.equal(serverSide.clientBundleViolations.length, 0);
});

test('the repository scan finds no live credentials', () => {
  const report = scanSecrets();
  assert.ok(report.scannedFiles > 50, 'the scan should cover the tracked tree');
  assert.deepEqual(report.findings, []);
  assert.deepEqual(report.clientBundleViolations, []);
  assert.equal(report.gitignoreCoversEnv, true);
});

test('leak detection matches only substantial values', () => {
  assert.deepEqual(findLeakedValues('nothing to see', ['abcdefghijkl']), []);
  assert.deepEqual(findLeakedValues('prefix abcdefghijkl suffix', ['abcdefghijkl']), ['abcdefghijkl']);
  assert.deepEqual(findLeakedValues('short', ['short']), [], 'values under 8 chars are too weak to assert on');
});

test('npm audit output is parsed, and an error payload is not read as zero findings', () => {
  const healthy = parseAudit(
    JSON.stringify({ metadata: { vulnerabilities: { critical: 0, high: 1, moderate: 2, low: 0, info: 0 } }, vulnerabilities: { lodash: { severity: 'high' } } }),
  );
  assert.equal(healthy.available, true);
  if (healthy.available) {
    assert.equal(healthy.vulnerabilities.high, 1);
    assert.equal(healthy.total, 3);
    assert.deepEqual(healthy.advisories, ['lodash:high']);
  }

  for (const payload of ['not json', JSON.stringify({ error: { code: 'ENETUNREACH', summary: 'offline' } }), '{}']) {
    assert.equal(parseAudit(payload).available, false);
  }
});

test('the SBOM covers every shipping runtime from its lockfile', () => {
  const report = buildSbom({ audit: false });
  assert.equal(report.runtimes.length, SHIPPING_RUNTIMES.length);
  for (const entry of report.runtimes) {
    assert.ok(entry.componentCount > 0, `${entry.runtime} produced no components`);
    assert.equal(entry.componentsWithIntegrity, entry.componentCount);
    assert.ok(entry.directCount > 0);
  }

  const document = toCycloneDx(report.runtimes[0] as never);
  assert.equal(document.bomFormat, 'CycloneDX');
  assert.ok(document.components.length > 0);
  assert.ok(document.components.every((component) => component.purl.startsWith('pkg:npm/')));
});
