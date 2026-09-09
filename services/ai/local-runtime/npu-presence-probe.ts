/**
 * 62L-EL6 — Read-only AMD NPU presence probe.
 *
 * Detection only through supported Windows/runtime interfaces (CIM/PnP).
 * Non-Windows CI uses a stub/simulator that stays NOT_TESTED unless fixture
 * device evidence is explicitly supplied (never auto-VERIFIED).
 *
 * Does not install drivers, change BIOS, elevate privileges, alter power plans,
 * or create hidden persistence.
 */

import { execFileSync } from 'node:child_process';
import type { ComputeCapability, HardwareSnapshot } from './types';
import { probeHardware } from './hardware-probe';
import { EL6_LOCKS, initialNpuCapabilityPosture } from './amd-npu-capability';

export type NpuProbeInterface = 'windows-pnp' | 'windows-cim' | 'stub-simulator';

export type NpuDeviceEvidence = {
  name: string;
  vendor?: string;
  interface: NpuProbeInterface;
  /** Raw FriendlyName / CIM Name — not personal content. */
  rawLabel: string;
  status?: string;
};

export type NpuPresenceProbeInput = {
  /**
   * Fixture device evidence for rule tests / non-Windows CI.
   * When omitted on non-Windows, probe stays empty (NOT_TESTED).
   */
  fixtureDevices?: NpuDeviceEvidence[];
  /** Force stub path even on win32 (unit tests). */
  forceStub?: boolean;
  /** Optional base snapshot (soft-wire from hardware-probe). */
  baseSnapshot?: HardwareSnapshot;
};

export type NpuPresenceProbeResult = {
  readOnly: true;
  interfaceUsed: NpuProbeInterface;
  platform: NodeJS.Platform;
  devices: NpuDeviceEvidence[];
  npus: ComputeCapability[];
  initialPosture: ReturnType<typeof initialNpuCapabilityPosture>;
  /** True only when at least one device evidence row was observed. */
  npuDetected: boolean;
  /** Always false — probe alone never verifies. */
  npuVerified: false;
  amdCpuPresent: boolean;
  ryzenBrandedSystem: boolean;
  /** AMD CPU alone never counts as NPU detection. */
  inferredFromAmdCpuAlone: false;
  locks: typeof EL6_LOCKS;
  notes: string[];
  snapshot: HardwareSnapshot;
};

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

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

function rowToEvidence(
  row: Record<string, unknown>,
  iface: NpuProbeInterface,
): NpuDeviceEvidence | null {
  const name = asText(row.Name) || asText(row.FriendlyName);
  if (!name) return null;
  const lower = name.toLowerCase();
  if (!/(npu|neural processing|ryzen ai)/i.test(name)) return null;

  const vendor = lower.includes('amd') || lower.includes('ryzen ai')
    ? 'AMD'
    : lower.includes('intel')
      ? 'Intel'
      : lower.includes('qualcomm')
        ? 'Qualcomm'
        : undefined;

  return {
    name,
    vendor,
    interface: iface,
    rawLabel: name,
    status: asText(row.Status) || undefined,
  };
}

function windowsEnumerateNpuDevices(): { devices: NpuDeviceEvidence[]; interfaceUsed: NpuProbeInterface } {
  const devices: NpuDeviceEvidence[] = [];

  const pnpRows = safeJsonPowerShell(
    "Get-PnpDevice -PresentOnly | Where-Object { $_.FriendlyName -match 'NPU|Neural Processing|Ryzen AI' } | Select-Object @{N='Name';E={$_.FriendlyName}},Class,Status",
  );
  for (const row of pnpRows) {
    if (row && typeof row === 'object') {
      const ev = rowToEvidence(row as Record<string, unknown>, 'windows-pnp');
      if (ev) devices.push(ev);
    }
  }

  if (devices.length > 0) {
    return { devices, interfaceUsed: 'windows-pnp' };
  }

  // Secondary conservative CIM path — still read-only PresentOnly inventory.
  const cimRows = safeJsonPowerShell(
    "Get-CimInstance Win32_PnPEntity | Where-Object { $_.Name -match 'NPU|Neural Processing|Ryzen AI' } | Select-Object Name,Status,PNPClass",
  );
  for (const row of cimRows) {
    if (row && typeof row === 'object') {
      const ev = rowToEvidence(row as Record<string, unknown>, 'windows-cim');
      if (ev) devices.push(ev);
    }
  }

  return {
    devices,
    interfaceUsed: devices.length > 0 ? 'windows-cim' : 'windows-pnp',
  };
}

function toNpuCapability(device: NpuDeviceEvidence): ComputeCapability {
  return {
    kind: 'npu',
    name: device.name,
    vendor: device.vendor,
    state: 'DETECTED',
    evidence: [
      `read-only ${device.interface} inventory reported: ${device.rawLabel}`,
      ...(device.status ? [`device status: ${device.status}`] : []),
    ],
  };
}

/**
 * Probe NPU presence. Starts at NOT_TESTED; DETECTED only with device evidence.
 * Fixtures may simulate evidence for rule tests — never auto-VERIFIED.
 */
export function probeNpuPresence(input: NpuPresenceProbeInput = {}): NpuPresenceProbeResult {
  const base = input.baseSnapshot ?? probeHardware();
  const amdCpuPresent = base.cpu.vendor === 'AMD';
  const ryzenBrandedSystem = (base.cpu.name ?? '').toLowerCase().includes('ryzen');
  const posture = initialNpuCapabilityPosture();

  let devices: NpuDeviceEvidence[] = [];
  let interfaceUsed: NpuProbeInterface = 'stub-simulator';

  const useWindows =
    process.platform === 'win32' && input.forceStub !== true && !input.fixtureDevices;

  if (input.fixtureDevices && input.fixtureDevices.length > 0) {
    devices = input.fixtureDevices.map((d) => ({
      ...d,
      interface: d.interface ?? 'stub-simulator',
    }));
    interfaceUsed = 'stub-simulator';
  } else if (useWindows) {
    const enumerated = windowsEnumerateNpuDevices();
    devices = enumerated.devices;
    interfaceUsed = enumerated.interfaceUsed;
  } else {
    // Non-Windows stub: empty inventory — AMD CPU presence does not invent NPU rows.
    devices = [];
    interfaceUsed = 'stub-simulator';
  }

  const npus = devices.map(toNpuCapability);
  const npuDetected = npus.length > 0;

  const snapshot: HardwareSnapshot = {
    ...base,
    npus: npus.length > 0 ? npus : base.npus,
    notes: [
      ...base.notes,
      'EL6 NPU probe is read-only; no BIOS/driver/power-plan/persistence changes.',
      'NPU DETECTED requires device evidence; AMD CPU alone is insufficient.',
      'NPU VERIFIED is never claimed by presence probe alone.',
    ],
  };

  return {
    readOnly: true,
    interfaceUsed,
    platform: process.platform,
    devices,
    npus,
    initialPosture: posture,
    npuDetected,
    npuVerified: false,
    amdCpuPresent,
    ryzenBrandedSystem,
    inferredFromAmdCpuAlone: false,
    locks: EL6_LOCKS,
    notes: [
      npuDetected
        ? 'NPU device evidence observed → DETECTED candidate path available.'
        : 'No NPU device evidence; posture remains NOT_TESTED/UNKNOWN.',
      amdCpuPresent
        ? 'AMD CPU observed — does not imply NPU_DETECTED.'
        : 'AMD CPU not observed in base snapshot.',
      'Presence probe never sets npuVerified=true.',
    ],
    snapshot,
  };
}
