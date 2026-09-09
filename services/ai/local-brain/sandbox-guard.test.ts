import assert from 'node:assert/strict';

import { evaluateSandboxGitAction, evaluateSandboxOperation, evaluateSandboxWrite, isProtectedRef } from './sandbox-guard';

assert.equal(isProtectedRef('main'), true);
assert.equal(isProtectedRef('master'), true);
assert.equal(isProtectedRef('xiv-v2'), true);
assert.equal(isProtectedRef('refs/heads/main'), true);
assert.equal(isProtectedRef('chatgpt/62l-local-brain-offline'), false);

assert.equal(evaluateSandboxGitAction({ currentBranch: 'main', action: 'commit' }).allowed, false);
assert.equal(evaluateSandboxGitAction({ currentBranch: 'chatgpt/62l-local-brain-offline', action: 'push', remote: 'origin' }).allowed, false);
assert.equal(evaluateSandboxGitAction({ currentBranch: 'feature/x', action: 'checkout', targetRef: 'master' }).allowed, false);
assert.equal(evaluateSandboxGitAction({ currentBranch: 'chatgpt/62l-local-brain-offline', action: 'commit' }).allowed, true);

assert.equal(evaluateSandboxWrite({ kind: 'database', productionDatabase: true }).allowed, false);
assert.equal(evaluateSandboxWrite({ kind: 'database', productionDatabase: false }).allowed, true);
assert.equal(evaluateSandboxWrite({ kind: 'file', path: '.env' }).allowed, false);
assert.equal(evaluateSandboxWrite({ kind: 'file', path: 'secrets/token.pem' }).allowed, false);
assert.equal(evaluateSandboxWrite({ kind: 'file', path: '../outside.ts' }).allowed, false);
assert.equal(evaluateSandboxWrite({ kind: 'file', path: 'services/ai/local-brain/sandbox-guard.ts' }).allowed, true);

assert.equal(evaluateSandboxOperation({ currentBranch: 'xiv-v2', action: 'commit' }).allowed, false);
assert.equal(evaluateSandboxOperation({ currentBranch: 'feature/x', action: 'db_write', databaseTarget: 'production' }).allowed, false);
assert.equal(evaluateSandboxOperation({ currentBranch: 'feature/x', action: 'write_file', filePath: 'id_rsa' }).allowed, false);
assert.equal(evaluateSandboxOperation({ currentBranch: 'feature/x', action: 'push' }).allowed, false);

console.log('sandbox-guard.test.ts PASS');
