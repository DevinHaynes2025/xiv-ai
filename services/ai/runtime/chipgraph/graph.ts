/**
 * EW6 Capability Graph — nodes, edges, tenant/universe isolation.
 * Shared across vendors; neural pathway weights may change routing preference
 * only — never permissions / Guardian / RLS / prod authority.
 */

import {
  EW6_LOCKS,
  scopesMatch,
  type AcceleratorClass,
  type BottleneckClass,
  type ChipVendor,
  type EvidenceState,
  type GraphNodeKind,
  type TenantScope,
} from './types.ts';
import {
  buildDefaultDeviceSeeds,
  buildDefaultRuntimeSeeds,
  listSharedArchitectures,
  scopedKey,
} from './registry.ts';

export type GraphProvenance = {
  version: string;
  source: string;
  sourceDate: string;
};

export type CapabilityNode = {
  id: string;
  kind: GraphNodeKind;
  version: string;
  source: string;
  sourceDate: string;
  tenantId: string;
  universeId: string;
  orgId: string;
  evidenceState: EvidenceState;
  confidence: number;
  freshness: number;
  benchmarkRefs: readonly string[];
  knownLimitations: readonly string[];
  lastVerifiedAt: string | null;
  label: string;
  vendor?: ChipVendor;
  acceleratorClass?: AcceleratorClass;
  architectureId?: string;
  onnxCompatible?: boolean;
  localOnlyCapable?: boolean;
  memoryMb?: number;
  privacy?: string;
  /** Neural pathway weight — routing preference only. */
  pathwayWeight: number;
  retestPriority: number;
};

export type CapabilityEdge = {
  id: string;
  version: string;
  source: string;
  sourceDate: string;
  tenantId: string;
  universeId: string;
  orgId: string;
  evidenceState: EvidenceState;
  confidence: number;
  freshness: number;
  benchmarkRefs: readonly string[];
  knownLimitations: readonly string[];
  lastVerifiedAt: string | null;
  fromId: string;
  toId: string;
  kind:
    | 'HAS_ARCHITECTURE'
    | 'HOSTS_DEVICE'
    | 'RUNS_ON'
    | 'COMPILES_FOR'
    | 'BENCHMARKS'
    | 'BOTTLENECK'
    | 'FALLBACK'
    | 'EVIDENCE'
    | 'LESSON'
    | 'ROUTES';
  bottleneckClasses?: readonly BottleneckClass[];
  pathwayWeight: number;
};

export type AccessDenied = {
  ok: false;
  denied: true;
  reason:
    | 'CROSS_TENANT_DENIED'
    | 'CROSS_UNIVERSE_DENIED'
    | 'SCOPE_MISMATCH'
    | 'NODE_NOT_FOUND'
    | 'LOCK_VIOLATION';
};

export type AccessOk<T> = { ok: true; value: T };

export type AccessResult<T> = AccessOk<T> | AccessDenied;

function nowIso(): string {
  return new Date().toISOString();
}

function defaultProvenance(source = 'ew6-chipgraph'): GraphProvenance {
  return {
    version: '2.0.0',
    source,
    sourceDate: nowIso(),
  };
}

export class CapabilityGraph {
  private readonly nodes = new Map<string, CapabilityNode>();
  private readonly edges = new Map<string, CapabilityEdge>();

  seedSharedSkeleton(scope: TenantScope): {
    nodeCount: number;
    edgeCount: number;
    vendors: readonly ChipVendor[];
  } {
    const prov = defaultProvenance('ew6-shared-skeleton');
    const archs = listSharedArchitectures();

    for (const vendor of new Set(archs.map((a) => a.vendor))) {
      this.putNode({
        id: scopedKey(scope, `vendor:${vendor}`),
        kind: 'VendorNode',
        ...prov,
        orgId: scope.orgId,
        tenantId: scope.tenantId,
        universeId: scope.universeId,
        evidenceState: 'DOCUMENTED',
        confidence: 0.4,
        freshness: 1,
        benchmarkRefs: [],
        knownLimitations: ['Vendor catalog entry — not device VERIFIED.'],
        lastVerifiedAt: null,
        label: vendor,
        vendor,
        pathwayWeight: 1,
        retestPriority: 0,
      });
    }

    for (const arch of archs) {
      const vendorNodeId = scopedKey(scope, `vendor:${arch.vendor}`);
      const archNodeId = scopedKey(scope, `arch:${arch.architectureId}`);
      this.putNode({
        id: archNodeId,
        kind: 'ArchitectureNode',
        ...prov,
        orgId: scope.orgId,
        tenantId: scope.tenantId,
        universeId: scope.universeId,
        evidenceState: 'DOCUMENTED',
        confidence: 0.4,
        freshness: 1,
        benchmarkRefs: [],
        knownLimitations: ['Documented architecture candidate.'],
        lastVerifiedAt: null,
        label: arch.label,
        vendor: arch.vendor,
        architectureId: arch.architectureId,
        pathwayWeight: 1,
        retestPriority: 0,
      });
      this.putEdge({
        id: scopedKey(scope, `edge:vendor-arch:${arch.architectureId}`),
        ...prov,
        orgId: scope.orgId,
        tenantId: scope.tenantId,
        universeId: scope.universeId,
        evidenceState: 'DOCUMENTED',
        confidence: 0.4,
        freshness: 1,
        benchmarkRefs: [],
        knownLimitations: [],
        lastVerifiedAt: null,
        fromId: vendorNodeId,
        toId: archNodeId,
        kind: 'HAS_ARCHITECTURE',
        pathwayWeight: 1,
      });
    }

    for (const device of buildDefaultDeviceSeeds()) {
      const deviceNodeId = scopedKey(scope, `device:${device.deviceId}`);
      const archNodeId = scopedKey(scope, `arch:${device.architectureId}`);
      this.putNode({
        id: deviceNodeId,
        kind: 'DeviceNode',
        ...prov,
        orgId: scope.orgId,
        tenantId: scope.tenantId,
        universeId: scope.universeId,
        evidenceState: device.initialState,
        confidence: device.initialState === 'VERIFIED' ? 0.9 : 0.3,
        freshness: 1,
        benchmarkRefs: [],
        knownLimitations: [...device.knownLimitations],
        lastVerifiedAt: null,
        label: device.label,
        vendor: device.vendor,
        acceleratorClass: device.acceleratorClass,
        architectureId: device.architectureId,
        onnxCompatible: device.onnxCompatible,
        localOnlyCapable: device.localOnlyCapable,
        memoryMb: device.memoryMb,
        pathwayWeight: 1,
        retestPriority: device.initialState === 'NOT_TESTED' ? 5 : 1,
      });
      this.putEdge({
        id: scopedKey(scope, `edge:arch-device:${device.deviceId}`),
        ...prov,
        orgId: scope.orgId,
        tenantId: scope.tenantId,
        universeId: scope.universeId,
        evidenceState: device.initialState,
        confidence: 0.3,
        freshness: 1,
        benchmarkRefs: [],
        knownLimitations: [],
        lastVerifiedAt: null,
        fromId: archNodeId,
        toId: deviceNodeId,
        kind: 'HOSTS_DEVICE',
        pathwayWeight: 1,
      });
    }

    for (const runtime of buildDefaultRuntimeSeeds()) {
      const runtimeNodeId = scopedKey(scope, `runtime:${runtime.runtimeId}`);
      this.putNode({
        id: runtimeNodeId,
        kind: 'RuntimeNode',
        ...prov,
        orgId: scope.orgId,
        tenantId: scope.tenantId,
        universeId: scope.universeId,
        evidenceState: runtime.initialState,
        confidence: 0.3,
        freshness: 1,
        benchmarkRefs: [],
        knownLimitations: ['Runtime candidate — evidence-gated.'],
        lastVerifiedAt: null,
        label: runtime.label,
        onnxCompatible: runtime.onnxCompatible,
        pathwayWeight: 1,
        retestPriority: 1,
      });
    }

    // Shared compiler / precision placeholders (XIV-owned policy hooks).
    this.putNode({
      id: scopedKey(scope, 'compiler:xiv-quant-policy'),
      kind: 'CompilerNode',
      ...prov,
      orgId: scope.orgId,
      tenantId: scope.tenantId,
      universeId: scope.universeId,
      evidenceState: 'DOCUMENTED',
      confidence: 0.5,
      freshness: 1,
      benchmarkRefs: [],
      knownLimitations: ['XIV quantization policy stub — not vendor compiler IP.'],
      lastVerifiedAt: null,
      label: 'XIV quantization / compiler policy',
      pathwayWeight: 1,
      retestPriority: 0,
    });
    this.putNode({
      id: scopedKey(scope, 'precision:fp16-int8'),
      kind: 'PrecisionNode',
      ...prov,
      orgId: scope.orgId,
      tenantId: scope.tenantId,
      universeId: scope.universeId,
      evidenceState: 'DOCUMENTED',
      confidence: 0.5,
      freshness: 1,
      benchmarkRefs: [],
      knownLimitations: [],
      lastVerifiedAt: null,
      label: 'fp16 / int8 precision lane',
      pathwayWeight: 1,
      retestPriority: 0,
    });

    return {
      nodeCount: this.nodes.size,
      edgeCount: this.edges.size,
      vendors: [...new Set(archs.map((a) => a.vendor))],
    };
  }

  putNode(node: CapabilityNode): CapabilityNode {
    this.nodes.set(node.id, node);
    return node;
  }

  putEdge(edge: CapabilityEdge): CapabilityEdge {
    this.edges.set(edge.id, edge);
    return edge;
  }

  private assertScopeAccess(
    nodeScope: TenantScope,
    query: TenantScope,
  ): AccessDenied | null {
    if (EW6_LOCKS.CROSS_TENANT_GRAPH_ACCESS) {
      return { ok: false, denied: true, reason: 'LOCK_VIOLATION' };
    }
    if (nodeScope.tenantId !== query.tenantId) {
      return { ok: false, denied: true, reason: 'CROSS_TENANT_DENIED' };
    }
    if (EW6_LOCKS.CROSS_UNIVERSE_GRAPH_ACCESS) {
      return { ok: false, denied: true, reason: 'LOCK_VIOLATION' };
    }
    if (nodeScope.universeId !== query.universeId) {
      return { ok: false, denied: true, reason: 'CROSS_UNIVERSE_DENIED' };
    }
    if (!scopesMatch(nodeScope, query)) {
      return { ok: false, denied: true, reason: 'SCOPE_MISMATCH' };
    }
    return null;
  }

  getNode(id: string, scope: TenantScope): AccessResult<CapabilityNode> {
    const node = this.nodes.get(id);
    if (!node) {
      return { ok: false, denied: true, reason: 'NODE_NOT_FOUND' };
    }
    const denied = this.assertScopeAccess(
      {
        orgId: node.orgId,
        tenantId: node.tenantId,
        universeId: node.universeId,
      },
      scope,
    );
    if (denied) return denied;
    return { ok: true, value: node };
  }

  listNodes(
    scope: TenantScope,
    kind?: GraphNodeKind,
  ): AccessResult<readonly CapabilityNode[]> {
    const out: CapabilityNode[] = [];
    for (const node of this.nodes.values()) {
      const denied = this.assertScopeAccess(
        {
          orgId: node.orgId,
          tenantId: node.tenantId,
          universeId: node.universeId,
        },
        scope,
      );
      if (denied) {
        // Skip foreign-tenant nodes silently for list; explicit get returns DENIED.
        continue;
      }
      if (kind && node.kind !== kind) continue;
      out.push(node);
    }
    // If caller probes a foreign tenant that owns zero nodes, still deny when
    // any foreign nodes exist for a different tenant (explicit isolation probe).
    if (out.length === 0) {
      for (const node of this.nodes.values()) {
        if (node.tenantId !== scope.tenantId) {
          return { ok: false, denied: true, reason: 'CROSS_TENANT_DENIED' };
        }
        if (node.universeId !== scope.universeId) {
          return { ok: false, denied: true, reason: 'CROSS_UNIVERSE_DENIED' };
        }
      }
    }
    return { ok: true, value: out };
  }

  /**
   * Explicit cross-scope read of a known foreign node id — always denied when
   * tenant or universe differs.
   */
  readNodeAcrossScope(
    id: string,
    ownerScope: TenantScope,
    queryScope: TenantScope,
  ): AccessResult<CapabilityNode> {
    const node = this.nodes.get(id);
    if (!node) {
      return { ok: false, denied: true, reason: 'NODE_NOT_FOUND' };
    }
    if (
      node.tenantId !== ownerScope.tenantId ||
      node.universeId !== ownerScope.universeId
    ) {
      return { ok: false, denied: true, reason: 'SCOPE_MISMATCH' };
    }
    return this.getNode(id, queryScope);
  }

  updateNodeEvidence(
    id: string,
    scope: TenantScope,
    patch: Partial<
      Pick<
        CapabilityNode,
        | 'evidenceState'
        | 'confidence'
        | 'freshness'
        | 'benchmarkRefs'
        | 'knownLimitations'
        | 'lastVerifiedAt'
        | 'pathwayWeight'
        | 'retestPriority'
      >
    >,
  ): AccessResult<CapabilityNode> {
    const result = this.getNode(id, scope);
    if (!result.ok) return result;
    const updated: CapabilityNode = { ...result.value, ...patch };
    this.nodes.set(id, updated);
    return { ok: true, value: updated };
  }

  listEdges(scope: TenantScope): AccessResult<readonly CapabilityEdge[]> {
    const out: CapabilityEdge[] = [];
    for (const edge of this.edges.values()) {
      if (edge.tenantId !== scope.tenantId) continue;
      if (edge.universeId !== scope.universeId) continue;
      out.push(edge);
    }
    return { ok: true, value: out };
  }
}

export function createCapabilityGraph(): CapabilityGraph {
  return new CapabilityGraph();
}

export function deviceNodeId(scope: TenantScope, deviceId: string): string {
  return scopedKey(scope, `device:${deviceId}`);
}

export function runtimeNodeId(scope: TenantScope, runtimeId: string): string {
  return scopedKey(scope, `runtime:${runtimeId}`);
}

export function workloadNodeId(scope: TenantScope, workloadId: string): string {
  return scopedKey(scope, `workload:${workloadId}`);
}
