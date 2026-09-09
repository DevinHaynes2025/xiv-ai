/**
 * Content Intelligence Engine + Visual Intelligence contracts.
 * Structured intelligence, not giant file dump.
 */

import {
  CONTENT_INTELLIGENCE_STAGES,
  VISUAL_GRAPH_KINDS,
  type ContentIntelligenceStage,
  type VisualGraphKind,
} from './types';

export type ContentPipelineRun = {
  runId: string;
  stage: ContentIntelligenceStage;
  mediaAssetId: string;
  rightsVerified: boolean;
  giantFileDump: false;
  structuredIntelligence: true;
};

export type VisualGraphNodeContract = {
  nodeId: string;
  graphKind: VisualGraphKind;
  label: string;
  relationships: readonly string[];
  evidenceRefs: readonly string[];
  confidence: number;
  freshness: 'FRESH' | 'CURRENT' | 'STALE' | 'UNKNOWN';
  sourceRef: string;
  permissions: readonly string[];
  history: readonly string[];
};

export function listContentIntelligenceStages(): readonly ContentIntelligenceStage[] {
  return CONTENT_INTELLIGENCE_STAGES;
}

export function listVisualGraphKinds(): readonly VisualGraphKind[] {
  return VISUAL_GRAPH_KINDS;
}

export function openContentIntelligenceEngine(): {
  stages: readonly ContentIntelligenceStage[];
  giantFileDump: false;
  structuredIntelligence: true;
  requiresRights: true;
  productionLive: false;
} {
  return {
    stages: CONTENT_INTELLIGENCE_STAGES,
    giantFileDump: false,
    structuredIntelligence: true,
    requiresRights: true,
    productionLive: false,
  };
}

export function startContentPipeline(input: {
  runId: string;
  mediaAssetId: string;
  rightsVerified: boolean;
}): ContentPipelineRun | { allowed: false; reason: string } {
  if (!input.rightsVerified) {
    return { allowed: false, reason: 'content_rights_required' };
  }
  return {
    runId: input.runId,
    stage: 'SOURCE_ASSET',
    mediaAssetId: input.mediaAssetId,
    rightsVerified: true,
    giantFileDump: false,
    structuredIntelligence: true,
  };
}

export function advanceContentStage(
  run: ContentPipelineRun,
): ContentPipelineRun | { allowed: false; reason: string } {
  const idx = CONTENT_INTELLIGENCE_STAGES.indexOf(run.stage);
  if (idx < 0 || idx >= CONTENT_INTELLIGENCE_STAGES.length - 1) {
    return { allowed: false, reason: 'content_pipeline_terminal' };
  }
  return { ...run, stage: CONTENT_INTELLIGENCE_STAGES[idx + 1]! };
}

export function openVisualIntelligenceContracts(): {
  kinds: readonly VisualGraphKind[];
  inspectableFields: readonly string[];
  productionLive: false;
} {
  return {
    kinds: VISUAL_GRAPH_KINDS,
    inspectableFields: [
      'node',
      'relationships',
      'evidence',
      'confidence',
      'freshness',
      'source',
      'permissions',
      'history',
    ],
    productionLive: false,
  };
}

export function createVisualGraphNode(input: {
  nodeId: string;
  graphKind: VisualGraphKind;
  label: string;
  sourceRef: string;
  confidence?: number;
  freshness?: VisualGraphNodeContract['freshness'];
}): VisualGraphNodeContract {
  return {
    nodeId: input.nodeId,
    graphKind: input.graphKind,
    label: input.label,
    relationships: [],
    evidenceRefs: [],
    confidence: input.confidence ?? 0,
    freshness: input.freshness ?? 'UNKNOWN',
    sourceRef: input.sourceRef,
    permissions: ['VIEW_AUTHORIZED'],
    history: [],
  };
}

export function visualNodeExposesRequiredFields(node: VisualGraphNodeContract): boolean {
  return (
    typeof node.nodeId === 'string' &&
    Array.isArray(node.relationships) &&
    Array.isArray(node.evidenceRefs) &&
    typeof node.confidence === 'number' &&
    typeof node.freshness === 'string' &&
    typeof node.sourceRef === 'string' &&
    Array.isArray(node.permissions) &&
    Array.isArray(node.history)
  );
}
