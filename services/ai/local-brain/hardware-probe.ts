import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export type HardwareCapability = {
  kind: 'cpu' | 'nvidia_gpu' | 'amd_gpu' | 'apple_gpu' | 'samsung_arm' | 'unknown_accelerator';
  vendor: string;
  model: string;
  availability: 'AVAILABLE' | 'UNAVAILABLE';
  evidence: string[];
};

async function tryCommand(command: string, args: string[]) {
  try {
    const { stdout } = await execFileAsync(command, args, { timeout: 2500, windowsHide: true });
    return stdout.trim();
  } catch {
    return null;
  }
}

export async function probeHardware(): Promise<HardwareCapability[]> {
  const results: HardwareCapability[] = [{
    kind: 'cpu',
    vendor: os.cpus()[0]?.model ?? 'unknown',
    model: os.arch(),
    availability: 'AVAILABLE',
    evidence: [`logical_cpu_count:${os.cpus().length}`, `platform:${os.platform()}`, `arch:${os.arch()}`],
  }];

  const nvidia = await tryCommand('nvidia-smi', ['--query-gpu=name', '--format=csv,noheader']);
  results.push({
    kind: 'nvidia_gpu',
    vendor: 'NVIDIA',
    model: nvidia?.split('\n')[0] ?? 'not detected',
    availability: nvidia ? 'AVAILABLE' : 'UNAVAILABLE',
    evidence: nvidia ? ['nvidia-smi:reachable'] : ['nvidia-smi:not-reachable'],
  });

  if (os.platform() === 'darwin' && os.arch() === 'arm64') {
    results.push({ kind: 'apple_gpu', vendor: 'Apple', model: 'Apple Silicon integrated GPU', availability: 'AVAILABLE', evidence: ['darwin:arm64'] });
  } else {
    results.push({ kind: 'apple_gpu', vendor: 'Apple', model: 'not detected', availability: 'UNAVAILABLE', evidence: ['host-not-darwin-arm64'] });
  }

  // AMD/Samsung detection remains conservative until a provider-specific probe is added.
  results.push({ kind: 'amd_gpu', vendor: 'AMD', model: 'unverified', availability: 'UNAVAILABLE', evidence: ['provider-specific-probe-not-configured'] });
  results.push({ kind: 'samsung_arm', vendor: 'Samsung/ARM', model: 'unverified', availability: 'UNAVAILABLE', evidence: ['provider-specific-probe-not-configured'] });
  return results;
}
