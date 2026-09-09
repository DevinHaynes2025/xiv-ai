/**
 * 62L-EX17 — pipeline partitioner recording actual route across devices.
 */

import type {
  ComputeClass,
  ComputePipelineStage,
  ComputeStageRequest,
  DeviceProfile,
  DeviceTruthState,
  PartitionHop,
  PartitionRecord,
} from './types.ts';

export function recordPartition(input: {
  request: ComputeStageRequest;
  hops: readonly {
    stage: ComputePipelineStage;
    device: ComputeClass;
    truthState: DeviceTruthState;
  }[];
}): PartitionRecord {
  return {
    partitionId: `part-${input.request.requestId}`,
    requestId: input.request.requestId,
    hops: input.hops.map(
      (h): PartitionHop => ({
        stage: h.stage,
        device: h.device,
        truthState: h.truthState,
      }),
    ),
    actualRoute: input.hops.map((h) => h.device),
  };
}

export function defaultClassicalPartition(
  request: ComputeStageRequest,
  executeDevice: ComputeClass,
  executeTruth: DeviceTruthState,
): PartitionRecord {
  return recordPartition({
    request,
    hops: [
      { stage: 'PREPROCESS', device: 'CPU', truthState: 'VERIFIED' },
      { stage: 'EXECUTE', device: executeDevice, truthState: executeTruth },
      { stage: 'POSTPROCESS', device: 'CPU', truthState: 'VERIFIED' },
    ],
  });
}

export function devicesForScope(
  devices: readonly DeviceProfile[],
  tenantId: string,
  universeId: string,
): DeviceProfile[] {
  return devices.filter(
    (d) => d.tenantId === tenantId && d.universeId === universeId,
  );
}
