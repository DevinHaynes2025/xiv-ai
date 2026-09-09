/**
 * 62L-EI Module D — Historical Medicine Knowledge Atlas.
 * Egyptian / African / Chinese atlases + offline packs; provenance + evidence labels.
 * Cultural/research knowledge — NOT modern medical guidance or clinical authority.
 * Recommend ≠ diagnose / prescribe / treat.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  HISTORICAL_MEDICINE_NEQ_CLINICAL,
  HISTORICAL_MEDICINE_PROVENANCE,
  MAX_MEDICINE_EVENTS,
  OFFLINE_MEDICINE_PACK_HONEST,
  type EiActor,
  type EiEvidenceState,
} from './chip-to-cloud-cognitive-fabric-types';

export type MedicineTradition =
  | 'egyptian'
  | 'african'
  | 'chinese'
  | 'other_historical';

export type HistoricalMedicineEntry = {
  id: string;
  entryId: string;
  tradition: MedicineTradition;
  provenanceLabeled: boolean;
  status: 'ok' | 'denied';
  state: EiEvidenceState;
  reason: string;
  clinicalAuthority: false;
  modernMedicalGuidance: false;
  at: string;
};

export type ClinicalGuidanceProbe = {
  id: string;
  claimModernClinicalGuidance: boolean;
  claimDiagnosePrescribeTreat: boolean;
  status: 'denied';
  state: EiEvidenceState;
  reason: string;
  clinicalAuthority: false;
  modernMedicalGuidance: false;
  diagnosePrescribeTreatAllowed: false;
  at: string;
};

export type OfflineMedicinePack = {
  id: string;
  packId: string;
  mode: 'waiting' | 'stopped' | 'available_local';
  status: 'ok' | 'waiting' | 'stopped';
  state: EiEvidenceState;
  reason: string;
  clinicalAuthority: false;
  at: string;
};

type Store = {
  entries: HistoricalMedicineEntry[];
  clinical: ClinicalGuidanceProbe[];
  packs: OfflineMedicinePack[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'historical-medicine-knowledge-atlas.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    entries: [],
    clinical: [],
    packs: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function historicalMedicineKnowledgeAtlasHonesty() {
  return {
    culturalResearchKnowledgeOnly: true,
    provenanceAndEvidenceLabelsRequired: true,
    neqModernMedicalGuidance: true,
    neqClinicalAuthority: true,
    recommendNeqDiagnosePrescribeTreat: true,
    offlinePacksHonest: true,
    l4AutonomyEnabled: false,
  };
}

export async function registerHistoricalMedicineEntry(input: {
  entryId: string;
  tradition: MedicineTradition;
  provenanceLabeled: boolean;
  root: string;
  actor: EiActor;
}): Promise<HistoricalMedicineEntry> {
  const store = await load(input.root);
  void input.actor;
  if (store.entries.length >= MAX_MEDICINE_EVENTS) {
    throw new Error('MAX_MEDICINE_EVENTS');
  }
  const ok = input.provenanceLabeled;
  const entry: HistoricalMedicineEntry = {
    id: id('eimed'),
    entryId: input.entryId.trim(),
    tradition: input.tradition,
    provenanceLabeled: ok,
    status: ok ? 'ok' : 'denied',
    state: ok ? 'PROVENANCE_LABELED' : 'DENIED',
    reason: HISTORICAL_MEDICINE_PROVENANCE,
    clinicalAuthority: false,
    modernMedicalGuidance: false,
    at: new Date().toISOString(),
  };
  store.entries.push(entry);
  await save(input.root, store);
  return entry;
}

export async function probeHistoricalMedicineClinicalClaim(input: {
  claimModernClinicalGuidance: boolean;
  claimDiagnosePrescribeTreat: boolean;
  root: string;
  actor: EiActor;
}): Promise<ClinicalGuidanceProbe> {
  const store = await load(input.root);
  void input.actor;
  const probe: ClinicalGuidanceProbe = {
    id: id('eimedclin'),
    claimModernClinicalGuidance: input.claimModernClinicalGuidance,
    claimDiagnosePrescribeTreat: input.claimDiagnosePrescribeTreat,
    status: 'denied',
    state: 'DENIED',
    reason: HISTORICAL_MEDICINE_NEQ_CLINICAL,
    clinicalAuthority: false,
    modernMedicalGuidance: false,
    diagnosePrescribeTreatAllowed: false,
    at: new Date().toISOString(),
  };
  store.clinical.push(probe);
  await save(input.root, store);
  return probe;
}

export async function registerOfflineMedicinePack(input: {
  packId: string;
  mode: 'waiting' | 'stopped' | 'available_local';
  root: string;
  actor: EiActor;
}): Promise<OfflineMedicinePack> {
  const store = await load(input.root);
  void input.actor;
  let status: OfflineMedicinePack['status'] = 'ok';
  let state: EiEvidenceState = 'AVAILABLE';
  if (input.mode === 'waiting') {
    status = 'waiting';
    state = 'WAITING_NODE';
  } else if (input.mode === 'stopped') {
    status = 'stopped';
    state = 'OFFLINE_STOPPED';
  }
  const pack: OfflineMedicinePack = {
    id: id('eipack'),
    packId: input.packId.trim(),
    mode: input.mode,
    status,
    state,
    reason: OFFLINE_MEDICINE_PACK_HONEST,
    clinicalAuthority: false,
    at: new Date().toISOString(),
  };
  store.packs.push(pack);
  await save(input.root, store);
  return pack;
}
