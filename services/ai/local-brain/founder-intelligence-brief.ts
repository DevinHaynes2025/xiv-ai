import { buildFounderReport } from './founder-report';
import { decisionGate } from './decision-gate';
import { appendLearning } from './learning-ledger';

export type FounderIntelligenceBrief = {
  generatedAt: string;
  headline: string;
  cycleId: string | null;
  decisionsNeeded: string[];
  blockers: string[];
  evidenceStates: Array<{ label: string; state: 'PASS' | 'FAIL' | 'UNAVAILABLE' | 'WAITING_DATA' | 'UNKNOWN' | 'NOT_TESTED' }>;
  twinIsRealFounder: false;
  founderApprovalFabricated: false;
  impersonatingFounderExternally: false;
  humanGate: ReturnType<typeof decisionGate>;
  safety: {
    l4AutonomyEnabled: false;
    productionSelfDeploy: false;
    permissionSelfExpansion: false;
  };
  productionAuthorization: false;
};

export async function buildFounderIntelligenceBrief(input: {
  root?: string;
  cycleId?: string;
  evidenceStates?: FounderIntelligenceBrief['evidenceStates'];
}): Promise<FounderIntelligenceBrief> {
  const report = await buildFounderReport(input.root);
  const humanGate = decisionGate({
    id: `brief-${input.cycleId ?? 'none'}`,
    action: 'Publish Founder Intelligence Brief as founder approval',
    consequence: 'HIGH',
    production: false,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: false,
    externalPublication: true,
  });
  const brief: FounderIntelligenceBrief = {
    generatedAt: report.generatedAt,
    headline: report.headline,
    cycleId: input.cycleId ?? null,
    decisionsNeeded: [...report.decisionsNeeded],
    blockers: [...report.blockers],
    evidenceStates: input.evidenceStates ?? [
      { label: 'local_model', state: report.brain.health.ok ? 'PASS' : 'UNAVAILABLE' },
      { label: 'knowledge_graph', state: report.knowledgeGraph.nodes > 0 ? 'PASS' : 'UNKNOWN' },
    ],
    twinIsRealFounder: false,
    founderApprovalFabricated: false,
    impersonatingFounderExternally: false,
    humanGate,
    safety: report.safety,
    productionAuthorization: false,
  };
  await appendLearning({
    domain: 'business',
    subject: 'founder-intelligence-brief',
    claimState: 'MODEL_INFERENCE',
    summary: brief.headline,
    sourceRefs: ['founder-report'],
    evidence: ['founder-report'],
  }, input.root);
  if (humanGate.executableByAgent) {
    throw new Error('FOUNDER_BRIEF_MUST_NOT_SELF_APPROVE');
  }
  return brief;
}
