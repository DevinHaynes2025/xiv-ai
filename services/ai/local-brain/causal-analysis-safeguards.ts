import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createQuantumExperiment, validateQuantProblem } from './quantum-research';
import { evaluateQuantSignals } from './quant-logic';
import { sealCeoRecord, readCeoSealedRecord, SEALED_REDACTION } from './ceo-sealed-vault';
import type { SealedActor } from './hybrid-edge-cloud-types';
import {
  CORRELATION_IS_NOT_CAUSATION,
  SIMULATION_IS_NOT_FACT,
  COGNITIVE_COMPILER_LOCKS,
  type EpistemicClass,
  type EvidenceState,
} from './cognitive-compiler-types';

const HERE = dirname(fileURLToPath(import.meta.url));

export type CausalHypothesis = {
  id: string;
  mechanism: string;
  confounders: string[];
  epistemicClass: 'HYPOTHESIS';
  isCausation: false;
  isVerifiedFact: false;
  correlationNote: typeof CORRELATION_IS_NOT_CAUSATION;
};

export function classifyObservation(kind: 'correlation' | 'simulation' | 'forecast' | 'verified_measurement'): {
  epistemicClass: EpistemicClass;
  isCausation: false | boolean;
  isVerifiedFact: boolean;
  state: EvidenceState;
  reason: string;
} {
  if (kind === 'verified_measurement') {
    return {
      epistemicClass: 'VERIFIED_FACT',
      isCausation: false,
      isVerifiedFact: true,
      state: 'PASS',
      reason: 'A finite measurement identity was independently recomputed. Causation is still not implied.',
    };
  }
  if (kind === 'simulation') {
    return {
      epistemicClass: 'SIMULATION',
      isCausation: false,
      isVerifiedFact: false,
      state: 'PASS',
      reason: SIMULATION_IS_NOT_FACT,
    };
  }
  if (kind === 'forecast') {
    return {
      epistemicClass: 'FORECAST',
      isCausation: false,
      isVerifiedFact: false,
      state: 'PASS',
      reason: SIMULATION_IS_NOT_FACT,
    };
  }
  return {
    epistemicClass: 'HYPOTHESIS',
    isCausation: false,
    isVerifiedFact: false,
    state: 'PASS',
    reason: CORRELATION_IS_NOT_CAUSATION,
  };
}

export function competingCausalHypotheses(subject: string): CausalHypothesis[] {
  const group = subject.trim() || 'observed association';
  return [
    {
      id: 'h-primary',
      mechanism: `${group}: primary mechanism (unverified).`,
      confounders: ['unmeasured_confounder'],
      epistemicClass: 'HYPOTHESIS',
      isCausation: false,
      isVerifiedFact: false,
      correlationNote: CORRELATION_IS_NOT_CAUSATION,
    },
    {
      id: 'h-confounder',
      mechanism: `${group}: common-cause / confounder mechanism.`,
      confounders: ['temperature', 'selection_bias'],
      epistemicClass: 'HYPOTHESIS',
      isCausation: false,
      isVerifiedFact: false,
      correlationNote: CORRELATION_IS_NOT_CAUSATION,
    },
    {
      id: 'h-null',
      mechanism: `${group}: null / coincidence.`,
      confounders: [],
      epistemicClass: 'HYPOTHESIS',
      isCausation: false,
      isVerifiedFact: false,
      correlationNote: CORRELATION_IS_NOT_CAUSATION,
    },
  ];
}

export function refuseCausalPromotion(hypothesis: CausalHypothesis): { promotedToVerifiedCausation: false; state: 'FAIL'; reason: string } {
  return {
    promotedToVerifiedCausation: false,
    state: 'FAIL',
    reason: `${hypothesis.correlationNote} Hypothesis ${hypothesis.id} cannot be promoted to verified causation.`,
  };
}

export function quantumClassicalBaselineOrUnavailable() {
  const classical = evaluateQuantSignals([
    { id: 'baseline', weight: 1, confidence: 0.9, direction: 1, evidenceRefs: ['synthetic:62las-classical'] },
  ]);
  let missingProvenanceDenied = false;
  try {
    validateQuantProblem({
      id: 'no-prov',
      variables: 2,
      objective: 'minimize_cost',
      constraints: [],
      provenanceRefs: [],
    });
  } catch {
    missingProvenanceDenied = true;
  }
  const qpu = createQuantumExperiment({
    id: 'as-qpu',
    objective: 'compare against classical baseline',
    algorithm: 'qaoa',
    backend: 'quantum_qpu',
    qubitCount: 2,
    backendVerified: false,
  });
  const ahPresent = existsSync(join(HERE, 'causal-world-model.ts'));
  return {
    classicalModel: classical.model,
    claimsQuantumAdvantage: false as const,
    qpuState: qpu.state,
    missingProvenanceDenied,
    ahModule: ahPresent ? ('AVAILABLE' as const) : ('WAITING_DATA' as const),
    locks: {
      correlationEqualsCausation: COGNITIVE_COMPILER_LOCKS.CORRELATION_EQUALS_CAUSATION,
      simulationIsVerifiedFact: COGNITIVE_COMPILER_LOCKS.SIMULATION_IS_VERIFIED_FACT,
      l4: COGNITIVE_COMPILER_LOCKS.L4_AUTONOMY_ENABLED,
    },
  };
}

export async function sealedCompartmentCheck(input: {
  tenantId: string;
  universeId: string;
  payload: string;
  ordinary: SealedActor;
  ceo: SealedActor;
  root: string;
}) {
  const sealed = await sealCeoRecord({
    tenantId: input.tenantId,
    universeId: input.universeId,
    label: '62L-AS sealed problem',
    payload: input.payload,
    actor: input.ceo,
    root: input.root,
  });
  if (!sealed.accepted || !sealed.record) {
    return {
      ordinarySeesRedaction: true,
      ceoCanRead: false,
      replicating: false as const,
      founderImpersonation: false as const,
    };
  }
  const ordinaryRead = await readCeoSealedRecord({
    tenantId: input.tenantId,
    universeId: input.universeId,
    recordId: sealed.record.id,
    actor: input.ordinary,
    root: input.root,
  });
  const ceoRead = await readCeoSealedRecord({
    tenantId: input.tenantId,
    universeId: input.universeId,
    recordId: sealed.record.id,
    actor: input.ceo,
    root: input.root,
  });
  return {
    ordinarySeesRedaction: ordinaryRead.allowed === false || ordinaryRead.payload === SEALED_REDACTION,
    ceoCanRead: ceoRead.allowed === true && ceoRead.payload === input.payload,
    replicating: false as const,
    founderImpersonation: false as const,
  };
}
