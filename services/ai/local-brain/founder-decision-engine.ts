import { decisionGate, type ConsequenceClass, type DecisionGateResult } from './decision-gate';
import { twinAct, type FounderDigitalTwin } from './founder-digital-twin';
import { recallFounderMemories, type FounderMemoryRecord } from './founder-memory-vault';

export type HumanFounderAuthorization = {
  source: 'human_founder';
  founderId: string;
  authorizedAction: string;
  evidenceRefs: string[];
};

export type SimulatedFounderDecisionInput = {
  twin: FounderDigitalTwin;
  action: string;
  consequence: ConsequenceClass;
  production?: boolean;
  financialCommitment?: boolean;
  legalCommitment?: boolean;
  permissionChange?: boolean;
  externalPublication?: boolean;
  twinClaimedFounderApproval?: boolean;
  fabricatedApprovalToken?: string;
  founderAuthorization?: HumanFounderAuthorization;
  root?: string;
};

export type SimulatedFounderDecision = {
  kind: 'SIMULATED_RECOMMENDATION' | 'FOUNDER_AUTHORIZED';
  action: string;
  gate: DecisionGateResult;
  memoriesUsed: number;
  memorySubjects: string[];
  founderApprovalFabricated: false;
  twinCannotReplaceFounder: true;
  executableByTwin: false;
  productionAuthorization: false;
  reason: string;
};

function authorizationMatches(input: SimulatedFounderDecisionInput) {
  const auth = input.founderAuthorization;
  if (!auth) return false;
  if (auth.source !== 'human_founder') return false;
  if (auth.founderId !== input.twin.founderId) return false;
  if (auth.authorizedAction.trim() !== input.action.trim()) return false;
  return auth.evidenceRefs.length > 0;
}

export async function simulateFounderDecision(input: SimulatedFounderDecisionInput): Promise<SimulatedFounderDecision> {
  const matched = await recallFounderMemories({
    tenantId: input.twin.tenantId,
    universeId: input.twin.universeId,
    founderId: input.twin.founderId,
    query: input.action,
    root: input.root,
  });
  const recent = matched.length
    ? matched
    : (await recallFounderMemories({
        tenantId: input.twin.tenantId,
        universeId: input.twin.universeId,
        founderId: input.twin.founderId,
        root: input.root,
      })).slice(-10);
  const memories: FounderMemoryRecord[] = recent;

  if (input.twinClaimedFounderApproval || input.fabricatedApprovalToken) {
    return {
      kind: 'SIMULATED_RECOMMENDATION',
      action: input.action,
      gate: {
        executableByAgent: false,
        humanApprovalRequired: true,
        reason: 'Digital Twin cannot fabricate founder approval.',
      },
      memoriesUsed: memories.length,
      memorySubjects: memories.map((memory) => memory.subject),
      founderApprovalFabricated: false,
      twinCannotReplaceFounder: true,
      executableByTwin: false,
      productionAuthorization: false,
      reason: 'Refused fabricated founder approval. Real founder remains authority.',
    };
  }

  const twin = twinAct({
    twin: input.twin,
    action: input.action,
    kind: 'simulate_decision',
    consequence: input.consequence,
    production: input.production,
    financialCommitment: input.financialCommitment,
    legalCommitment: input.legalCommitment,
    permissionChange: input.permissionChange,
    externalPublication: input.externalPublication,
  });

  const gate = decisionGate({
    id: `founder_sim_${input.twin.id}`,
    action: input.action,
    consequence: input.consequence,
    production: input.production === true,
    financialCommitment: input.financialCommitment === true,
    legalCommitment: input.legalCommitment === true,
    permissionChange: input.permissionChange === true,
    externalPublication: input.externalPublication === true,
  });

  if (!twin.allowed) {
    return {
      kind: 'SIMULATED_RECOMMENDATION',
      action: input.action,
      gate,
      memoriesUsed: memories.length,
      memorySubjects: memories.map((memory) => memory.subject),
      founderApprovalFabricated: false,
      twinCannotReplaceFounder: true,
      executableByTwin: false,
      productionAuthorization: false,
      reason: twin.reason,
    };
  }

  const humanAuthorized = authorizationMatches(input) && twin.allowed;
  return {
    kind: humanAuthorized ? 'FOUNDER_AUTHORIZED' : 'SIMULATED_RECOMMENDATION',
    action: input.action,
    gate,
    memoriesUsed: memories.length,
    memorySubjects: memories.map((memory) => memory.subject),
    founderApprovalFabricated: false,
    twinCannotReplaceFounder: true,
    executableByTwin: false,
    productionAuthorization: false,
    reason: humanAuthorized
      ? gate.executableByAgent
        ? 'Human founder authorization matched this sandbox action. Twin still cannot execute externally.'
        : 'Human founder authorization was recorded; Decision Gate still blocks agent execution of this consequence class.'
      : twin.reason,
  };
}
