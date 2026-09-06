import { spawn } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { GuardianCheckDefinition, GuardianCwdToken, GuardianExecutableToken } from './checks';
import type { HostExecutionResult } from './parse';
import type { GuardianHostAdapter } from './trusted';

const OUTPUT_CAP = 8_000;

const NODE_BIN = dirname(process.execPath);
const NPX_CLI = join(NODE_BIN, 'node_modules', 'npm', 'bin', 'npx-cli.js');
const NPM_CLI = join(NODE_BIN, 'node_modules', 'npm', 'bin', 'npm-cli.js');

function resolveSpawn(token: GuardianExecutableToken): { executable: string; prefixArgs: readonly string[] } {
  if (token === 'git') return { executable: 'git', prefixArgs: [] };
  if (token === 'npx') return { executable: process.execPath, prefixArgs: [NPX_CLI] };
  return { executable: process.execPath, prefixArgs: [NPM_CLI] };
}

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
] as const;

function repoRoot() {
  return resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
}

function resolveCwd(token: GuardianCwdToken) {
  const root = repoRoot();
  if (token === 'apps/mobile') return resolve(root, 'apps/mobile');
  if (token === 'services/ai') return resolve(root, 'services/ai');
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

/**
 * Node-only adapter. Executable, args, and cwd come from the static registry.
 * Never accepts a raw command string.
 */
export function createHostExecutor(): GuardianHostAdapter {
  return {
    execute(check: GuardianCheckDefinition) {
      return new Promise((resolveResult) => {
        const command = check.command;
        if (!command) {
          reject(new Error('Host adapter received a check without static command metadata.'));
          return;
        }

        const { executable, prefixArgs } = resolveSpawn(command.executable);
        const cwd = resolveCwd(command.cwd);
        const child = spawn(executable, [...prefixArgs, ...command.args], {
          cwd,
          shell: false,
          windowsHide: true,
          env: hostEnv(),
        });

        let stdout = '';
        let stderr = '';
        let timedOut = false;
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
          resolveResult({
            exitCode: 1,
            stdout: '',
            stderr: 'Host process failed to start. Executable metadata is static; the path is not returned.',
            timedOut: false,
          });
        });
        child.on('close', (code) => {
          clearTimeout(timer);
          const result: HostExecutionResult = {
            exitCode: code,
            stdout: cap(stdout),
            stderr: cap(stderr),
            timedOut,
          };
          resolveResult(result);
        });
      });
    },
  };
}
