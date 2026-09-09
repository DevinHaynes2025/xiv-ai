import { spawn } from 'node:child_process';

export type AllowedLocalCommand = 'git_status' | 'git_diff' | 'git_diff_check' | 'npm_typecheck' | 'npm_test';

const COMMANDS: Record<AllowedLocalCommand, { command: string; args: string[] }> = {
  git_status: { command: 'git', args: ['status', '--short'] },
  git_diff: { command: 'git', args: ['diff', '--'] },
  git_diff_check: { command: 'git', args: ['diff', '--check'] },
  npm_typecheck: { command: 'npm', args: ['run', 'typecheck', '--if-present'] },
  npm_test: { command: 'npm', args: ['test', '--', '--runInBand'] },
};

export async function runAllowedLocalCommand(input: {
  id: AllowedLocalCommand;
  cwd: string;
  timeoutMs?: number;
}) {
  const spec = COMMANDS[input.id];
  const timeoutMs = Math.max(1_000, Math.min(input.timeoutMs ?? 120_000, 300_000));
  return new Promise<{ exitCode: number | null; stdout: string; stderr: string; timedOut: boolean; productionEffect: false }>((resolve, reject) => {
    const child = spawn(spec.command, spec.args, {
      cwd: input.cwd,
      shell: false,
      windowsHide: true,
      env: { PATH: process.env.PATH ?? '', SystemRoot: process.env.SystemRoot ?? '', HOME: process.env.HOME ?? '', USERPROFILE: process.env.USERPROFILE ?? '' },
    });
    let stdout = '';
    let stderr = '';
    const cap = 512_000;
    child.stdout.on('data', (chunk) => { if (stdout.length < cap) stdout += String(chunk).slice(0, cap - stdout.length); });
    child.stderr.on('data', (chunk) => { if (stderr.length < cap) stderr += String(chunk).slice(0, cap - stderr.length); });
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; child.kill(); }, timeoutMs);
    child.on('error', (error) => { clearTimeout(timer); reject(error); });
    child.on('close', (exitCode) => {
      clearTimeout(timer);
      resolve({ exitCode, stdout, stderr, timedOut, productionEffect: false });
    });
  });
}
