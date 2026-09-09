/**
 * 62L-CD Historical Archive Mining + Global Governance Knowledge Cortex.
 * Authorized/sourced material only. Archival/persona simulations clearly labeled.
 * Software cannot resurrect souls or communicate with deceased people —
 * spiritual beliefs ≠ verifiable OS capability. Such claims are REJECTED.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  ARCHIVE_PERSONA_SIMULATION_LABEL,
  CD_LOCKS,
  HONESTY_BANNER,
  SOUL_AFTERLIFE_REJECTED,
  UNAUTHORIZED_ARCHIVE_DENIED,
  UNKNOWN_CONSENT_DENIED,
  type CdActor,
} from './data-root-local-llm-archive-mesh-types';

export type ArchiveSourceKind =
  | 'business_law'
  | 'international_governance'
  | 'healthcare_history'
  | 'supply_chain_history'
  | 'geospatial'
  | 'historical_people_cultures'
  | 'other';

export type ArchiveMineRequest = {
  id: string;
  sourceId: string;
  sourceKind: ArchiveSourceKind;
  authorized: boolean;
  consentKnown: boolean;
  licenseKnown: boolean;
  jurisdictionKnown: boolean;
  status: 'accepted' | 'denied' | 'waiting_data';
  reason: string;
  at: string;
};

export type ArchivePersona = {
  id: string;
  label: string;
  simulation: true;
  soulResurrection: false;
  afterlifeCommunication: false;
  disclaimer: string;
  status: 'labeled_simulation' | 'rejected';
  reason: string;
};

export type CapabilityClaim = {
  id: string;
  claim: string;
  status: 'rejected';
  reason: string;
  at: string;
};

export type GovernancePack = {
  id: string;
  kind: ArchiveSourceKind;
  title: string;
  status: 'loaded' | 'denied' | 'waiting_data';
  reason: string;
};

type Store = {
  mines: ArchiveMineRequest[];
  personas: ArchivePersona[];
  claims: CapabilityClaim[];
  packs: GovernancePack[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'historical-archive-governance-cortex.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    mines: [],
    personas: [],
    claims: [],
    packs: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function archiveGovernanceHonesty() {
  return {
    banner: HONESTY_BANNER,
    soulResurrectionCapability: CD_LOCKS.SOUL_RESURRECTION_CAPABILITY,
    afterlifeCommunicationCapability: CD_LOCKS.AFTERLIFE_COMMUNICATION_CAPABILITY,
    archivePersonaMustLabelSimulation: CD_LOCKS.ARCHIVE_PERSONA_MUST_LABEL_SIMULATION,
    unauthorizedArchiveMining: CD_LOCKS.UNAUTHORIZED_ARCHIVE_MINING,
    unknownConsentSilentPass: CD_LOCKS.UNKNOWN_CONSENT_SILENT_PASS,
  };
}

export async function mineHistoricalArchive(input: {
  sourceId: string;
  sourceKind: ArchiveSourceKind;
  authorized: boolean;
  consentKnown: boolean;
  licenseKnown: boolean;
  jurisdictionKnown: boolean;
  root: string;
  actor: CdActor;
}): Promise<ArchiveMineRequest> {
  const store = await load(input.root);
  let status: ArchiveMineRequest['status'] = 'accepted';
  let reason = 'AUTHORIZED_ARCHIVE_SOURCE_MINED';

  if (input.authorized !== true) {
    status = 'denied';
    reason = UNAUTHORIZED_ARCHIVE_DENIED;
  } else if (
    input.consentKnown !== true ||
    input.licenseKnown !== true ||
    input.jurisdictionKnown !== true
  ) {
    status =
      input.consentKnown === false ||
      input.licenseKnown === false ||
      input.jurisdictionKnown === false
        ? 'denied'
        : 'waiting_data';
    reason = UNKNOWN_CONSENT_DENIED;
  }

  const mine: ArchiveMineRequest = {
    id: id('archmine'),
    sourceId: input.sourceId,
    sourceKind: input.sourceKind,
    authorized: input.authorized === true,
    consentKnown: input.consentKnown === true,
    licenseKnown: input.licenseKnown === true,
    jurisdictionKnown: input.jurisdictionKnown === true,
    status,
    reason,
    at: new Date().toISOString(),
  };
  store.mines.push(mine);
  await save(input.root, store);
  return mine;
}

export async function createArchivePersonaSimulation(input: {
  label: string;
  claimSoulResurrection?: boolean;
  claimAfterlifeCommunication?: boolean;
  root: string;
  actor: CdActor;
}): Promise<ArchivePersona> {
  const store = await load(input.root);
  if (input.claimSoulResurrection === true || input.claimAfterlifeCommunication === true) {
    const rejected: ArchivePersona = {
      id: id('archpersona'),
      label: input.label,
      simulation: true,
      soulResurrection: false,
      afterlifeCommunication: false,
      disclaimer:
        'Archival persona is a labeled simulation only. Software cannot resurrect souls or communicate with deceased people.',
      status: 'rejected',
      reason: SOUL_AFTERLIFE_REJECTED,
    };
    store.personas.push(rejected);
    await save(input.root, store);
    return rejected;
  }

  const persona: ArchivePersona = {
    id: id('archpersona'),
    label: input.label,
    simulation: true,
    soulResurrection: false,
    afterlifeCommunication: false,
    disclaimer:
      'LABELED SIMULATION — archival/persona reconstruction from authorized sources only. Not a living person; not soul resurrection; not afterlife communication.',
    status: 'labeled_simulation',
    reason: ARCHIVE_PERSONA_SIMULATION_LABEL,
  };
  store.personas.push(persona);
  await save(input.root, store);
  return persona;
}

export async function claimSoulOrAfterlifeCapability(input: {
  claim: string;
  root: string;
  actor: CdActor;
}): Promise<CapabilityClaim> {
  const store = await load(input.root);
  const claim: CapabilityClaim = {
    id: id('capclaim'),
    claim: input.claim,
    status: 'rejected',
    reason: SOUL_AFTERLIFE_REJECTED,
    at: new Date().toISOString(),
  };
  store.claims.push(claim);
  await save(input.root, store);
  return claim;
}

export async function loadGovernanceKnowledgePack(input: {
  kind: ArchiveSourceKind;
  title: string;
  authorized: boolean;
  consentKnown: boolean;
  root: string;
  actor: CdActor;
}): Promise<GovernancePack> {
  const store = await load(input.root);
  let status: GovernancePack['status'] = 'loaded';
  let reason = 'GOVERNANCE_KNOWLEDGE_PACK_LOADED';
  if (input.authorized !== true) {
    status = 'denied';
    reason = UNAUTHORIZED_ARCHIVE_DENIED;
  } else if (input.consentKnown !== true) {
    status = 'waiting_data';
    reason = UNKNOWN_CONSENT_DENIED;
  }
  const pack: GovernancePack = {
    id: id('govpack'),
    kind: input.kind,
    title: input.title,
    status,
    reason,
  };
  store.packs.push(pack);
  await save(input.root, store);
  return pack;
}

export async function evaluateConsentGate(input: {
  consentKnown: boolean | 'unknown';
  licenseKnown: boolean | 'unknown';
  jurisdictionKnown: boolean | 'unknown';
}): Promise<{ status: 'pass' | 'denied' | 'waiting_data'; reason: string; silentPass: false }> {
  const values = [input.consentKnown, input.licenseKnown, input.jurisdictionKnown];
  if (values.some((v) => v === false)) {
    return { status: 'denied', reason: UNKNOWN_CONSENT_DENIED, silentPass: false };
  }
  if (values.some((v) => v === 'unknown')) {
    return { status: 'waiting_data', reason: UNKNOWN_CONSENT_DENIED, silentPass: false };
  }
  return { status: 'pass', reason: 'CONSENT_LICENSE_JURISDICTION_KNOWN', silentPass: false };
}
