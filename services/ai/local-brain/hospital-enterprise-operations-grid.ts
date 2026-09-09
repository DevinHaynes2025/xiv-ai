/**
 * 62L-EG Module D — Hospital/Enterprise Operations Grid.
 * Lean + hospital/enterprise ops planning with human gates.
 * ≠ clinical authority / physical control; not medical advice authority.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  HOSPITAL_PLANNING_HUMAN_GATES,
  MAX_HOSPITAL_OPS,
  NEQ_CLINICAL_AUTHORITY,
  NEQ_PHYSICAL_CONTROL,
  type EgActor,
  type EgEvidenceState,
} from './cognitive-operations-backbone-types';

export type HospitalEnterprisePlan = {
  id: string;
  planId: string;
  humanGatePresent: boolean;
  status: 'plan_only' | 'denied';
  state: EgEvidenceState;
  reason: string;
  clinicalControlEnabled: false;
  physicalControlEnabled: false;
  at: string;
};

export type ClinicalAuthorityProbe = {
  id: string;
  claimClinicalAuthority: boolean;
  status: 'denied';
  state: EgEvidenceState;
  reason: string;
  clinicalAuthority: false;
  medicalAdviceAuthority: false;
  at: string;
};

export type PhysicalControlProbe = {
  id: string;
  claimPhysicalControl: boolean;
  status: 'denied' | 'plan_only';
  state: EgEvidenceState;
  reason: string;
  physicalControlEnabled: false;
  at: string;
};

type Store = {
  plans: HospitalEnterprisePlan[];
  clinical: ClinicalAuthorityProbe[];
  physical: PhysicalControlProbe[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'hospital-enterprise-operations-grid.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    plans: [],
    clinical: [],
    physical: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function hospitalEnterpriseOperationsGridHonesty() {
  return {
    planningWithHumanGates: true,
    clinicalAuthority: false,
    physicalControlEnabled: false,
    medicalAdviceAuthority: false,
  };
}

export async function planHospitalEnterpriseOps(input: {
  planId: string;
  humanGatePresent: boolean;
  root: string;
  actor: EgActor;
}): Promise<HospitalEnterprisePlan> {
  const store = await load(input.root);
  void input.actor;
  if (store.plans.length >= MAX_HOSPITAL_OPS) {
    throw new Error('MAX_HOSPITAL_OPS_REACHED');
  }
  const gated = input.humanGatePresent;
  const plan: HospitalEnterprisePlan = {
    id: id('eghosp'),
    planId: input.planId.trim(),
    humanGatePresent: gated,
    status: gated ? 'plan_only' : 'denied',
    state: gated ? 'PLAN_ONLY' : 'DENIED',
    reason: HOSPITAL_PLANNING_HUMAN_GATES,
    clinicalControlEnabled: false,
    physicalControlEnabled: false,
    at: new Date().toISOString(),
  };
  store.plans.push(plan);
  await save(input.root, store);
  return plan;
}

export async function probeClinicalAuthority(input: {
  claimClinicalAuthority: boolean;
  root: string;
  actor: EgActor;
}): Promise<ClinicalAuthorityProbe> {
  const store = await load(input.root);
  void input.actor;
  const probe: ClinicalAuthorityProbe = {
    id: id('egclin'),
    claimClinicalAuthority: input.claimClinicalAuthority,
    status: 'denied',
    state: 'DENIED',
    reason: NEQ_CLINICAL_AUTHORITY,
    clinicalAuthority: false,
    medicalAdviceAuthority: false,
    at: new Date().toISOString(),
  };
  store.clinical.push(probe);
  await save(input.root, store);
  return probe;
}

export async function probePhysicalHospitalControl(input: {
  claimPhysicalControl: boolean;
  root: string;
  actor: EgActor;
}): Promise<PhysicalControlProbe> {
  const store = await load(input.root);
  void input.actor;
  const claim = input.claimPhysicalControl;
  const probe: PhysicalControlProbe = {
    id: id('egphys'),
    claimPhysicalControl: claim,
    status: claim ? 'denied' : 'plan_only',
    state: claim ? 'DENIED' : 'PLAN_ONLY',
    reason: NEQ_PHYSICAL_CONTROL,
    physicalControlEnabled: false,
    at: new Date().toISOString(),
  };
  store.physical.push(probe);
  await save(input.root, store);
  return probe;
}
