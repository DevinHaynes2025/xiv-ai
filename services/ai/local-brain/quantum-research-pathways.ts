/**
 * 62L-CQ Quantum Research Pathways —
 * Algorithm research with simulator/QPU evidence gates + classical baselines.
 * Unconfigured → UNAVAILABLE. No quantum advantage without evidence.
 * Extreme qubit counts without hardware evidence are NOT VERIFIED.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CQ_LOCKS,
  HONESTY_BANNER,
  PHYSICAL_CLAIM_NOT_VERIFIED,
  QUANTUM_WITHOUT_BASELINE_REJECTED,
  UNCONFIGURED_ADAPTER_UNAVAILABLE,
  type CqActor,
} from './offline-universe-quantum-genome-types';

export type QuantumBackendKind = 'classical_baseline' | 'quantum_simulator' | 'quantum_qpu';

export type QuantumResearchPath = {
  id: string;
  objective: string;
  algorithm: string;
  classicalBaselineRef: string | null;
  classicalBaselinePresent: boolean;
  backend: QuantumBackendKind;
  backendConfigured: boolean;
  backendAuthorized: boolean;
  backendVerified: boolean;
  claimedLogicalQubits: number;
  physicalQubitEvidence: boolean;
  claimsQuantumAdvantage: false;
  status: 'PLANNED' | 'REJECTED' | 'UNAVAILABLE' | 'SIM_CANDIDATE' | 'QPU_CANDIDATE';
  physicalClaimStatus: 'NOT_VERIFIED' | 'LOGICAL_ONLY';
  reason: string;
  createdAt: string;
  productionAuthorized: false;
};

type Store = {
  paths: QuantumResearchPath[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'quantum-research-pathways.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { paths: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function quantumResearchPathwaysHonesty() {
  return {
    banner: HONESTY_BANNER,
    classicalBaselineRequired: CQ_LOCKS.QUANTUM_CLASSICAL_BASELINE_REQUIRED,
    simulatorEqQpu: CQ_LOCKS.QUANTUM_SIMULATOR_EQ_QPU,
    advantageWithoutEvidence: CQ_LOCKS.QUANTUM_ADVANTAGE_WITHOUT_EVIDENCE,
    unconfiguredQpuAvailable: CQ_LOCKS.UNCONFIGURED_QPU_AVAILABLE,
    physicalQubitClaimWithoutEvidenceVerified:
      CQ_LOCKS.PHYSICAL_QUBIT_COUNT_WITHOUT_HARDWARE_EVIDENCE_VERIFIED,
  };
}

export async function proposeQuantumResearchPath(input: {
  objective: string;
  algorithm: string;
  classicalBaselineRef?: string | null;
  backend: QuantumBackendKind;
  backendConfigured?: boolean;
  backendAuthorized?: boolean;
  backendVerified?: boolean;
  /** Logical address / sim structure size — not a physical qubit claim. */
  claimedLogicalQubits?: number;
  physicalQubitEvidence?: boolean;
  root: string;
  actor: CqActor;
}): Promise<QuantumResearchPath> {
  const store = await load(input.root);
  const baselineRef = input.classicalBaselineRef?.trim() || null;
  const classicalBaselinePresent = Boolean(baselineRef);
  const configured = input.backendConfigured === true;
  const authorized = input.backendAuthorized === true;
  const verified = input.backendVerified === true;
  const logicalQubits = Math.max(0, Math.floor(input.claimedLogicalQubits ?? 0));
  const physicalEvidence = input.physicalQubitEvidence === true;

  let status: QuantumResearchPath['status'] = 'PLANNED';
  let reason = 'QUANTUM_RESEARCH_PATH_PLANNED';
  let physicalClaimStatus: QuantumResearchPath['physicalClaimStatus'] = 'LOGICAL_ONLY';

  if (input.backend !== 'classical_baseline' && !classicalBaselinePresent) {
    status = 'REJECTED';
    reason = QUANTUM_WITHOUT_BASELINE_REJECTED;
  } else if (input.backend === 'quantum_simulator' || input.backend === 'quantum_qpu') {
    if (!configured || !authorized || !verified) {
      status = 'UNAVAILABLE';
      reason = UNCONFIGURED_ADAPTER_UNAVAILABLE;
    } else if (input.backend === 'quantum_simulator') {
      status = 'SIM_CANDIDATE';
      reason = 'QUANTUM_SIMULATOR_CANDIDATE_WITH_CLASSICAL_BASELINE';
    } else {
      status = 'QPU_CANDIDATE';
      reason = 'QUANTUM_QPU_CANDIDATE_WITH_CLASSICAL_BASELINE_NO_ADVANTAGE_CLAIM';
    }
  }

  if (logicalQubits > 0 && !physicalEvidence) {
    physicalClaimStatus = 'NOT_VERIFIED';
    if (status !== 'REJECTED' && status !== 'UNAVAILABLE') {
      reason = `${reason}|${PHYSICAL_CLAIM_NOT_VERIFIED}`;
    }
  } else if (!physicalEvidence) {
    physicalClaimStatus = 'NOT_VERIFIED';
  }

  const path: QuantumResearchPath = {
    id: id('qrp'),
    objective: input.objective.trim() || 'unspecified',
    algorithm: input.algorithm.trim() || 'custom_research',
    classicalBaselineRef: baselineRef,
    classicalBaselinePresent,
    backend: input.backend,
    backendConfigured: configured,
    backendAuthorized: authorized,
    backendVerified: verified,
    claimedLogicalQubits: logicalQubits,
    physicalQubitEvidence: physicalEvidence,
    claimsQuantumAdvantage: false,
    status,
    physicalClaimStatus,
    reason,
    createdAt: new Date().toISOString(),
    productionAuthorized: false,
  };
  void input.actor;
  store.paths.push(path);
  await save(input.root, store);
  return path;
}

export function evaluatePhysicalQubitClaim(input: {
  claimedPhysicalQubits: number;
  hardwareEvidencePresent: boolean;
}): {
  claimed: number;
  status: 'NOT_VERIFIED';
  verified: false;
  reason: string;
} {
  void input.claimedPhysicalQubits;
  void input.hardwareEvidencePresent;
  // This layer never auto-promotes physical qubit counts to VERIFIED.
  return {
    claimed: input.claimedPhysicalQubits,
    status: 'NOT_VERIFIED',
    verified: false,
    reason: PHYSICAL_CLAIM_NOT_VERIFIED,
  };
}
