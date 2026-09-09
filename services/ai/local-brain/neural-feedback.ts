import { NeuralFabric } from './neural-fabric';
import type { ConsequenceClass } from './decision-gate';

export type NeuralHighwayClassification = 'public' | 'internal' | 'confidential' | 'restricted';

export type SparseNeuralHighway = {
  id: string;
  tenantId: string;
  universeId: string;
  from: string;
  to: string;
  classification: NeuralHighwayClassification;
  provenanceRefs: string[];
  correlationId: string;
  consequence: ConsequenceClass;
  ttlMs: number;
  expiresAt: string;
  resourceBudget: { maxWeight: number };
  evidenceRefs: string[];
  logicalOnly: true;
  productionAuthorization: false;
};

const MAX_HIGHWAYS = 10_000;

export class NeuralFeedbackPathways {
  readonly fabric = new NeuralFabric();
  private highways: SparseNeuralHighway[] = [];

  registerEndpoint(input: {
    id: string;
    tenantId: string;
    universeId: string;
    label: string;
    kind?: 'agent' | 'knowledge' | 'evidence' | 'decision' | 'workflow';
    provenanceRefs: string[];
  }) {
    this.fabric.registerNode({
      id: input.id,
      kind: input.kind ?? 'workflow',
      label: input.label,
      tenantId: input.tenantId,
      universeId: input.universeId,
      trust: input.provenanceRefs.length ? 'SYNTHETIC' : 'UNKNOWN',
      provenanceRefs: [...input.provenanceRefs],
    });
  }

  connect(input: {
    tenantId: string;
    universeId: string;
    from: string;
    to: string;
    classification?: NeuralHighwayClassification;
    provenanceRefs: string[];
    correlationId: string;
    consequence?: ConsequenceClass;
    ttlMs?: number;
    evidenceRefs: string[];
    now?: number;
  }): SparseNeuralHighway {
    if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
    if (input.provenanceRefs.length === 0) throw new Error('NEURAL_HIGHWAY_PROVENANCE_REQUIRED');
    const now = input.now ?? Date.now();
    const ttlMs = Math.max(1_000, Math.min(input.ttlMs ?? 3_600_000, 86_400_000));
    this.fabric.connect({
      from: input.from,
      to: input.to,
      relation: 'neural_feedback',
      weight: 0.35,
      confidence: 0.5,
      evidenceRefs: [...input.evidenceRefs],
    });
    const highway: SparseNeuralHighway = {
      id: `nh:${input.tenantId}:${input.correlationId}:${this.highways.length}`,
      tenantId: input.tenantId,
      universeId: input.universeId,
      from: input.from,
      to: input.to,
      classification: input.classification ?? 'internal',
      provenanceRefs: [...input.provenanceRefs],
      correlationId: input.correlationId,
      consequence: input.consequence ?? 'LOW',
      ttlMs,
      expiresAt: new Date(now + ttlMs).toISOString(),
      resourceBudget: { maxWeight: 1 },
      evidenceRefs: [...input.evidenceRefs],
      logicalOnly: true,
      productionAuthorization: false,
    };
    this.highways.push(highway);
    if (this.highways.length > MAX_HIGHWAYS) this.highways = this.highways.slice(-MAX_HIGHWAYS);
    return highway;
  }

  live(now = Date.now()) {
    return this.highways.filter((item) => Date.parse(item.expiresAt) > now);
  }

  stats() {
    return {
      ...this.fabric.stats(),
      sparseHighways: this.highways.length,
      materializedProcessCount: this.highways.length,
      logicalOnly: true as const,
      productionAuthorization: false as const,
    };
  }
}
