import assert from 'node:assert/strict';
import { mkdtemp, rm, symlink, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { readApprovedContext } from './context-vault';

const root = await mkdtemp(join(tmpdir(), 'xiv-vault-'));
const outside = await mkdtemp(join(tmpdir(), 'xiv-vault-outside-'));
try {
  await writeFile(join(root, 'allowed.ts'), 'export const ok = true;\n', 'utf8');
  const allowed = await readApprovedContext(root, 'allowed.ts');
  assert.equal(allowed.path, 'allowed.ts');
  assert.match(allowed.content, /export const ok/);

  await assert.rejects(() => readApprovedContext(root, '../secret.txt'), /CONTEXT_PATH_OUTSIDE_REPO/);
  await assert.rejects(() => readApprovedContext(root, '..\\secret.txt'), /CONTEXT_PATH_OUTSIDE_REPO|CONTEXT_PATH_DENIED/);

  await writeFile(join(outside, 'escaped.txt'), 'outside\n', 'utf8');
  await symlink(join(outside, 'escaped.txt'), join(root, 'link-out.ts'));
  await assert.rejects(() => readApprovedContext(root, 'link-out.ts'), /CONTEXT_SYMLINK_OUTSIDE_REPO/);

  await writeFile(join(root, 'huge.ts'), 'x'.repeat(256_001), 'utf8');
  await assert.rejects(() => readApprovedContext(root, 'huge.ts'), /CONTEXT_FILE_TOO_LARGE/);

  await writeFile(join(root, '.env'), 'SECRET=1\n', 'utf8');
  await assert.rejects(() => readApprovedContext(root, '.env'), /CONTEXT_PATH_DENIED/);
  await mkdir(join(root, '.git'), { recursive: true });
  await writeFile(join(root, '.git', 'config'), 'x\n', 'utf8');
  await assert.rejects(() => readApprovedContext(root, '.git/config'), /CONTEXT_PATH_DENIED/);
  await mkdir(join(root, 'node_modules', 'pkg'), { recursive: true });
  await writeFile(join(root, 'node_modules', 'pkg', 'index.js'), 'x\n', 'utf8');
  await assert.rejects(() => readApprovedContext(root, 'node_modules/pkg/index.js'), /CONTEXT_PATH_DENIED/);
  await mkdir(join(root, '.xiv-local'), { recursive: true });
  await writeFile(join(root, '.xiv-local', 'brain-state.json'), '{}\n', 'utf8');
  await assert.rejects(() => readApprovedContext(root, '.xiv-local/brain-state.json'), /CONTEXT_PATH_DENIED/);

  console.log('context-vault.test.ts PASS');
} finally {
  await rm(root, { recursive: true, force: true });
  await rm(outside, { recursive: true, force: true });
}
