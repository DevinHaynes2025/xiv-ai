import { execFile } from 'node:child_process';
import os from 'node:os';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

/** GPU/NPU truth — VERIFIED is intentionally excluded (never claim silicon without workload proof). */
export type SiliconTruthState = 'DETECTED' | 'WAITING' | 'UNAVAILABLE' | 'UNKNOWN';

export type CpuVendor = 'AMD' | 'INTEL' | 'APPLE' | 'ARM' | 'OTHER' | 'UNKNOWN';
export type GpuVendor = 'AMD' | 'NVIDIA' | 'APPLE' | 'INTEL' | 'OTHER' | 'UNKNOWN';

export type HostSiliconSnapshot = {
  cpuModel: string | null;
  gpuNames: string[];
  npuNames: string[];
  source: 'windows_cim' | 'env' | 'none';
};

export type HardwareProbeReport = {
  storyId: 'EY3';
  collectedAt: string;
  hostname: string;
  platform: NodeJS.Platform;
  arch: string;
  /** Always false for EY3 — probe does not grant autonomy. */
  l4Autonomy: false;
  cpu: {
    vendor: CpuVendor;
    model: string;
    cores: number;
    threads: number;
    state: SiliconTruthState;
    notes: string;
  };
  memory: {
    totalBytes: number;
    freeBytes: number;
  };
  gpu: {
    vendor: GpuVendor;
    name: string | null;
    state: SiliconTruthState;
    notes: string;
  };
  npu: {
    name: string | null;
    state: SiliconTruthState;
    notes: string;
  };
  ollama: {
    reachable: boolean;
    baseUrl: string;
    models: string[];
    state: SiliconTruthState;
    notes: string;
  };
  offlineHints: {
    preferLocal: boolean;
    waitingProvider: boolean;
  };
};

const OLLAMA_DEFAULT = 'http://127.0.0.1:11434';
const OLLAMA_TIMEOUT_MS = 2_500;
const HOST_PROBE_TIMEOUT_MS = 8_000;

export const HARDWARE_PROBE_POLICY = {
  storyId: 'EY3' as const,
  l4Autonomy: false as const,
  /** GPU/NPU must never report VERIFIED from this probe alone. */
  allowsFakeVerifiedSilicon: false as const,
  productionMutation: false as const,
};

function ollamaBaseUrl(): string {
  return (process.env.OLLAMA_BASE_URL?.trim() || OLLAMA_DEFAULT).replace(/\/$/, '');
}

function preferLocal(): boolean {
  return ['1', 'true', 'yes'].includes((process.env.OFFLINE_PREFER_LOCAL || '').trim().toLowerCase());
}

export function inferCpuVendor(model: string): CpuVendor {
  const m = model.toLowerCase();
  if (m.includes('amd') || m.includes('ryzen') || m.includes('epyc') || m.includes('threadripper')) return 'AMD';
  if (m.includes('intel') || m.includes('core(tm)') || m.includes('xeon')) return 'INTEL';
  if (m.includes('apple') || m.includes('m1') || m.includes('m2') || m.includes('m3') || m.includes('m4')) return 'APPLE';
  if (m.includes('arm') || m.includes('snapdragon') || m.includes('qualcomm')) return 'ARM';
  if (model.trim()) return 'OTHER';
  return 'UNKNOWN';
}

export function inferGpuVendor(name: string | null): GpuVendor {
  if (!name) return 'UNKNOWN';
  const m = name.toLowerCase();
  if (m.includes('amd') || m.includes('radeon') || m.includes('instinct')) return 'AMD';
  if (
    m.includes('nvidia') ||
    m.includes('geforce') ||
    m.includes('quadro') ||
    m.includes('tesla') ||
    m.includes('rtx')
  ) {
    return 'NVIDIA';
  }
  if (m.includes('apple') || m.includes('metal')) return 'APPLE';
  if (m.includes('intel') || m.includes('arc ') || m.includes('uhd') || m.includes('iris')) return 'INTEL';
  return 'OTHER';
}

/** Clamp accidental VERIFIED (or any other) down to an allowed silicon state. */
export function clampSiliconState(
  raw: string | null | undefined,
  fallback: SiliconTruthState,
): SiliconTruthState {
  const v = (raw ?? '').trim().toUpperCase();
  if (v === 'VERIFIED' || v === 'SUPPORTED') {
    return 'DETECTED';
  }
  if (v === 'DETECTED' || v === 'WAITING' || v === 'UNAVAILABLE' || v === 'UNKNOWN') {
    return v;
  }
  return fallback;
}

async function isOllamaReachable(
  baseUrl: string,
): Promise<{ reachable: boolean; models: string[]; notes: string }> {
  try {
    const res = await fetch(`${baseUrl}/api/tags`, { signal: AbortSignal.timeout(OLLAMA_TIMEOUT_MS) });
    if (!res.ok) {
      return { reachable: false, models: [], notes: `Ollama /api/tags HTTP ${res.status}` };
    }
    const body = (await res.json()) as { models?: { name?: string }[] };
    const models = (body.models ?? []).map((m) => m.name ?? '').filter(Boolean);
    return {
      reachable: true,
      models,
      notes: models.length
        ? `Ollama /api/tags reachable; ${models.length} model(s) listed.`
        : 'Ollama /api/tags reachable; model list empty.',
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'fetch_failed';
    return { reachable: false, models: [], notes: `Ollama unreachable: ${msg}` };
  }
}

const WINDOWS_HOST_SCRIPT = `
$ErrorActionPreference = 'SilentlyContinue'
$cpu = $null
try { $cpu = (Get-CimInstance Win32_Processor | Select-Object -First 1).Name } catch {}
$gpus = @()
try { $gpus = @(Get-CimInstance Win32_VideoController | ForEach-Object { $_.Name } | Where-Object { $_ }) } catch {}
$npus = @()
try {
  $npus = @(Get-PnpDevice -Class ComputeAccelerator -Status OK -ErrorAction SilentlyContinue |
    ForEach-Object { $_.FriendlyName } | Where-Object { $_ })
} catch {}
@{ cpuModel = $cpu; gpuNames = $gpus; npuNames = $npus } | ConvertTo-Json -Compress
`.trim();

export async function probeWindowsHostSilicon(): Promise<HostSiliconSnapshot> {
  if (process.platform !== 'win32') {
    return { cpuModel: null, gpuNames: [], npuNames: [], source: 'none' };
  }
  try {
    const { stdout } = await execFileAsync(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', WINDOWS_HOST_SCRIPT],
      { timeout: HOST_PROBE_TIMEOUT_MS, windowsHide: true, maxBuffer: 1024 * 1024 },
    );
    const parsed = JSON.parse(String(stdout || '').trim() || '{}') as {
      cpuModel?: string | null;
      gpuNames?: string | string[] | null;
      npuNames?: string | string[] | null;
    };
    const gpuNames = Array.isArray(parsed.gpuNames)
      ? parsed.gpuNames.filter((n): n is string => typeof n === 'string' && n.trim().length > 0)
      : typeof parsed.gpuNames === 'string' && parsed.gpuNames.trim()
        ? [parsed.gpuNames.trim()]
        : [];
    const npuNames = Array.isArray(parsed.npuNames)
      ? parsed.npuNames.filter((n): n is string => typeof n === 'string' && n.trim().length > 0)
      : typeof parsed.npuNames === 'string' && parsed.npuNames.trim()
        ? [parsed.npuNames.trim()]
        : [];
    return {
      cpuModel: typeof parsed.cpuModel === 'string' && parsed.cpuModel.trim() ? parsed.cpuModel.trim() : null,
      gpuNames,
      npuNames,
      source: 'windows_cim',
    };
  } catch {
    return { cpuModel: null, gpuNames: [], npuNames: [], source: 'none' };
  }
}

function envHostOverlay(): HostSiliconSnapshot {
  const gpuName = process.env.XIV_GPU_NAME?.trim() || null;
  const gpuVendor = process.env.XIV_GPU_VENDOR?.trim();
  const npuName = process.env.XIV_NPU_NAME?.trim() || null;
  const syntheticGpu = gpuName || (gpuVendor ? `${gpuVendor} (env-only; no device name)` : null);
  return {
    cpuModel: null,
    gpuNames: syntheticGpu ? [syntheticGpu] : [],
    npuNames: npuName ? [npuName] : [],
    source: 'env',
  };
}

function mergeHostSnapshots(primary: HostSiliconSnapshot, overlay: HostSiliconSnapshot): HostSiliconSnapshot {
  const cpuModel = primary.cpuModel || overlay.cpuModel;
  const gpuNames = primary.gpuNames.length ? primary.gpuNames : overlay.gpuNames;
  const npuNames = primary.npuNames.length ? primary.npuNames : overlay.npuNames;
  let source: HostSiliconSnapshot['source'] = primary.source;
  if (primary.source === 'none' && (overlay.gpuNames.length || overlay.npuNames.length)) {
    source = 'env';
  } else if (
    primary.source === 'windows_cim' &&
    ((!primary.gpuNames.length && overlay.gpuNames.length) ||
      (!primary.npuNames.length && overlay.npuNames.length))
  ) {
    source = 'windows_cim';
  }
  return { cpuModel, gpuNames, npuNames, source };
}

export type CollectHardwareProbeOptions = {
  /** Injected host snapshot for tests; when omitted, live Windows CIM / env is used. */
  host?: HostSiliconSnapshot;
  /** Injected ollama check for tests. */
  ollamaCheck?: (baseUrl: string) => Promise<{ reachable: boolean; models: string[]; notes: string }>;
};

export async function collectHardwareProbe(
  options: CollectHardwareProbeOptions = {},
): Promise<HardwareProbeReport> {
  const cpus = os.cpus();
  const nodeCpuModel = cpus[0]?.model?.trim() || 'unknown';
  const host =
    options.host ??
    mergeHostSnapshots(await probeWindowsHostSilicon(), envHostOverlay());

  const cpuModel = host.cpuModel?.trim() || nodeCpuModel;
  const cpuVendor = inferCpuVendor(cpuModel);
  const cpuState: SiliconTruthState = cpuModel && cpuModel !== 'unknown' ? 'DETECTED' : 'WAITING';

  const gpuName = host.gpuNames[0] ?? null;
  const gpuVendor = inferGpuVendor(gpuName);
  let gpuState: SiliconTruthState = gpuName ? 'DETECTED' : 'WAITING';
  gpuState = clampSiliconState(process.env.XIV_GPU_STATE, gpuState);
  if ((process.env.XIV_GPU_STATE || '').toUpperCase() === 'VERIFIED') {
    gpuState = 'DETECTED';
  }

  const npuName = host.npuNames[0] ?? null;
  let npuState: SiliconTruthState = npuName ? 'DETECTED' : 'WAITING';
  npuState = clampSiliconState(process.env.XIV_NPU_STATE, npuState);
  if ((process.env.XIV_NPU_STATE || '').toUpperCase() === 'VERIFIED') {
    npuState = 'DETECTED';
  }

  const baseUrl = ollamaBaseUrl();
  const ollamaCheck = options.ollamaCheck ?? isOllamaReachable;
  const ollama = await ollamaCheck(baseUrl);
  const ollamaState: SiliconTruthState = ollama.reachable ? 'DETECTED' : 'UNAVAILABLE';

  const localPrefer = preferLocal();

  return {
    storyId: 'EY3',
    collectedAt: new Date().toISOString(),
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    l4Autonomy: false,
    cpu: {
      vendor: cpuVendor,
      model: cpuModel,
      cores: typeof os.availableParallelism === 'function' ? os.availableParallelism() : cpus.length,
      threads: cpus.length,
      state: cpuState,
      notes:
        cpuVendor === 'AMD'
          ? 'AMD CPU DETECTED via host/OS probe (capability presence only; not a workload VERIFIED claim).'
          : cpuState === 'DETECTED'
            ? 'CPU model DETECTED via host/OS probe.'
            : 'CPU model WAITING — host probe did not return a usable model string.',
    },
    memory: {
      totalBytes: os.totalmem(),
      freeBytes: os.freemem(),
    },
    gpu: {
      vendor: gpuVendor,
      name: gpuName,
      state: gpuState,
      notes: gpuName
        ? `GPU DETECTED via ${host.source}; never VERIFIED here (no DirectML/Vulkan/CUDA workload proof in EY3).`
        : `GPU WAITING — set XIV_GPU_NAME / run on Windows CIM, or leave honest WAITING. source=${host.source}`,
    },
    npu: {
      name: npuName,
      state: npuState,
      notes: npuName
        ? `NPU device DETECTED via ${host.source}; never VERIFIED (no NPU inference proof in EY3).`
        : `NPU WAITING — no ComputeAccelerator/NPU name from host probe (source=${host.source}).`,
    },
    ollama: {
      reachable: ollama.reachable,
      baseUrl,
      models: ollama.models,
      state: ollamaState,
      notes: ollama.notes,
    },
    offlineHints: {
      preferLocal: localPrefer,
      waitingProvider: localPrefer && !ollama.reachable && !process.env.GEMINI_API_KEY?.trim(),
    },
  };
}

export function hardwareProbeAllowsL4(): boolean {
  return HARDWARE_PROBE_POLICY.l4Autonomy;
}

export function assertNoFakeVerifiedSilicon(report: HardwareProbeReport): void {
  const banned = new Set(['VERIFIED', 'SUPPORTED']);
  if (banned.has(String(report.gpu.state).toUpperCase()) || banned.has(String(report.npu.state).toUpperCase())) {
    throw new Error('EY3 forbids VERIFIED/SUPPORTED GPU/NPU claims without workload proof');
  }
}
