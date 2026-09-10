import { createHash } from 'node:crypto';

export type PipelineClass = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET';

export interface AtomicPipelineCell {
  id: string;
  tenantId: string;
  contentHash: string;
  provenanceRefs: string[];
  classification: PipelineClass;
  bytes: number;
}

export interface BlueBrainScaleReceipt {
  measuredCells: number;
  measuredBytes: number;
  targetTier: 'LOCAL_MVP' | 'MILLION_SCALE' | 'BILLION_SCALE' | 'TRILLION_SCALE_TARGET';
  virtualChipModel: 'LOGICAL_ATOMIC_CELL';
  quantumExecution: 'CLASSICAL' | 'QUANTUM_SIMULATOR' | 'QPU_VERIFIED';
}

export function createAtomicPipelineCell(input: Omit<AtomicPipelineCell, 'id' | 'contentHash'> & { content: string }): AtomicPipelineCell {
  if (!input.tenantId.trim()) throw new Error('tenant required');
  if (!input.provenanceRefs.length) throw new Error('provenance required');
  const contentHash = createHash('sha256').update(input.content).digest('hex');
  const id = createHash('sha256').update(`${input.tenantId}:${contentHash}:${input.classification}`).digest('hex');
  return {
    id,
    tenantId: input.tenantId,
    contentHash,
    provenanceRefs: [...new Set(input.provenanceRefs)],
    classification: input.classification,
    bytes: Buffer.byteLength(input.content),
  };
}

export function buildScaleReceipt(cells: AtomicPipelineCell[], targetTier: BlueBrainScaleReceipt['targetTier']): BlueBrainScaleReceipt {
  return {
    measuredCells: cells.length,
    measuredBytes: cells.reduce((sum, c) => sum + c.bytes, 0),
    targetTier,
    virtualChipModel: 'LOGICAL_ATOMIC_CELL',
    quantumExecution: 'CLASSICAL',
  };
}

export const BLUE_BRAIN_PIPELINE_GUARDRAILS = {
  targetIsMeasuredCapacity: false,
  atomSizedPhysicalStorageClaim: false,
  qpuAdvantageClaimWithoutEvidence: false,
  crossTenantPoolingAllowed: false,
  provenanceRequired: true,
};
