import { OfflineStoryQueue } from './offline-story-queue';
import { evaluatePathwayCandidate, type NeuralPathwayCandidate, type PathwayDomain } from './neural-pathway-growth-engine';

export interface PathwayEvidenceRequest {
  tenantId: string;
  storyId: string;
  expectedOutputHash: string;
  pathwayId: string;
  domain: PathwayDomain;
  version: number;
  confidence: number;
  evaluationScore: number;
  evidenceRefs: readonly string[];
  reviewRefs: readonly string[];
  rollbackRef?: string;
  parentPathwayId?: string;
}

export interface PathwayEvidencePacket {
  kind: 'QUEUE_OUTCOME_TO_PATHWAY_CANDIDATE';
  tenantId: string;
  storyId: string;
  outputHash: string;
  candidate: Readonly<NeuralPathwayCandidate>;
  currentEligibility: Readonly<{ eligible: boolean; reasons: readonly string[] }>;
  activationAttempted: false;
  learningPromoted: false;
  modelWeightMutation: false;
  productionMutation: false;
  humanDecision: 'REQUIRED';
}

const id = (v: unknown): v is string => typeof v === 'string' && /^[A-Za-z0-9_.:-]{1,128}$/.test(v);
const sha256 = (v: unknown): v is string => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v);
const finiteUnit = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1;
const refs = (v: readonly string[]): boolean => Array.isArray(v) && v.length > 0 && v.length <= 32 && v.every(r => typeof r === 'string' && r.trim().length > 0 && r.length <= 256);

/**
 * Converts an already-reviewed DONE queue result into a CANDIDATE input for the existing
 * neural-pathway engine. This function never activates a pathway and never grants human
 * approval. It binds the candidate to the queue's stored output hash so stale/replaced
 * results cannot silently become learning evidence.
 */
export function preparePathwayCandidateFromQueue(
  queue: OfflineStoryQueue,
  request: PathwayEvidenceRequest,
): PathwayEvidencePacket {
  if (!(queue instanceof OfflineStoryQueue)) throw new Error('trusted queue instance required');
  if (!request || ![request.tenantId, request.storyId, request.pathwayId].every(id)) throw new Error('scoped identities required');
  if (!sha256(request.expectedOutputHash)) throw new Error('expected output hash required');
  if (!Number.isSafeInteger(request.version) || request.version < 1) throw new Error('version must be >= 1');
  if (!finiteUnit(request.confidence) || !finiteUnit(request.evaluationScore)) throw new Error('finite confidence/evaluation required');
  if (!refs(request.evidenceRefs) || !refs(request.reviewRefs)) throw new Error('bounded evidence and review refs required');
  if (new Set(request.reviewRefs.map(r => r.trim())).size !== request.reviewRefs.length) throw new Error('duplicate review refs forbidden');
  if (request.rollbackRef !== undefined && (typeof request.rollbackRef !== 'string' || !request.rollbackRef.trim() || request.rollbackRef.length > 256)) throw new Error('invalid rollback ref');
  if (request.parentPathwayId !== undefined && !id(request.parentPathwayId)) throw new Error('invalid parent pathway id');

  const story = queue.inspectStory(request.tenantId, request.storyId);
  if (!story) throw new Error('story evidence not found');
  if (story.state !== 'DONE') throw new Error('only independently reviewed DONE stories can become pathway evidence');
  if (!story.outputHash || story.outputHash !== request.expectedOutputHash) throw new Error('queue output hash mismatch');

  const evidenceRefs = Object.freeze([...new Set([
    ...request.evidenceRefs.map(r => r.trim()),
    `queue-story:${request.tenantId}:${request.storyId}`,
    `output-sha256:${story.outputHash}`,
  ])]);
  const candidate: NeuralPathwayCandidate = Object.freeze({
    pathwayId: request.pathwayId,
    tenantId: request.tenantId,
    domain: request.domain,
    version: request.version,
    parentPathwayId: request.parentPathwayId,
    confidence: request.confidence,
    evaluationScore: request.evaluationScore,
    evidenceRefs,
    reviewRefs: Object.freeze([...request.reviewRefs.map(r => r.trim())]),
    humanApproved: false,
    rollbackRef: request.rollbackRef,
    modelWeightMutation: false,
    productionMutation: false,
  });

  const currentEligibility = evaluatePathwayCandidate(candidate);
  return Object.freeze({
    kind: 'QUEUE_OUTCOME_TO_PATHWAY_CANDIDATE' as const,
    tenantId: request.tenantId,
    storyId: request.storyId,
    outputHash: story.outputHash,
    candidate,
    currentEligibility,
    activationAttempted: false as const,
    learningPromoted: false as const,
    modelWeightMutation: false as const,
    productionMutation: false as const,
    humanDecision: 'REQUIRED' as const,
  });
}
