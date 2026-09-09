import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';

import { evaluateSandboxGitAction, evaluateSandboxWrite, isProtectedRef } from './sandbox-guard';
import { isAllowedLocalCommand, runAllowedLocalCommand, type AllowedLocalCommand } from './local-command-runner';

export type ProtectedSandbox = {
  id: string;
  tenantId: string;
  universeId: string;
  root: string;
  branch: string;
  isolated: true;
  productionAuthorization: false;
};

function inside(root: string, target: string) {
  const rel = relative(root, target);
  return rel === '' || (!rel.startsWith(`..${sep}`) && rel !== '..' && !isAbsolute(rel));
}

export function openProtectedSourceSandbox(input: {
  tenantId: string;
  universeId: string;
  root: string;
  branch: string;
}) {
  if (!input.tenantId || !input.universeId || !input.root.trim() || !input.branch.trim()) {
    return { allowed: false as const, reason: 'Protected sandbox requires tenant, Universe, root, and branch.' };
  }
  if (isProtectedRef(input.branch)) {
    return { allowed: false as const, reason: `Protected current ref refused: ${input.branch}`, productionAuthorization: false as const };
  }
  const git = evaluateSandboxGitAction({ currentBranch: input.branch, action: 'commit' });
  if (!git.allowed) {
    return { allowed: false as const, reason: git.reason, productionAuthorization: false as const };
  }
  const sandbox: ProtectedSandbox = {
    id: `sandbox_${input.tenantId}_${input.universeId}`,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root: resolve(input.root),
    branch: input.branch,
    isolated: true,
    productionAuthorization: false,
  };
  return { allowed: true as const, sandbox, reason: 'Protected source sandbox is eligible for local candidate writes only.', productionAuthorization: false as const };
}

export function evaluateSandboxIsolation(input: {
  sandbox: ProtectedSandbox;
  path: string;
  kind?: 'file' | 'database';
  productionDatabase?: boolean;
}) {
  const write = evaluateSandboxWrite({
    kind: input.kind ?? 'file',
    path: input.path,
    productionDatabase: input.productionDatabase,
  });
  if (!write.allowed) return { isolated: false as const, allowed: false as const, reason: write.reason, productionAuthorization: false as const };
  if (input.kind === 'file' || input.kind === undefined) {
    if (isAbsolute(input.path) || input.path.includes('\0')) {
      return { isolated: false as const, allowed: false as const, reason: 'Sandbox path must be a relative in-repo path.', productionAuthorization: false as const };
    }
    const target = resolve(input.sandbox.root, input.path);
    if (!inside(input.sandbox.root, target)) {
      return { isolated: false as const, allowed: false as const, reason: 'Sandbox isolation refused a path outside the protected root.', productionAuthorization: false as const };
    }
  }
  return { isolated: true as const, allowed: true as const, reason: 'Path stays inside the protected source sandbox.', productionAuthorization: false as const };
}

export async function writeSandboxCandidateFile(input: {
  sandbox: ProtectedSandbox;
  path: string;
  content: string;
}) {
  const isolation = evaluateSandboxIsolation({ sandbox: input.sandbox, path: input.path, kind: 'file' });
  if (!isolation.allowed) {
    return { written: false as const, reason: isolation.reason, productionAuthorization: false as const };
  }
  const target = resolve(input.sandbox.root, input.path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, input.content, { encoding: 'utf8', mode: 0o600 });
  return { written: true as const, path: relative(input.sandbox.root, target).replaceAll('\\', '/'), productionAuthorization: false as const };
}

export async function runFactoryAllowlistedCommand(input: {
  id: string;
  cwd: string;
  modelProvidedShell?: string;
  timeoutMs?: number;
}) {
  if (input.modelProvidedShell && input.modelProvidedShell.trim()) {
    return {
      allowed: false as const,
      reason: 'MODEL_PROVIDED_SHELL_REFUSED: factory runners never execute model-provided arbitrary shell.',
      exitCode: null,
      stdout: '',
      stderr: '',
      timedOut: false,
      productionEffect: false as const,
      productionAuthorization: false as const,
    };
  }
  if (!isAllowedLocalCommand(input.id)) {
    return {
      allowed: false as const,
      reason: `FACTORY_COMMAND_NOT_ALLOWLISTED:${input.id}`,
      exitCode: null,
      stdout: '',
      stderr: '',
      timedOut: false,
      productionEffect: false as const,
      productionAuthorization: false as const,
    };
  }
  const result = await runAllowedLocalCommand({
    id: input.id as AllowedLocalCommand,
    cwd: input.cwd,
    timeoutMs: input.timeoutMs,
  });
  return {
    allowed: true as const,
    reason: 'Allowlisted local command runner executed.',
    commandId: input.id as AllowedLocalCommand,
    exitCode: result.exitCode,
    stdout: result.stdout,
    stderr: result.stderr,
    timedOut: result.timedOut,
    productionEffect: false as const,
    productionAuthorization: false as const,
  };
}
