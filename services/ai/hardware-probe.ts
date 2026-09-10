import { isOllamaReachable } from './model-backend';
import os from 'node:os';

export type HardwareProbeReport = {
  collectedAt: string;
  hostname: string;
  platform: NodeJS.Platform;
  arch: string;
  cpu: {
    model: string;
    cores: number;
    threads: number;
  };
  memory: {
    totalBytes: number;
    freeBytes: number;
  };
  gpu: {
    vendor: 'AMD' | 'NVIDIA' | 'APPLE' | 'OTHER' | 'UNKNOWN';
    name: string | null;
    notes: string;
  };
  npu: {
    detected: boolean;
    name: string | null;
    notes: string;
  };
  ollama: {
    reachable: boolean;
    baseUrl: string;
    models: string[];
  };
  offlineHints: {
    preferLocal: boolean;
    waitingProvider: boolean;
  };
};

function detectGpuFromEnvAndUname(): HardwareProbeReport['gpu'] {
  // Node cannot reliably enumerate Windows GPUs without OS calls.
  // Prefer honest UNKNOWN unless XIV_GPU_NAME / XIV_GPU_VENDOR set by host probe.
  const name = process.env.XIV_GPU_NAME?.trim() || null;
  const vendorRaw = process.env.XIV_GPU_VENDOR?.trim().toUpperCase();
  const vendor =
    vendorRaw === 'AMD' || vendorRaw === 'NVIDIA' || vendorRaw === 'APPLE' || vendorRaw === 'OTHER'
      ? vendorRaw
      : name?.toLowerCase().includes('radeon') || name?.toLowerCase().includes('amd')
        ? 'AMD'
        : name?.toLowerCase().includes('nvidia')
          ? 'NVIDIA'
          : 'UNKNOWN';
  return {
    vendor,
    name,
    notes:
      name
        ? 'Reported via XIV_GPU_* env from host probe.'
        : 'GPU not auto-detected in Node; set XIV_GPU_NAME=AMD Radeon 780M Graphics and XIV_GPU_VENDOR=AMD on the ASUS service.',
  };
}

export async function collectHardwareProbe(): Promise<HardwareProbeReport> {
  const cpus = os.cpus();
  const baseUrl = (process.env.OLLAMA_BASE_URL?.trim() || 'http://127.0.0.1:11434').replace(/\/$/, '');
  const reachable = await isOllamaReachable(baseUrl);
  let models: string[] = [];
  if (reachable) {
    try {
      const res = await fetch(`${baseUrl}/api/tags`, { signal: AbortSignal.timeout(2_000) });
      if (res.ok) {
        const body = (await res.json()) as { models?: { name?: string }[] };
        models = (body.models ?? []).map((m) => m.name ?? '').filter(Boolean);
      }
    } catch {
      models = [];
    }
  }

  const preferLocal =
    ['1', 'true', 'yes'].includes((process.env.OFFLINE_PREFER_LOCAL || '').trim().toLowerCase());

  return {
    collectedAt: new Date().toISOString(),
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    cpu: {
      model: cpus[0]?.model?.trim() || 'unknown',
      cores: os.availableParallelism?.() ?? cpus.length,
      threads: cpus.length,
    },
    memory: {
      totalBytes: os.totalmem(),
      freeBytes: os.freemem(),
    },
    gpu: detectGpuFromEnvAndUname(),
    npu: {
      detected: false,
      name: null,
      notes: 'NPU not probed yet on this host; report unknown rather than inventing presence.',
    },
    ollama: {
      reachable,
      baseUrl,
      models,
    },
    offlineHints: {
      preferLocal,
      waitingProvider: preferLocal && !reachable && !process.env.GEMINI_API_KEY?.trim(),
    },
  };
}
