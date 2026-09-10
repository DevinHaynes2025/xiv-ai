export type SiliconTruthState = 'DETECTED' | 'WAITING' | 'UNAVAILABLE' | 'UNKNOWN';

export type HardwareProbeReport = {
  storyId: 'EY3';
  collectedAt: string;
  hostname: string;
  platform: string;
  arch: string;
  l4Autonomy: false;
  cpu: {
    vendor: string;
    model: string;
    cores: number;
    threads: number;
    state: SiliconTruthState;
    notes: string;
  };
  memory: { totalBytes: number; freeBytes: number };
  gpu: {
    vendor: string;
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
  offlineHints: { preferLocal: boolean; waitingProvider: boolean };
};

const HARDWARE_TIMEOUT_MS = 8_000;

function apiBaseUrl() {
  return process.env.EXPO_PUBLIC_XIV_AI_URL?.replace(/\/$/, '') ?? '';
}

function withAbortTimer(ms: number) {
  const controller = new AbortController();
  let settled = false;
  const timer = setTimeout(() => {
    if (!settled) controller.abort();
  }, ms);
  const settle = () => {
    settled = true;
    clearTimeout(timer);
  };
  return { controller, settle };
}

export async function fetchHardwareProbe(): Promise<
  | { ok: true; report: HardwareProbeReport }
  | { ok: false; reason: 'unconfigured' | 'unreachable' | 'malformed' }
> {
  const base = apiBaseUrl();
  if (!base) return { ok: false, reason: 'unconfigured' };

  try {
    const { controller, settle } = withAbortTimer(HARDWARE_TIMEOUT_MS);
    try {
      const response = await fetch(`${base}/v1/hardware`, {
        method: 'GET',
        signal: controller.signal,
      });
      if (!response.ok) return { ok: false, reason: 'unreachable' };
      const report = (await response.json()) as HardwareProbeReport;
      if (
        report?.storyId !== 'EY3' ||
        report.l4Autonomy !== false ||
        !report.cpu?.state ||
        !report.gpu?.state ||
        !report.npu?.state ||
        !report.ollama
      ) {
        return { ok: false, reason: 'malformed' };
      }
      if (String(report.gpu.state).toUpperCase() === 'VERIFIED') {
        report.gpu.state = 'DETECTED';
      }
      if (String(report.npu.state).toUpperCase() === 'VERIFIED') {
        report.npu.state = 'DETECTED';
      }
      return { ok: true, report };
    } finally {
      settle();
    }
  } catch {
    return { ok: false, reason: 'unreachable' };
  }
}
