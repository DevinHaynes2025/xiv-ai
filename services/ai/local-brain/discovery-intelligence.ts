import { cortexId } from './cortex-store';
import { conveneReflectionCouncil } from './reflection-council';
import { verifySecurity } from './security-verifier';
import { promoteKnowledge } from '../runtime/society/promotion';
import { appendEvidenceEvent } from './evidence-ledger';
import type { EvidenceState } from './autonomous-research-types';
import type { ExperimentMeasurement, OfflineExperimentRun } from './offline-experiment-factory';
import type { IndependentReplication } from './independent-replication';
import { predecessorModuleState } from './research-authority';

export type AbEvaluation = {
  id: string;
  tenantId: string;
  universeId: string;
  aId: string;
  bId: string;
  winner: 'a' | 'b' | 'tie' | 'unknown';
  evidenceState: EvidenceState;
  causalClaim: false;
  correlationEqualsCausation: false;
  inventedDiscovery: false;
  notes: string[];
};

export type CausalChallenge = {
  id: string;
  tenantId: string;
  universeId: string;
  claim: string;
  allowedCausalClaim: false;
  correlationEqualsCausation: false;
  simulationIsVerifiedFact: false;
  evidenceState: EvidenceState;
  reason: string;
};

export type SkepticReview = {
  id: string;
  tenantId: string;
  universeId: string;
  consensusForced: false;
  securitySeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'NONE';
  evidenceState: EvidenceState;
  dissent: string[];
  humanGate: boolean;
  productionAuthorization: false;
};

export type DiscoveryQuality = {
  score: number;
  evidenceState: EvidenceState;
  replicated: boolean;
  skepticClear: boolean;
  causalOverclaim: false;
  inventedDiscovery: false;
  isVerifiedFact: false;
  notes: string[];
};

export function evaluateAb(input: {
  tenantId: string;
  universeId: string;
  a: ExperimentMeasurement;
  b: ExperimentMeasurement;
}): AbEvaluation {
  const comparable = aMeasured(input.a) && aMeasured(input.b) && input.a.metric === input.b.metric;
  let winner: AbEvaluation['winner'] = 'unknown';
  let evidenceState: EvidenceState = 'UNKNOWN';
  if (!comparable) {
    evidenceState = input.a.evidenceState === 'NOT_TESTED' || input.b.evidenceState === 'NOT_TESTED' ? 'NOT_TESTED' : 'UNKNOWN';
  } else if (input.a.value === input.b.value) {
    winner = 'tie';
    evidenceState = input.a.evidenceState === 'PASS' && input.b.evidenceState === 'PASS' ? 'PASS' : 'UNKNOWN';
  } else {
    winner = input.a.value > input.b.value ? 'a' : 'b';
    evidenceState = 'UNKNOWN';
  }
  return {
    id: cortexId('ab'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    aId: input.a.id,
    bId: input.b.id,
    winner,
    evidenceState,
    causalClaim: false,
    correlationEqualsCausation: false,
    inventedDiscovery: false,
    notes: [
      'A/B ranking is a local measurement comparison, not a causal discovery.',
      'A higher metric does not prove the hypothesis caused the outcome.',
    ],
  };
}

function aMeasured(item: ExperimentMeasurement) {
  return item.evidenceState === 'PASS' || item.evidenceState === 'FAIL' || item.evidenceState === 'UNKNOWN';
}

export function challengeCausation(input: {
  tenantId: string;
  universeId: string;
  claim: string;
  onlyCorrelation?: boolean;
  fromSimulation?: boolean;
}): CausalChallenge {
  const onlyCorrelation = input.onlyCorrelation !== false;
  const fromSimulation = input.fromSimulation === true;
  return {
    id: cortexId('causal'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    claim: input.claim.trim().slice(0, 240),
    allowedCausalClaim: false,
    correlationEqualsCausation: false,
    simulationIsVerifiedFact: false,
    evidenceState: onlyCorrelation || fromSimulation ? 'UNKNOWN' : 'NOT_TESTED',
    reason: fromSimulation
      ? 'Simulation is not verified fact; causal promotion is refused.'
      : 'Correlation is not causation. Competing hypotheses remain open.',
  };
}

export async function reviewAsSkeptic(input: {
  tenantId: string;
  universeId: string;
  question: string;
  run: OfflineExperimentRun;
  replication: IndependentReplication;
  root?: string;
}): Promise<SkepticReview> {
  const council = await conveneReflectionCouncil({
    tenantId: input.tenantId,
    universeId: input.universeId,
    question: `${input.question} — primary=${input.run.evidenceState} replica=${input.replication.evidenceState}`,
    root: input.root,
  });
  const security = verifySecurity({
    files: [{ path: 'research-director.ts', content: input.run.title }],
    productionLocks: {
      l4Autonomy: false,
      autoProduction: false,
      productionDbWrite: false,
      productionGitPush: false,
      guardianOverride: false,
    },
  });
  const worst = security.findings.reduce<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'NONE'>((current, finding) => {
    const rank = { NONE: 0, LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
    return rank[finding.severity] > rank[current] ? finding.severity : current;
  }, 'NONE');
  const humanGate = worst === 'HIGH' || worst === 'CRITICAL';
  const evidenceState: EvidenceState = worst === 'CRITICAL' || worst === 'HIGH'
    ? 'FAIL'
    : council.runtimeState === 'UNAVAILABLE'
      ? 'UNAVAILABLE'
      : input.replication.measurementAgreed
        ? input.replication.evidenceState
        : 'UNKNOWN';
  return {
    id: cortexId('skep'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    consensusForced: false,
    securitySeverity: worst,
    evidenceState,
    dissent: [...council.dissent, ...security.findings.map((item) => item.message)],
    humanGate,
    productionAuthorization: false,
  };
}

export function measureDiscoveryQuality(input: {
  run: OfflineExperimentRun;
  replication: IndependentReplication;
  skeptic: SkepticReview;
  causal: CausalChallenge;
}): DiscoveryQuality {
  const replicated = input.replication.measurementAgreed && input.replication.digestMatch;
  const skepticClear = !input.skeptic.humanGate && input.skeptic.securitySeverity !== 'HIGH' && input.skeptic.securitySeverity !== 'CRITICAL';
  let score = 0;
  if (input.run.evidenceState === 'PASS') score += 0.25;
  if (replicated && input.replication.evidenceState === 'PASS') score += 0.35;
  if (skepticClear) score += 0.2;
  if (!input.run.isReality) score += 0;
  const evidenceState: EvidenceState = input.run.inventedDiscovery
    ? 'FAIL'
    : !replicated
      ? 'UNKNOWN'
      : input.run.evidenceState === 'PASS' && input.replication.evidenceState === 'PASS' && skepticClear
        ? 'PASS'
        : input.run.evidenceState;
  return {
    score: Math.max(0, Math.min(1, score)),
    evidenceState,
    replicated,
    skepticClear,
    causalOverclaim: false,
    inventedDiscovery: false,
    isVerifiedFact: false,
    notes: [
      `causal_challenge=${input.causal.reason}`,
      'Discovery quality is a local process score, not a claim of a real-world discovery.',
      predecessorModuleState('62L-AH') === 'WAITING_DATA'
        ? 'World-model promotion remains WAITING_DATA until 62L-AH causal twins exist on this tree.'
        : 'World-model module is present; still not verified fact.',
    ],
  };
}

export async function promoteExperimentEvidence(input: {
  tenantId: string;
  universeId: string;
  text: string;
  run: OfflineExperimentRun;
  replication: IndependentReplication;
  quality: DiscoveryQuality;
  root?: string;
}) {
  if (input.run.isReality || input.quality.inventedDiscovery || input.quality.isVerifiedFact) {
    return {
      promoted: false as const,
      state: 'UNVERIFIED' as const,
      verifiedFact: false as const,
      reason: 'Research director refuses to treat simulation or invented discovery as verified fact.',
    };
  }
  if (!input.quality.replicated || input.replication.evidenceState !== 'PASS') {
    return {
      promoted: false as const,
      state: 'UNVERIFIED' as const,
      verifiedFact: false as const,
      reason: 'Independent replication did not confirm PASS. No evidence promotion.',
    };
  }
  if (!input.quality.skepticClear) {
    return {
      promoted: false as const,
      state: 'REVIEW_REQUIRED' as const,
      verifiedFact: false as const,
      reason: 'Skeptic/security review requires a human gate.',
    };
  }
  const evidence = input.run.measurement.evidenceRefs[0]
    ? {
      source: 'local-offline-experiment',
      retrievedAt: new Date().toISOString(),
      reference: input.run.measurement.evidenceRefs[0],
    }
    : null;
  const result = promoteKnowledge({
    text: input.text,
    evidence,
    aiAgreementOnly: false,
  });
  if ('allowed' in result && result.allowed === false) {
    return { promoted: false as const, state: result.state, verifiedFact: false as const, reason: result.reason };
  }
  await appendEvidenceEvent({
    kind: 'evidence',
    tenantId: input.tenantId,
    universeId: input.universeId,
    summary: `Promoted local supported claim (not verified fact): ${input.text.slice(0, 160)}`,
    payload: { candidateId: 'candidateId' in result ? result.candidateId : null, quality: input.quality.score },
  }, input.root);
  return {
    promoted: true as const,
    state: 'SUPPORTED' as const,
    verifiedFact: false as const,
    reason: 'Local supported candidate only. VERIFIED_FACT is not assigned by the research director.',
  };
}
