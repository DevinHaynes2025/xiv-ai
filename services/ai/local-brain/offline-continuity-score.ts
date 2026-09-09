import { localModelStatus } from './local-model';
import { probeHardware } from './hardware-probe';
import { evaluateOfflineTask, type OfflineTaskRequirement } from './offline-policy';
import { listKnowledgePacks } from './knowledge-packs';
import { recallCortexTraces } from './memory-cortex';
import type { EvidenceState } from './evidence-promotion-gate';

export type ApprovedWorkloadItem = {
  id: string;
  summary: string;
  approved: true;
  needsLocalModel: boolean;
  needsLocalData: boolean;
  needsHardware: 'cpu' | 'nvidia_gpu' | 'none';
  requirement: OfflineTaskRequirement;
};

export type ContinuityItemResult = {
  id: string;
  localRunnable: boolean;
  reason: string;
  evidenceState: EvidenceState;
};

export type OfflineContinuityScore = {
  approved: number;
  localRunnable: number;
  percent: number;
  items: ContinuityItemResult[];
  localModel: Awaited<ReturnType<typeof localModelStatus>>;
  hardwareKindsAvailable: string[];
  plannedCapabilityCounted: false;
  productionAuthorization: false;
};

export async function measureOfflineContinuityScore(input: {
  tenantId: string;
  universeId: string;
  workload: ApprovedWorkloadItem[];
  root?: string;
}): Promise<OfflineContinuityScore> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const approved = input.workload.filter((item) => item.approved);
  const root = input.root ?? process.cwd();
  const model = await localModelStatus();
  const hardware = await probeHardware();
  const availableHardware = hardware.filter((item) => item.availability === 'AVAILABLE').map((item) => item.kind);
  const traces = await recallCortexTraces({ tenantId: input.tenantId, universeId: input.universeId, root });
  const packs = await listKnowledgePacks({ tenantId: input.tenantId, universeId: input.universeId, root });
  const hasLocalData = traces.length > 0 || packs.length > 0;

  const items: ContinuityItemResult[] = [];
  for (const item of approved) {
    const offline = evaluateOfflineTask(item.requirement);
    if (!offline.allowed) {
      items.push({
        id: item.id,
        localRunnable: false,
        reason: offline.reason,
        evidenceState: offline.state === 'WAITING_DATA' ? 'WAITING_DATA' : offline.state === 'DENIED' ? 'FAIL' : 'UNAVAILABLE',
      });
      continue;
    }
    if (item.needsLocalModel && model.availability !== 'AVAILABLE') {
      items.push({
        id: item.id,
        localRunnable: false,
        reason: `Local model is ${model.availability}: ${model.reason}. Planned Ollama capability is not counted.`,
        evidenceState: 'UNAVAILABLE',
      });
      continue;
    }
    if (item.needsLocalData && !hasLocalData) {
      items.push({
        id: item.id,
        localRunnable: false,
        reason: 'No tenant-scoped local Memory Cortex traces or knowledge packs are present.',
        evidenceState: 'UNKNOWN',
      });
      continue;
    }
    if (item.needsHardware !== 'none' && !availableHardware.includes(item.needsHardware)) {
      items.push({
        id: item.id,
        localRunnable: false,
        reason: `Required hardware ${item.needsHardware} is not AVAILABLE on this host.`,
        evidenceState: 'UNAVAILABLE',
      });
      continue;
    }
    items.push({
      id: item.id,
      localRunnable: true,
      reason: 'Approved workload can run with models/data/hardware actually present on this host.',
      evidenceState: 'PASS',
    });
  }

  const localRunnable = items.filter((item) => item.localRunnable).length;
  const percent = approved.length === 0 ? 0 : Math.round((localRunnable / approved.length) * 10_000) / 100;
  return {
    approved: approved.length,
    localRunnable,
    percent,
    items,
    localModel: model,
    hardwareKindsAvailable: availableHardware,
    plannedCapabilityCounted: false,
    productionAuthorization: false,
  };
}
