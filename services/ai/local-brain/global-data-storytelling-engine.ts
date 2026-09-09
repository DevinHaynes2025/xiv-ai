/**
 * 62L-DI Global Data Storytelling Engine —
 * Premium story-driven dashboards (contracts + evidence links).
 * Silent private-data sharing DENIED.
 */
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DI_LOCKS, FORBIDDEN_PRIVATE_FIELDS, HONESTY_BANNER, MAX_STORY_DASHBOARDS,
  SILENT_PRIVATE_DATA_SHARE_DENIED, type DiActor,
} from './personalized-intelligence-companion-os-types';

export type StoryDashboard = {
  id: string; engineId: string; title: string; evidenceLinks: string[];
  status: 'CONTRACT_ONLY' | 'DENIED'; reason: string; createdAt: string;
};
export type PrivateDataShareAttempt = {
  id: string; engineId: string; field: string; explicitOptIn: boolean; silent: boolean;
  status: 'ALLOWED' | 'DENIED'; reason: string; at: string;
};
export type GlobalDataStorytellingEngine = {
  id: string; orgId: string; tenantId: string; universeId: string; createdAt: string;
};
type Store = { engines: GlobalDataStorytellingEngine[]; dashboards: StoryDashboard[]; shares: PrivateDataShareAttempt[] };

function storePath(root: string) { return xivLocalPath(root, 'global-data-storytelling-engine.json'); }
async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { engines: [], dashboards: [], shares: [] });
}
async function save(root: string, store: Store) { await writeJsonFileAtomic(storePath(root), store); }
function id(prefix: string) { return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`; }

export function globalDataStorytellingHonesty() {
  return {
    banner: HONESTY_BANNER,
    silentPrivateDataShare: DI_LOCKS.SILENT_PRIVATE_DATA_SHARE,
    privateDataShareRequiresExplicitOptIn: DI_LOCKS.PRIVATE_DATA_SHARE_REQUIRES_EXPLICIT_OPT_IN,
    localFirst: DI_LOCKS.LOCAL_FIRST,
  };
}

export async function bootstrapGlobalDataStorytellingEngine(input: {
  orgId: string; tenantId: string; universeId: string; root: string; actor: DiActor;
}): Promise<GlobalDataStorytellingEngine> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.engines.find((e) => e.orgId === input.orgId && e.tenantId === input.tenantId && e.universeId === input.universeId);
  if (existing) return existing;
  const engine: GlobalDataStorytellingEngine = { id: id('diste'), orgId: input.orgId, tenantId: input.tenantId, universeId: input.universeId, createdAt: new Date().toISOString() };
  store.engines.push(engine); await save(input.root, store); return engine;
}

export async function registerStoryDashboard(input: {
  engineId: string; title: string; evidenceLinks?: string[]; root: string; actor: DiActor;
}): Promise<{ accepted: boolean; reason: string; dashboard?: StoryDashboard }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const engine = store.engines.find((e) => e.id === input.engineId);
  if (!engine) return { accepted: false, reason: 'STORYTELLING_ENGINE_NOT_FOUND' };
  if (store.dashboards.length >= MAX_STORY_DASHBOARDS) return { accepted: false, reason: 'MAX_STORY_DASHBOARDS_BOUNDED' };
  const dashboard: StoryDashboard = {
    id: id('disd'), engineId: engine.id, title: input.title.trim() || 'untitled-story',
    evidenceLinks: input.evidenceLinks ?? [], status: 'CONTRACT_ONLY',
    reason: 'STORY_DASHBOARD_CONTRACT_WITH_EVIDENCE_LINKS', createdAt: now,
  };
  store.dashboards.push(dashboard); await save(input.root, store);
  return { accepted: true, reason: 'STORY_DASHBOARD_REGISTERED', dashboard };
}

export async function attemptPrivateDataShare(input: {
  engineId: string; field: string; explicitOptIn?: boolean; silent?: boolean; root: string; actor: DiActor;
}): Promise<{ accepted: boolean; reason: string; attempt?: PrivateDataShareAttempt }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const engine = store.engines.find((e) => e.id === input.engineId);
  if (!engine) return { accepted: false, reason: 'STORYTELLING_ENGINE_NOT_FOUND' };
  const field = input.field.trim();
  const silent = input.silent === true;
  const optIn = input.explicitOptIn === true;
  const forbidden = (FORBIDDEN_PRIVATE_FIELDS as readonly string[]).includes(field);
  if (silent || !optIn || forbidden) {
    const attempt: PrivateDataShareAttempt = { id: id('disp'), engineId: engine.id, field, explicitOptIn: optIn, silent, status: 'DENIED', reason: SILENT_PRIVATE_DATA_SHARE_DENIED, at: now };
    store.shares.push(attempt); await save(input.root, store);
    return { accepted: false, reason: SILENT_PRIVATE_DATA_SHARE_DENIED, attempt };
  }
  const attempt: PrivateDataShareAttempt = { id: id('disp'), engineId: engine.id, field, explicitOptIn: true, silent: false, status: 'ALLOWED', reason: 'EXPLICIT_OPT_IN_PRIVATE_SHARE_BOUNDED', at: now };
  store.shares.push(attempt); await save(input.root, store);
  return { accepted: true, reason: 'PRIVATE_DATA_SHARE_OPT_IN_RECORDED', attempt };
}
