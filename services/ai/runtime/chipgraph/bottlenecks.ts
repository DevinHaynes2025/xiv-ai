/**
 * EW6 bottleneck links — multi-class allowed.
 */

import {
  BOTTLENECK_CLASSES,
  type BottleneckClass,
  type TenantScope,
} from './types.ts';
import type { CapabilityGraph } from './graph.ts';
import { scopedKey } from './registry.ts';

export type BottleneckLink = {
  linkId: string;
  pathId: string;
  deviceNodeId: string;
  classes: readonly BottleneckClass[];
  evidenceRefs: readonly string[];
  recommendation: string;
  scope: TenantScope;
  at: string;
};

export function isKnownBottleneckClass(
  value: string,
): value is BottleneckClass {
  return (BOTTLENECK_CLASSES as readonly string[]).includes(value);
}

export function linkBottlenecks(input: {
  graph: CapabilityGraph;
  linkId: string;
  pathId: string;
  deviceNodeId: string;
  classes: readonly BottleneckClass[];
  evidenceRefs?: readonly string[];
  scope: TenantScope;
  fallbackUsed?: boolean;
}): BottleneckLink | { ok: false; reason: string } {
  const unique = [...new Set(input.classes)];
  for (const cls of unique) {
    if (!isKnownBottleneckClass(cls)) {
      return { ok: false, reason: `UNKNOWN_BOTTLENECK_CLASS:${cls}` };
    }
  }

  const device = input.graph.getNode(input.deviceNodeId, input.scope);
  if (!device.ok) {
    return { ok: false, reason: device.reason };
  }

  let recommendation = `Bottlenecks: ${unique.join(', ')} — software-level candidates only; no silicon modify.`;
  if (unique.includes('CACHE_BOUND')) {
    recommendation +=
      ' CACHE_BOUND — prefer locality / session cache / model-session reuse (XIV proprietary strategy).';
  }
  if (unique.includes('DATA_TRANSFER_BOUND')) {
    recommendation +=
      ' DATA_TRANSFER_BOUND — do not blindly move workload to accelerator.';
  }
  if (input.fallbackUsed) {
    recommendation +=
      ' Fallback used — do not claim requested accelerator cleared the bottleneck.';
  }

  const bottleneckNodeId = scopedKey(
    input.scope,
    `bottleneck:${input.linkId}`,
  );
  input.graph.putNode({
    id: bottleneckNodeId,
    kind: 'BottleneckNode',
    version: '2.0.0',
    source: 'ew6-bottleneck',
    sourceDate: new Date().toISOString(),
    orgId: input.scope.orgId,
    tenantId: input.scope.tenantId,
    universeId: input.scope.universeId,
    evidenceState: device.value.evidenceState,
    confidence: 0.6,
    freshness: device.value.freshness,
    benchmarkRefs: [...(input.evidenceRefs ?? [])],
    knownLimitations: [],
    lastVerifiedAt: null,
    label: unique.join('+'),
    pathwayWeight: 1,
    retestPriority: 2,
  });

  input.graph.putEdge({
    id: scopedKey(input.scope, `edge:bottleneck:${input.linkId}`),
    version: '2.0.0',
    source: 'ew6-bottleneck',
    sourceDate: new Date().toISOString(),
    orgId: input.scope.orgId,
    tenantId: input.scope.tenantId,
    universeId: input.scope.universeId,
    evidenceState: device.value.evidenceState,
    confidence: 0.6,
    freshness: 1,
    benchmarkRefs: [...(input.evidenceRefs ?? [])],
    knownLimitations: [],
    lastVerifiedAt: null,
    fromId: input.deviceNodeId,
    toId: bottleneckNodeId,
    kind: 'BOTTLENECK',
    bottleneckClasses: unique,
    pathwayWeight: 1,
  });

  return {
    linkId: input.linkId,
    pathId: input.pathId,
    deviceNodeId: input.deviceNodeId,
    classes: unique,
    evidenceRefs: input.evidenceRefs ?? [],
    recommendation,
    scope: input.scope,
    at: new Date().toISOString(),
  };
}

export { BOTTLENECK_CLASSES };
