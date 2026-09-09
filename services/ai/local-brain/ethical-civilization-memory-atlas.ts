/**
 * 62L-EK Module D — Ethical Civilization Memory Atlas + evidence classification.
 * Soft-wire EI: historical medicine ≠ clinical guidance.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  ATLAS_EVIDENCE_CLASSES,
  ATLAS_SUBJECTS,
  CIVILIZATION_ATLASES,
  EVIDENCE_CLASS_REQUIRED,
  HISTORICAL_MEDICINE_NEQ_CLINICAL,
  MAX_ATLAS_EVENTS,
  type AtlasEvidenceClass,
  type EkActor,
  type EkEvidenceState,
} from './windows-amd-local-cognitive-os-types';

export type CivilizationAtlasEntry = {
  id: string;
  entryId: string;
  atlas: (typeof CIVILIZATION_ATLASES)[number];
  subject: (typeof ATLAS_SUBJECTS)[number];
  evidenceClass: AtlasEvidenceClass;
  provenance: string;
  status: 'ok' | 'denied';
  state: EkEvidenceState;
  reason: string;
  clinicalAuthority: false;
  modernMedicalGuidance: false;
  at: string;
};

export type MedicineClinicalProbe = {
  id: string;
  claimModernClinicalGuidance: boolean;
  status: 'denied';
  state: EkEvidenceState;
  reason: string;
  clinicalAuthority: false;
  modernMedicalGuidance: false;
  at: string;
};

type Store = {
  entries: CivilizationAtlasEntry[];
  clinical: MedicineClinicalProbe[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'ethical-civilization-memory-atlas.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { entries: [], clinical: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function ethicalCivilizationMemoryAtlasHonesty() {
  return {
    atlases: CIVILIZATION_ATLASES,
    subjects: ATLAS_SUBJECTS,
    evidenceClasses: ATLAS_EVIDENCE_CLASSES,
    evidenceClassRequired: true,
    historicalMedicineNeqClinicalGuidance: true,
    ancientPhilosophyMayInspireEthicsNotModernScienceEvidence: true,
    softWireEiHistoricalMedicineNeqClinical: true,
    l4AutonomyEnabled: false,
  };
}

export async function registerCivilizationAtlasEntry(input: {
  entryId: string;
  atlas: (typeof CIVILIZATION_ATLASES)[number];
  subject: (typeof ATLAS_SUBJECTS)[number];
  evidenceClass?: AtlasEvidenceClass | null;
  provenance: string;
  root: string;
  actor: EkActor;
}): Promise<CivilizationAtlasEntry> {
  void input.actor;
  const store = await load(input.root);
  if (store.entries.length >= MAX_ATLAS_EVENTS) throw new Error('MAX_ATLAS_EVENTS');

  if (!input.evidenceClass || !ATLAS_EVIDENCE_CLASSES.includes(input.evidenceClass)) {
    const denied: CivilizationAtlasEntry = {
      id: id('ekatlas'),
      entryId: input.entryId.trim(),
      atlas: input.atlas,
      subject: input.subject,
      evidenceClass: 'SPECULATIVE',
      provenance: input.provenance,
      status: 'denied',
      state: 'DENIED',
      reason: EVIDENCE_CLASS_REQUIRED,
      clinicalAuthority: false,
      modernMedicalGuidance: false,
      at: new Date().toISOString(),
    };
    store.entries.push(denied);
    await save(input.root, store);
    return denied;
  }

  const rec: CivilizationAtlasEntry = {
    id: id('ekatlas'),
    entryId: input.entryId.trim(),
    atlas: input.atlas,
    subject: input.subject,
    evidenceClass: input.evidenceClass,
    provenance: input.provenance.trim(),
    status: 'ok',
    state: input.evidenceClass,
    reason: 'CIVILIZATION_ATLAS_ENTRY_LABELED',
    clinicalAuthority: false,
    modernMedicalGuidance: false,
    at: new Date().toISOString(),
  };
  store.entries.push(rec);
  await save(input.root, store);
  return rec;
}

export async function probeHistoricalMedicineClinicalClaim(input: {
  claimModernClinicalGuidance: boolean;
  root: string;
  actor: EkActor;
}): Promise<MedicineClinicalProbe> {
  void input.actor;
  const store = await load(input.root);
  const denied: MedicineClinicalProbe = {
    id: id('ekmed'),
    claimModernClinicalGuidance: input.claimModernClinicalGuidance,
    status: 'denied',
    state: 'DENIED',
    reason: HISTORICAL_MEDICINE_NEQ_CLINICAL,
    clinicalAuthority: false,
    modernMedicalGuidance: false,
    at: new Date().toISOString(),
  };
  store.clinical.push(denied);
  await save(input.root, store);
  return denied;
}
