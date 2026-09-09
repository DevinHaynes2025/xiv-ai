import os from 'node:os';
import { execFileSync } from 'node:child_process';
import type { ComputeCapability, HardwareSnapshot } from './types';

function safeJsonPowerShell(script: string): unknown[] {
  try {
    const raw = execFileSync(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', `${script} | ConvertTo-Json -Depth 4 -Compress`],
      { encoding: 'utf8', timeout: 4000, windowsHide: true },
    ).trim();
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
  }
}

function asText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function toCapability(kind: 'gpu' | 'npu', row: Record<string, unknown>): ComputeCapability {
  const name = asText(row.Name) || undefined;
  const vendor = name?.toLowerCase().includes('amd')
    ? 'AMD'
    : name?.toLowerCase().includes('nvidia')
      ? 'NVIDIA'
      : name?.toLowerCase().includes('intel')
        ? 'Intel'
        : undefined;
  return {
    kind,
    name,
    vendor,
    state: name ? 'DETECTED' : 'UNKNOWN',
    evidence: name ? [`read-only Windows device inventory reported: ${name}`] : [],
  };
}

export function probeHardware(): HardwareSnapshot {
  const cpuName = os.cpus()[0]?.model?.trim() || 'Unknown CPU';
  const cpuVendor = cpuName.toLowerCase().includes('amd')
    ? 'AMD'
    : cpuName.toLowerCase().includes('intel')
      ? 'Intel'
      : undefined;

  const gpus: ComputeCapability[] = [];
  const npus: ComputeCapability[] = [];

  if (process.platform === 'win32') {
    const displayRows = safeJsonPowerShell(
      "Get-CimInstance Win32_VideoController | Select-Object Name,AdapterCompatibility,DriverVersion",
    );
    for (const row of displayRows) {
      if (row && typeof row === 'object') gpus.push(toCapability('gpu', row as Record<string, unknown>));
    }

    // NPU enumeration is intentionally conservative because Windows exposure varies by device/driver.
    // We only mark DETECTED when a PnP device explicitly advertises NPU/neural processing wording.
    const npuRows = safeJsonPowerShell(
      "Get-PnpDevice -PresentOnly | Where-Object { $_.FriendlyName -match 'NPU|Neural Processing' } | Select-Object @{N='Name';E={$_.FriendlyName}},Class,Status",
    );
    for (const row of npuRows) {
      if (row && typeof row === 'object') npus.push(toCapability('npu', row as Record<string, unknown>));
    }
  }

  return {
    capturedAt: new Date().toISOString(),
    platform: process.platform,
    release: os.release(),
    arch: os.arch(),
    totalMemoryBytes: os.totalmem(),
    freeMemoryBytes: os.freemem(),
    cpu: {
      kind: 'cpu',
      name: cpuName,
      vendor: cpuVendor,
      state: 'DETECTED',
      evidence: ['reported by Node.js os.cpus()'],
    },
    gpus,
    npus,
    notes: [
      'Probe is read-only and does not inspect user files, browser data, credentials, or personal content.',
      'DETECTED does not mean SUPPORTED or VERIFIED for local inference.',
    ],
  };
}
