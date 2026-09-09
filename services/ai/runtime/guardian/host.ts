/**
 * Node-only Guardian host adapter.
 * Executable, args, and cwd come from the static registry.
 * Never accepts a raw command string. Never uses a shell for npm/npx/git.
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, delimiter, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { GuardianCheckDefinition, GuardianCwdToken, GuardianExecutableToken } from './checks';
import type { HostExecutionResult } from './parse';
import type { GuardianHostAdapter } from './trusted';

const OUTPUT_CAP = 8_000;

export type GuardianSpawnPlan = {
  ok: true;
  executable: string;
  prefixArgs: readonly string[];
};

export type GuardianSpawnDenied = {
  ok: false;
  reason: string;
};

const ENV_ALLOW = [
  'PATH',
  'PATHEXT',
  'SYSTEMROOT',
  'SYSTEMDRIVE',
  'WINDIR',
  'COMSPEC',
  'HOME',
  'USERPROFILE',
  'HOMEDRIVE',
  'HOMEPATH',
  'TMP',
  'TEMP',
  'TMPDIR',
  'APPDATA',
  'LOCALAPPDATA',
  'PROGRAMDATA',
  'OS',
  'NUMBER_OF_PROCESSORS',
  'PROCESSOR_ARCHITECTURE',
  'NODE_PATH',
  'ComSpec',
  'LANG',
  'LC_ALL',
] as const;

function firstExisting(paths: readonly string[]) {
  return paths.find((item) => existsSync(item)) ?? null;
}

function npmCliCandidates() {
  const execDir = dirname(process.execPath);
  return [
    join(execDir, 'node_modules', 'npm', 'bin', 'npm-cli.js'),
    join(execDir, 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js'),
    join(execDir, '..', 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js'),
    join(execDir, '..', 'lib64', 'node_modules', 'npm', 'bin', 'npm-cli.js'),
  ];
}

function npxCliCandidates() {
  const execDir = dirname(process.execPath);
  return [
    join(execDir, 'node_modules', 'npm', 'bin', 'npx-cli.js'),
    join(execDir, 'lib', 'node_modules', 'npm', 'bin', 'npx-cli.js'),
    join(execDir, '..', 'lib', 'node_modules', 'npm', 'bin', 'npx-cli.js'),
    join(execDir, '..', 'lib64', 'node_modules', 'npm', 'bin', 'npx-cli.js'),
  ];
}

function pathEntries() {
  return (process.env.PATH ?? '').split(delimiter).filter(Boolean);
}

function windowsExecutableNames(token: 'npm' | 'npx') {
  const ext = (process.env.PATHEXT ?? '.EXE;.CMD;.BAT;.COM').split(';').filter(Boolean);
  return [token, ...ext.map((item) => `${token}${item.toLowerCase()}`), ...ext.map((item) => `${token}${item}`)];
}

function findOnPath(token: 'npm' | 'npx' | 'git') {
  const names =
    process.platform === 'win32' && token !== 'git' ? windowsExecutableNames(token) : token === 'git' && process.platform === 'win32' ? ['git.exe', 'git'] : [token];
  for (const dir of pathEntries()) {
    for (const name of names) {
      const candidate = join(dir, name);
      if (existsSync(candidate)) return candidate;
    }
  }
  return null;
}

/**
 * Resolve git/npm/npx without a shell and without concatenating untrusted strings.
 * Prefers node + npm-cli.js next to the running Node prefix (Windows-safe).
 * Falls back to PATH binaries when the prefix layout is nonstandard.
 */
export function resolveGuardianSpawn(token: GuardianExecutableToken): GuardianSpawnPlan | GuardianSpawnDenied {
  if (token === 'git') {
    const git = findOnPath('git');
    if (!git) return { ok: false, reason: 'git executable was not found on PATH.' };
    return { ok: true, executable: git, prefixArgs: [] };
  }

  const cli = firstExisting(token === 'npx' ? npxCliCandidates() : npmCliCandidates());
  if (cli) {
    return { ok: true, executable: process.execPath, prefixArgs: [cli] };
  }

  const fromPath = findOnPath(token);
  if (!fromPath) {
    return { ok: false, reason: `${token} executable was not found next to Node or on PATH.` };
  }
  return { ok: true, executable: fromPath, prefixArgs: [] };
}

function repoRoot() {
  return join(dirname(fileURLToPath(import.meta.url)), '../../../..');
}

function resolveCwd(token: GuardianCwdToken) {
  const root = repoRoot();
  if (token === 'apps/mobile') return join(root, 'apps/mobile');
  if (token === 'services/ai') return join(root, 'services/ai');
  return root;
}

function hostEnv() {
  const env: Record<string, string> = {};
  for (const key of ENV_ALLOW) {
    const value = process.env[key];
    if (value) env[key] = value;
  }
  return env;
}

function cap(text: string) {
  return text.length > OUTPUT_CAP ? `${text.slice(0, OUTPUT_CAP)}…` : text;
}

export function createHostExecutor(): GuardianHostAdapter {
  return {
    execute(check: GuardianCheckDefinition) {
      return new Promise((resolveResult) => {
        const command = check.command;
        if (!command) {
          resolveResult({
            exitCode: 1,
            stdout: '',
            stderr: 'Host adapter received a check without static command metadata.',
            timedOut: false,
          });
          return;
        }

        const plan = resolveGuardianSpawn(command.executable);
        if (!plan.ok) {
          resolveResult({
            exitCode: 1,
            stdout: '',
            stderr: `Host process failed to start. ${plan.reason}`,
            timedOut: false,
          });
          return;
        }

        const cwd = resolveCwd(command.cwd);
        const child = spawn(plan.executable, [...plan.prefixArgs, ...command.args], {
          cwd,
          shell: false,
          windowsHide: true,
          env: hostEnv(),
        });

        let stdout = '';
        let stderr = '';
        let timedOut = false;
        let settled = false;
        const finish = (result: HostExecutionResult) => {
          if (settled) return;
          settled = true;
          resolveResult(result);
        };

        const timer = setTimeout(() => {
          timedOut = true;
          child.kill();
        }, check.timeoutMs);

        child.stdout?.on('data', (chunk: Buffer) => {
          if (stdout.length < OUTPUT_CAP) stdout += chunk.toString('utf8');
        });
        child.stderr?.on('data', (chunk: Buffer) => {
          if (stderr.length < OUTPUT_CAP) stderr += chunk.toString('utf8');
        });
        child.on('error', () => {
          clearTimeout(timer);
          finish({
            exitCode: 1,
            stdout: '',
            stderr: 'Host process failed to start. Executable metadata is static; the path is not returned.',
            timedOut: false,
          });
        });
        child.on('close', (code) => {
          clearTimeout(timer);
          finish({
            exitCode: code,
            stdout: cap(stdout),
            stderr: cap(stderr),
            timedOut,
          });
        });
      });
    },
  };
}
