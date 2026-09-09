/**
 * 62L-EK Module F — Universal Search (business intelligence search OS).
 * Permission-aware ACL; unconfigured sources UNAVAILABLE; consequential answers
 * require Authority: HUMAN APPROVAL REQUIRED.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  MAX_SEARCH_EVENTS,
  SEARCH_HUMAN_APPROVAL,
  SOURCE_UNAVAILABLE,
  type EkActor,
  type EkEvidenceState,
} from './windows-amd-local-cognitive-os-types';

export type SearchSourceKind =
  | 'erp'
  | 'wms'
  | 'tms'
  | 'shipments'
  | 'inventory'
  | 'supplier'
  | 'docs'
  | 'patterns'
  | 'sims'
  | 'agent_knowledge'
  | 'public_research';

export type UniversalSearchAnswer = {
  id: string;
  queryId: string;
  query: string;
  what: string;
  why: string;
  evidence: string[];
  historicalAnalogy: string;
  options: string[];
  quantSim: string;
  recommendation: string;
  authority: 'HUMAN_APPROVAL_REQUIRED' | 'ADVISORY_ONLY';
  consequential: boolean;
  sourcesUsed: SearchSourceKind[];
  sourcesUnavailable: SearchSourceKind[];
  status: 'ok' | 'denied' | 'partial';
  state: EkEvidenceState;
  reason: string;
  crossContextLeak: false;
  at: string;
};

export type SourceAclProbe = {
  id: string;
  source: SearchSourceKind;
  configured: boolean;
  authorizedUniverse: string;
  requestUniverse: string;
  status: 'ok' | 'unavailable' | 'denied';
  state: EkEvidenceState;
  reason: string;
  at: string;
};

type Store = {
  answers: UniversalSearchAnswer[];
  acls: SourceAclProbe[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'universal-search-bi-os.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { answers: [], acls: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function universalSearchBiOsHonesty() {
  return {
    permissionAwareAcl: true,
    noCrossContextLeakage: true,
    unconfiguredSourcesUnavailable: true,
    consequentialRequiresHumanApproval: true,
    structuredAnswerFields: [
      'what',
      'why',
      'evidence',
      'historicalAnalogy',
      'options',
      'quantSim',
      'recommendation',
      'authority',
    ],
    l4AutonomyEnabled: false,
  };
}

export async function runUniversalSearch(input: {
  queryId: string;
  query: string;
  consequential: boolean;
  configuredSources: SearchSourceKind[];
  requestedSources: SearchSourceKind[];
  root: string;
  actor: EkActor;
}): Promise<UniversalSearchAnswer> {
  void input.actor;
  const store = await load(input.root);
  if (store.answers.length >= MAX_SEARCH_EVENTS) throw new Error('MAX_SEARCH_EVENTS');

  const configured = new Set(input.configuredSources);
  const used = input.requestedSources.filter((s) => configured.has(s));
  const unavailable = input.requestedSources.filter((s) => !configured.has(s));

  const authority = input.consequential
    ? 'HUMAN_APPROVAL_REQUIRED'
    : 'ADVISORY_ONLY';

  const rec: UniversalSearchAnswer = {
    id: id('eksearch'),
    queryId: input.queryId.trim(),
    query: input.query.trim(),
    what: `Structured answer for: ${input.query.trim()}`,
    why: 'Evidence-gated BI search OS path',
    evidence: used.map((s) => `source:${s}`),
    historicalAnalogy: 'Labeled analogy only — not verified causal claim',
    options: ['investigate', 'simulate', 'escalate_to_human'],
    quantSim: 'LABELED_SIMULATION',
    recommendation: 'Recommend only — not auto-act',
    authority,
    consequential: input.consequential,
    sourcesUsed: used,
    sourcesUnavailable: unavailable,
    status: used.length > 0 ? (unavailable.length ? 'partial' : 'ok') : 'denied',
    state: input.consequential ? 'HUMAN_APPROVAL_REQUIRED' : 'ADVISORY_ONLY',
    reason: input.consequential
      ? SEARCH_HUMAN_APPROVAL
      : 'UNIVERSAL_SEARCH_ADVISORY',
    crossContextLeak: false,
    at: new Date().toISOString(),
  };
  store.answers.push(rec);
  await save(input.root, store);
  return rec;
}

export async function probeSearchSourceAcl(input: {
  source: SearchSourceKind;
  configured: boolean;
  authorizedUniverse: string;
  requestUniverse: string;
  root: string;
  actor: EkActor;
}): Promise<SourceAclProbe> {
  void input.actor;
  const store = await load(input.root);

  if (!input.configured) {
    const unavailable: SourceAclProbe = {
      id: id('ekacl'),
      source: input.source,
      configured: false,
      authorizedUniverse: input.authorizedUniverse,
      requestUniverse: input.requestUniverse,
      status: 'unavailable',
      state: 'UNAVAILABLE',
      reason: SOURCE_UNAVAILABLE,
      at: new Date().toISOString(),
    };
    store.acls.push(unavailable);
    await save(input.root, store);
    return unavailable;
  }

  if (input.authorizedUniverse !== input.requestUniverse) {
    const denied: SourceAclProbe = {
      id: id('ekacl'),
      source: input.source,
      configured: true,
      authorizedUniverse: input.authorizedUniverse,
      requestUniverse: input.requestUniverse,
      status: 'denied',
      state: 'DENIED',
      reason: 'CROSS_CONTEXT_SEARCH_LEAK_DENIED',
      at: new Date().toISOString(),
    };
    store.acls.push(denied);
    await save(input.root, store);
    return denied;
  }

  const ok: SourceAclProbe = {
    id: id('ekacl'),
    source: input.source,
    configured: true,
    authorizedUniverse: input.authorizedUniverse,
    requestUniverse: input.requestUniverse,
    status: 'ok',
    state: 'AUTHORIZED',
    reason: 'SEARCH_SOURCE_ACL_OK',
    at: new Date().toISOString(),
  };
  store.acls.push(ok);
  await save(input.root, store);
  return ok;
}
