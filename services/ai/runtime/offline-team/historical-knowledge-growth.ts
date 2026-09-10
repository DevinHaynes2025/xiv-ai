export interface HistoricalKnowledgeReceipt {
  receiptId: string;
  tenantId: string;
  sourceType: 'PUBLIC_SOURCE' | 'AUTHORIZED_DOCUMENT' | 'CASE_STUDY' | 'MEETING' | 'SIMULATION';
  sourceRef: string;
  observedAt: string;
  bytes: number;
  nodeCount: number;
  edgeCount: number;
  evidenceRefs: string[];
  confidence: number;
}

export interface HistoricalGrowthSnapshot {
  receipts: number;
  bytes: number;
  nodes: number;
  edges: number;
  targetScale: 'LOCAL_MVP' | 'MILLION' | 'BILLION' | 'TRILLION_TARGET';
}

export class HistoricalKnowledgeGrowthLedger {
  private receipts: HistoricalKnowledgeReceipt[] = [];

  append(receipt: HistoricalKnowledgeReceipt) {
    if (!receipt.evidenceRefs.length) throw new Error('historical growth requires evidence');
    if (receipt.confidence < 0 || receipt.confidence > 1) throw new Error('confidence must be between 0 and 1');
    this.receipts.push(receipt);
  }

  snapshot(targetScale: HistoricalGrowthSnapshot['targetScale'] = 'LOCAL_MVP'): HistoricalGrowthSnapshot {
    return this.receipts.reduce((s, r) => ({
      receipts: s.receipts + 1,
      bytes: s.bytes + r.bytes,
      nodes: s.nodes + r.nodeCount,
      edges: s.edges + r.edgeCount,
      targetScale,
    }), { receipts: 0, bytes: 0, nodes: 0, edges: 0, targetScale });
  }
}

export const HISTORICAL_GROWTH_GUARDRAILS = {
  measuredCountsSeparateFromTargets: true,
  provenanceRequired: true,
  memoryIsNotTruth: true,
  correlationIsNotCausation: true,
  sourceBackedHistoricalClaimsOnly: true,
};
