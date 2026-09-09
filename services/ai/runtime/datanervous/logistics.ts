/**
 * Information Logistics Graph — Source→…→Lesson traversal.
 * Physical supply chain + information supply chain + AI decision chain + outcome feedback.
 */

import { INFORMATION_LOGISTICS_STAGES, type InformationLogisticsStage } from './types';

export type LogisticsNode = {
  nodeId: string;
  stage: InformationLogisticsStage;
  refId: string;
  tenantId: string;
  universeId: string;
  summary: string;
};

export type LogisticsEdge = {
  edgeId: string;
  fromNodeId: string;
  toNodeId: string;
  relation: 'FEEDS' | 'SUPPORTS' | 'CONTRADICTS' | 'DECIDES' | 'ACTS' | 'LEARNS';
};

export type InformationLogisticsGraph = {
  stages: readonly InformationLogisticsStage[];
  nodes: readonly LogisticsNode[];
  edges: readonly LogisticsEdge[];
  physicalSupplyChainLinked: true;
  informationSupplyChainLinked: true;
  aiDecisionChainLinked: true;
  outcomeFeedbackLinked: true;
};

export function listInformationLogisticsStages(): readonly InformationLogisticsStage[] {
  return INFORMATION_LOGISTICS_STAGES;
}

export function openInformationLogisticsGraph(): InformationLogisticsGraph {
  return {
    stages: INFORMATION_LOGISTICS_STAGES,
    nodes: [],
    edges: [],
    physicalSupplyChainLinked: true,
    informationSupplyChainLinked: true,
    aiDecisionChainLinked: true,
    outcomeFeedbackLinked: true,
  };
}

export function advanceLogisticsStage(
  current: InformationLogisticsStage,
): InformationLogisticsStage | null {
  const idx = INFORMATION_LOGISTICS_STAGES.indexOf(current);
  if (idx < 0 || idx >= INFORMATION_LOGISTICS_STAGES.length - 1) return null;
  return INFORMATION_LOGISTICS_STAGES[idx + 1]!;
}

export function createLogisticsNode(input: {
  nodeId: string;
  stage: InformationLogisticsStage;
  refId: string;
  tenantId: string;
  universeId: string;
  summary: string;
}): LogisticsNode {
  return { ...input };
}

export function linkLogisticsNodes(input: {
  edgeId: string;
  from: LogisticsNode;
  to: LogisticsNode;
  relation: LogisticsEdge['relation'];
}): LogisticsEdge | { allowed: false; reason: string } {
  if (input.from.tenantId !== input.to.tenantId) {
    return { allowed: false, reason: 'cross_tenant_logistics_link_denied' };
  }
  const fromIdx = INFORMATION_LOGISTICS_STAGES.indexOf(input.from.stage);
  const toIdx = INFORMATION_LOGISTICS_STAGES.indexOf(input.to.stage);
  if (toIdx < fromIdx && input.relation !== 'CONTRADICTS' && input.relation !== 'LEARNS') {
    return { allowed: false, reason: 'invalid_logistics_stage_regression' };
  }
  return {
    edgeId: input.edgeId,
    fromNodeId: input.from.nodeId,
    toNodeId: input.to.nodeId,
    relation: input.relation,
  };
}

export function answerLogisticsTraversal(
  nodes: readonly LogisticsNode[],
  edges: readonly LogisticsEdge[],
  startNodeId: string,
): {
  origin: LogisticsNode | null;
  path: readonly InformationLogisticsStage[];
  contradictions: readonly string[];
  lessons: readonly string[];
} {
  const origin = nodes.find((n) => n.nodeId === startNodeId) ?? null;
  const path = origin ? [origin.stage] : [];
  const contradictions = edges.filter((e) => e.relation === 'CONTRADICTS').map((e) => e.edgeId);
  const lessons = nodes.filter((n) => n.stage === 'LESSON').map((n) => n.nodeId);
  return { origin, path, contradictions, lessons };
}

export type InformationLogisticsQuestion =
  | 'WHERE_DID_THIS_COME_FROM'
  | 'WHO_TOUCHED_THIS'
  | 'WHAT_DECISIONS_DEPEND'
  | 'WHAT_CONTRADICTIONS_EXIST'
  | 'WHAT_LESSONS_RESULTED'
  | 'WHICH_UNIVERSE_OWNS_THIS';

export const INFORMATION_LOGISTICS_QUESTIONS = [
  'WHERE_DID_THIS_COME_FROM',
  'WHO_TOUCHED_THIS',
  'WHAT_DECISIONS_DEPEND',
  'WHAT_CONTRADICTIONS_EXIST',
  'WHAT_LESSONS_RESULTED',
  'WHICH_UNIVERSE_OWNS_THIS',
] as const satisfies readonly InformationLogisticsQuestion[];

export function listInformationLogisticsQuestions(): readonly InformationLogisticsQuestion[] {
  return INFORMATION_LOGISTICS_QUESTIONS;
}

export function answerInformationLogisticsQuestion(input: {
  question: InformationLogisticsQuestion;
  nodes: readonly LogisticsNode[];
  edges: readonly LogisticsEdge[];
  startNodeId: string;
}): {
  question: InformationLogisticsQuestion;
  answer: readonly string[];
  surveillance: false;
} {
  const start = input.nodes.find((n) => n.nodeId === input.startNodeId);
  const traversal = answerLogisticsTraversal(input.nodes, input.edges, input.startNodeId);
  switch (input.question) {
    case 'WHERE_DID_THIS_COME_FROM':
      return {
        question: input.question,
        answer: traversal.origin ? [traversal.origin.refId] : [],
        surveillance: false,
      };
    case 'WHO_TOUCHED_THIS':
      return {
        question: input.question,
        answer: input.nodes.map((n) => n.refId),
        surveillance: false,
      };
    case 'WHAT_DECISIONS_DEPEND':
      return {
        question: input.question,
        answer: input.nodes.filter((n) => n.stage === 'DECISION').map((n) => n.nodeId),
        surveillance: false,
      };
    case 'WHAT_CONTRADICTIONS_EXIST':
      return {
        question: input.question,
        answer: [...traversal.contradictions],
        surveillance: false,
      };
    case 'WHAT_LESSONS_RESULTED':
      return {
        question: input.question,
        answer: [...traversal.lessons],
        surveillance: false,
      };
    case 'WHICH_UNIVERSE_OWNS_THIS':
      return {
        question: input.question,
        answer: start ? [start.universeId] : [],
        surveillance: false,
      };
  }
}
