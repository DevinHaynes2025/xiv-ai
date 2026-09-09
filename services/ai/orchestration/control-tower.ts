/**
 * Offline status control tower — truth view for Home Base / agents /
 * models / CPU-GPU-NPU / packs / queue / checkpoints / sync / storage /
 * network / cloud.
 */

import type { ComputeAdapterRegistry } from './compute-adapters.ts';
import type { CheckpointStore } from './checkpoint.ts';
import type { HeartbeatService } from './heartbeat.ts';
import type { OfflinePackService } from './offline-packs.ts';
import type { StorageResilience } from './storage-resilience.ts';
import type { LocalWorker } from './local-worker.ts';
import type { TaskGraph } from './task-graph.ts';
import {
  type ControlTowerState,
  type TenantScope,
} from './types.ts';

export type ControlTowerSlice = {
  name: string;
  state: ControlTowerState;
  detail: string;
};

export type ControlTowerSnapshot = {
  capturedAt: string;
  scope: TenantScope;
  slices: readonly ControlTowerSlice[];
  offlineInferenceClaimed: false;
  localWorktreeAccess: boolean;
  honestyNote: string;
};

export type ControlTowerInput = {
  scope: TenantScope;
  homeBaseReachable: boolean;
  networkOnline: boolean;
  cloudReachable: boolean;
  localWorktreeAccess: boolean;
  localModelProcessAlive: boolean;
  localModelHeartbeatFresh: boolean;
  compute: ComputeAdapterRegistry;
  heartbeats: HeartbeatService;
  checkpoints: CheckpointStore;
  packs: OfflinePackService;
  storage: StorageResilience;
  worker: LocalWorker;
  tasks: TaskGraph;
};

export function buildControlTowerSnapshot(
  input: ControlTowerInput,
): ControlTowerSnapshot {
  const cpu = input.compute.get('CPU');
  const gpu = input.compute.get('AMD_GPU');
  const npu = input.compute.get('AMD_NPU');
  const beats = input.heartbeats.list(input.scope);
  const staleAgents = beats.filter((b) =>
    input.heartbeats.isStale(b.agentId, input.scope),
  );
  const ckpts = input.checkpoints.list(input.scope);
  const packList = input.packs.list(input.scope);
  const objects = input.storage.list(input.scope);
  const taskList = input.tasks.list(input.scope);

  const modelState: ControlTowerState =
    input.localModelProcessAlive && input.localModelHeartbeatFresh
      ? 'RUNNING_VERIFIED'
      : input.localWorktreeAccess
        ? 'NOT_TESTED'
        : 'UNAVAILABLE';

  const networkState: ControlTowerState = input.networkOnline
    ? 'RUNNING_VERIFIED'
    : 'LOCAL_ONLY';

  const homeBaseState: ControlTowerState = input.homeBaseReachable
    ? 'RUNNING_VERIFIED'
    : input.localWorktreeAccess
      ? 'LOCAL_ONLY'
      : 'WAITING_NODE';

  const agentState: ControlTowerState =
    beats.some((b) => b.state === 'OFFLINE_STOPPED')
      ? 'OFFLINE_STOPPED'
      : staleAgents.length > 0
        ? 'DEGRADED'
        : beats.length > 0
          ? 'LOCAL_ONLY'
          : 'WAITING_NODE';

  const slices: ControlTowerSlice[] = [
    {
      name: 'HOME_BASE',
      state: homeBaseState,
      detail: input.homeBaseReachable
        ? 'Home Base reachable.'
        : 'Home Base not reachable — local-only mode.',
    },
    {
      name: 'LOCAL_AGENTS',
      state: agentState,
      detail: `${beats.length} heartbeat(s); ${staleAgents.length} stale.`,
    },
    {
      name: 'LOCAL_MODELS',
      state: modelState,
      detail:
        modelState === 'RUNNING_VERIFIED'
          ? 'Local process + fresh heartbeat present.'
          : 'Local worktree access ≠ offline model inference. No verified local model runtime/heartbeat in this environment.',
    },
    {
      name: 'CPU',
      state: cpu.state === 'SUPPORTED' ? 'LOCAL_ONLY' : mapCompute(cpu.state),
      detail: cpu.note,
    },
    {
      name: 'GPU',
      state: 'NOT_TESTED',
      detail: gpu.note,
    },
    {
      name: 'NPU',
      state: 'NOT_TESTED',
      detail: npu.note,
    },
    {
      name: 'OFFLINE_PACKS',
      state: packList.length > 0 ? 'LOCAL_ONLY' : 'WAITING_DATA',
      detail: `${packList.length} pack manifest(s) in scope.`,
    },
    {
      name: 'TASK_QUEUE',
      state: taskList.length > 0 ? 'LOCAL_ONLY' : 'WAITING_DATA',
      detail: `${taskList.length} task(s) in graph.`,
    },
    {
      name: 'CHECKPOINTS',
      state: ckpts.some((c) => c.runtimeState === 'OFFLINE_STOPPED')
        ? 'OFFLINE_STOPPED'
        : ckpts.length > 0
          ? 'LOCAL_ONLY'
          : 'WAITING_DATA',
      detail: `${ckpts.length} checkpoint(s).`,
    },
    {
      name: 'SYNC',
      state: input.networkOnline ? 'WAITING_DATA' : 'LOCAL_ONLY',
      detail: input.networkOnline
        ? 'Network up — sync candidate path available (not auto-run).'
        : 'Offline — sync deferred.',
    },
    {
      name: 'STORAGE',
      state: objects.length > 0 ? 'LOCAL_ONLY' : 'WAITING_DATA',
      detail: `${objects.length} governed object(s).`,
    },
    {
      name: 'NETWORK',
      state: networkState,
      detail: `workerNetworkMode=${input.worker.getNetworkMode()}`,
    },
    {
      name: 'CLOUD',
      state: input.cloudReachable ? 'WAITING_DATA' : 'UNAVAILABLE',
      detail: input.cloudReachable
        ? 'Cloud reachable but not auto-purchased / not required for local spine.'
        : 'Cloud unavailable.',
    },
  ];

  return {
    capturedAt: new Date().toISOString(),
    scope: input.scope,
    slices,
    offlineInferenceClaimed: false,
    localWorktreeAccess: input.localWorktreeAccess,
    honestyNote:
      'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED. Local worktree ≠ offline inference.',
  };
}

function mapCompute(state: string): ControlTowerState {
  if (state === 'VERIFIED') return 'RUNNING_VERIFIED';
  if (state === 'SUPPORTED' || state === 'DETECTED') return 'LOCAL_ONLY';
  if (state === 'OFFLINE_STOPPED') return 'OFFLINE_STOPPED';
  if (state === 'WAITING_NODE') return 'WAITING_NODE';
  if (state === 'DEGRADED') return 'DEGRADED';
  if (state === 'UNAVAILABLE') return 'UNAVAILABLE';
  return 'NOT_TESTED';
}
