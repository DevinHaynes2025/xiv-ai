/**
 * 62L-EL — Read-only hardware probe.
 *
 * Windows path uses read-only CIM/PnP inventory APIs (no driver install,
 * no elevation, no personal-file/credential/browser scraping).
 * Non-Windows CI uses a safe stub/simulator via injected inventory only.
 */

import os from 'node:os';
import { execFileSync } from 'node:child_process';
import type { ComputeCapability, HardwareSnapshot } from './types';

export type HardwareInventoryRow = {
  Name?: unknown;
  AdapterCompatibility?: unknown;
  DriverVersion?: unknown;
  Class?: unknown;
  Status?: unknown;
};

export type HardwareProbeOptions = {
  /**
   * Injected inventory for unit tests / non-Windows CI simulator.
   * When set, live PowerShell is not invoked.
   */
  inventory?: {
    displayAdapters?: HardwareInventoryRow[];
    npuDevices?: HardwareInventoryRow[];
  };
  /** Force platform label in snapshot (tests). Does not enable live Win32 calls. */
  platformOverride?: string;
};

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

function inferVendor(name: string, adapterCompatibility?: string): string | undefined {
  const hay = `${adapterCompatibility ?? ''} ${name}`.toLowerCase();
  if (hay.includes('amd') || hay.includes('radeon') || hay.includes('advanced micro devices')) {
    return 'AMD';
  }
  if (hay.includes('nvidia')) return 'NVIDIA';
  if (hay.includes('intel')) return 'Intel';
  return undefined;
}

function toCapability(kind: 'gpu' | 'npu', row: HardwareInventoryRow): ComputeCapability {
  const name = asText(row.Name) || undefined;
  const adapterCompatibility = asText(row.AdapterCompatibility) || undefined;
  const vendor = name ? inferVendor(name, adapterCompatibility) : undefined;
  return {
    kind,
    name,
    vendor,
    state: name ? 'DETECTED' : 'UNKNOWN',
    evidence: name
      ? [
          `read-only device inventory reported: ${name}`,
          ...(adapterCompatibility ? [`adapterCompatibility: ${adapterCompatibility}`] : []),
        ]
      : [],
  };
}

/**
 * Read-only probe. On win32 without injected inventory, enumerates display adapters
 * via Get-CimInstance (read-only). Elsewhere (or with inventory), uses stub/simulator data.
 */
export function probeHardware(options: HardwareProbeOptions = {}): HardwareSnapshot {
  const cpuName = os.cpus()[0]?.model?.trim() || 'Unknown CPU';
  const cpuVendor = cpuName.toLowerCase().includes('amd')
    ? 'AMD'
    : cpuName.toLowerCase().includes('intel')
      ? 'Intel'
      : undefined;

  const gpus: ComputeCapability[] = [];
  const npus: ComputeCapability[] = [];
  const platform = options.platformOverride ?? process.platform;
  const usingInjected = options.inventory !== undefined;

  if (usingInjected) {
    for (const row of options.inventory?.displayAdapters ?? []) {
      gpus.push(toCapability('gpu', row));
    }
    for (const row of options.inventory?.npuDevices ?? []) {
      npus.push(toCapability('npu', row));
    }
  } else if (process.platform === 'win32') {
    const displayRows = safeJsonPowerShell(
      'Get-CimInstance Win32_VideoController | Select-Object Name,AdapterCompatibility,DriverVersion',
    );
    for (const row of displayRows) {
      if (row && typeof row === 'object') gpus.push(toCapability('gpu', row as HardwareInventoryRow));
    }

    // NPU enumeration is intentionally conservative because Windows exposure varies by device/driver.
    // We only mark DETECTED when a PnP device explicitly advertises NPU/neural processing wording.
    const npuRows = safeJsonPowerShell(
      "Get-PnpDevice -PresentOnly | Where-Object { $_.FriendlyName -match 'NPU|Neural Processing' } | Select-Object @{N='Name';E={$_.FriendlyName}},Class,Status",
    );
    for (const row of npuRows) {
      if (row && typeof row === 'object') npus.push(toCapability('npu', row as HardwareInventoryRow));
    }
  }

  const notes = [
    'Probe is read-only and does not inspect user files, browser data, credentials, or personal content.',
    'DETECTED does not mean SUPPORTED or VERIFIED for local inference.',
    'EL5: no driver installation, permission elevation, cloud purchase, or system configuration changes.',
    usingInjected
      ? 'Inventory source: injected stub/simulator (non-live; safe for CI).'
      : process.platform === 'win32'
        ? 'Inventory source: read-only Windows CIM/PnP APIs.'
        : 'Inventory source: non-Windows host — GPU/NPU lists empty unless inventory is injected.',
  ];

  return {
    capturedAt: new Date().toISOString(),
    platform,
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
    notes,
  };
}

/** Explicit CI/non-Windows simulator entry — never claims live Windows verification. */
export function simulateHardwareProbe(
  inventory: NonNullable<HardwareProbeOptions['inventory']>,
  platformOverride = 'win32-simulator',
): HardwareSnapshot {
  return probeHardware({ inventory, platformOverride });
}
