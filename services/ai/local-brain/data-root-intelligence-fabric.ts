/**
 * 62L-CD Data-Root Intelligence Fabric — governed data pipelines and
 * temporal knowledge graphs as a deep foundation under Superbrain
 * (not one mega undifferentiated dump).
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CD_LOCKS,
  HONESTY_BANNER,
  type CdActor,
} from './data-root-local-llm-archive-mesh-types';

export type DataRootDomain =
  | 'business_law'
  | 'international_governance'
  | 'healthcare_history'
  | 'supply_chain_history'
  | 'geospatial'
  | 'historical_people_cultures'
  | 'general';

export type DataRootPipeline = {
  id: string;
  name: string;
  domain: DataRootDomain;
  governed: true;
  megaDump: false;
  status: 'active' | 'denied' | 'waiting_data';
  consentKnown: boolean;
  licenseKnown: boolean;
  jurisdictionKnown: boolean;
  provenanceRefs: string[];
  reason: string;
  createdAt: string;
};

export type TemporalGraphNode = {
  id: string;
  pipelineId: string;
  label: string;
  validFrom: string;
  validTo: string | null;
  bounded: true;
};

type Store = {
  pipelines: DataRootPipeline[];
  graphNodes: TemporalGraphNode[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'data-root-intelligence-fabric.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { pipelines: [], graphNodes: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function dataRootFabricHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CD_LOCKS.L4_AUTONOMY_ENABLED,
    megaUndifferentiatedDump: false,
    governedPipelines: true,
    unknownConsentSilentPass: CD_LOCKS.UNKNOWN_CONSENT_SILENT_PASS,
    founderSealedDenyByDefault: CD_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT,
  };
}

export async function registerGovernedPipeline(input: {
  name: string;
  domain: DataRootDomain;
  consentKnown: boolean;
  licenseKnown: boolean;
  jurisdictionKnown: boolean;
  provenanceRefs?: string[];
  root: string;
  actor: CdActor;
}): Promise<{ pipeline: DataRootPipeline; accepted: boolean }> {
  const store = await load(input.root);
  const known =
    input.consentKnown === true &&
    input.licenseKnown === true &&
    input.jurisdictionKnown === true;
  const provenanceRefs = input.provenanceRefs ?? [];

  let status: DataRootPipeline['status'] = 'active';
  let reason = 'GOVERNED_DATA_ROOT_PIPELINE_REGISTERED';
  if (!known) {
    status = input.consentKnown === false ? 'denied' : 'waiting_data';
    reason = 'UNKNOWN_CONSENT_LICENSE_OR_JURISDICTION_DENIED_OR_WAITING_DATA';
  } else if (provenanceRefs.length === 0) {
    status = 'waiting_data';
    reason = 'PIPELINE_PROVENANCE_WAITING_DATA';
  }

  const pipeline: DataRootPipeline = {
    id: id('drpipe'),
    name: input.name,
    domain: input.domain,
    governed: true,
    megaDump: false,
    status,
    consentKnown: input.consentKnown === true,
    licenseKnown: input.licenseKnown === true,
    jurisdictionKnown: input.jurisdictionKnown === true,
    provenanceRefs,
    reason,
    createdAt: new Date().toISOString(),
  };
  store.pipelines.push(pipeline);
  await save(input.root, store);
  return { pipeline, accepted: status === 'active' };
}

export async function bindTemporalGraphNode(input: {
  pipelineId: string;
  label: string;
  validFrom: string;
  validTo?: string | null;
  root: string;
  actor: CdActor;
}): Promise<{ node: TemporalGraphNode | null; denied: boolean; reason: string }> {
  const store = await load(input.root);
  const pipe = store.pipelines.find((p) => p.id === input.pipelineId);
  if (!pipe || pipe.status !== 'active') {
    return {
      node: null,
      denied: true,
      reason: 'TEMPORAL_GRAPH_REQUIRES_ACTIVE_GOVERNED_PIPELINE',
    };
  }
  const node: TemporalGraphNode = {
    id: id('tgnode'),
    pipelineId: pipe.id,
    label: input.label,
    validFrom: input.validFrom,
    validTo: input.validTo ?? null,
    bounded: true,
  };
  store.graphNodes.push(node);
  await save(input.root, store);
  return { node, denied: false, reason: 'TEMPORAL_KNOWLEDGE_GRAPH_NODE_BOUNDED' };
}
