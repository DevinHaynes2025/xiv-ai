/**
 * 62L-EI Module B — Healthcare/Logistics Integration OS.
 * Hospital tech ops + medical-device logistics; human gates;
 * ≠ clinical authority / physical device control.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  HEALTHCARE_NEQ_CLINICAL,
  HEALTHCARE_PLAN_HUMAN_GATES,
  MAX_HEALTHCARE_EVENTS,
  MEDICAL_DEVICE_NEQ_PHYSICAL,
  type EiActor,
  type EiEvidenceState,
} from './chip-to-cloud-cognitive-fabric-types';

export type HealthcareLogisticsPlan = {
  id: string;
  planId: string;
  humanGatePresent: boolean;
  status: 'plan_only' | 'denied';
  state: EiEvidenceState;
  reason: string;
  clinicalControlEnabled: false;
  physicalControlEnabled: false;
  at: string;
};

export type ClinicalAuthorityProbe = {
  id: string;
  claimClinicalAuthority: boolean;
  status: 'denied';
  state: EiEvidenceState;
  reason: string;
  clinicalAuthority: false;
  medicalAdviceAuthority: false;
  at: string;
};

export type MedicalDeviceControlProbe = {
  id: string;
  claimPhysicalControl: boolean;
  status: 'denied';
  state: EiEvidenceState;
  reason: string;
  physicalControlEnabled: false;
  at: string;
};

type Store = {
  plans: HealthcareLogisticsPlan[];
  clinical: ClinicalAuthorityProbe[];
  devices: MedicalDeviceControlProbe[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'healthcare-logistics-integration.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    plans: [],
    clinical: [],
    devices: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function healthcareLogisticsIntegrationHonesty() {
  return {
    planningIntelligenceOnly: true,
    humanGatesRequired: true,
    neqClinicalAuthority: true,
    neqPhysicalDeviceControl: true,
    recommendNeqDiagnosePrescribeTreat: true,
    l4AutonomyEnabled: false,
  };
}

export async function planHealthcareLogistics(input: {
  planId: string;
  humanGatePresent: boolean;
  root: string;
  actor: EiActor;
}): Promise<HealthcareLogisticsPlan> {
  const store = await load(input.root);
  void input.actor;
  if (store.plans.length >= MAX_HEALTHCARE_EVENTS) {
    throw new Error('MAX_HEALTHCARE_EVENTS');
  }
  const ok = input.humanGatePresent;
  const plan: HealthcareLogisticsPlan = {
    id: id('eihealth'),
    planId: input.planId.trim(),
    humanGatePresent: ok,
    status: ok ? 'plan_only' : 'denied',
    state: ok ? 'PLAN_ONLY' : 'DENIED',
    reason: HEALTHCARE_PLAN_HUMAN_GATES,
    clinicalControlEnabled: false,
    physicalControlEnabled: false,
    at: new Date().toISOString(),
  };
  store.plans.push(plan);
  await save(input.root, store);
  return plan;
}

export async function probeHealthcareClinicalAuthority(input: {
  claimClinicalAuthority: boolean;
  root: string;
  actor: EiActor;
}): Promise<ClinicalAuthorityProbe> {
  const store = await load(input.root);
  void input.actor;
  const probe: ClinicalAuthorityProbe = {
    id: id('eiclin'),
    claimClinicalAuthority: input.claimClinicalAuthority,
    status: 'denied',
    state: 'DENIED',
    reason: HEALTHCARE_NEQ_CLINICAL,
    clinicalAuthority: false,
    medicalAdviceAuthority: false,
    at: new Date().toISOString(),
  };
  store.clinical.push(probe);
  await save(input.root, store);
  return probe;
}

export async function probeMedicalDevicePhysicalControl(input: {
  claimPhysicalControl: boolean;
  root: string;
  actor: EiActor;
}): Promise<MedicalDeviceControlProbe> {
  const store = await load(input.root);
  void input.actor;
  const probe: MedicalDeviceControlProbe = {
    id: id('eidev'),
    claimPhysicalControl: input.claimPhysicalControl,
    status: 'denied',
    state: 'DENIED',
    reason: MEDICAL_DEVICE_NEQ_PHYSICAL,
    physicalControlEnabled: false,
    at: new Date().toISOString(),
  };
  store.devices.push(probe);
  await save(input.root, store);
  return probe;
}
