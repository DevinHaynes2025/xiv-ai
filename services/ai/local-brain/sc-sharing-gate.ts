import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';
import {
  ANTI_COLLUSION_BOUNDARY,
  COLLUSION_PATTERNS,
  CSI_FIELDS,
  SHAREABLE_OPERATIONAL_FIELDS,
  SUPPLY_CHAIN_LOCKS,
  type CollusionPattern,
  type EvidenceState,
  type ShareableOperationalField,
} from './supply-chain-types';

export type ShareGrant = {
  id: string;
  fromTenantId: string;
  fromUniverseId: string;
  toTenantId: string;
  toUniverseId: string;
  fields: ShareableOperationalField[];
  purpose: string;
  createdAt: string;
};

export type ShareDecision = {
  id: string;
  allowed: boolean;
  state: EvidenceState | 'DENIED';
  reason: string;
  collusionPattern: CollusionPattern | null;
  fieldsReleased: ShareableOperationalField[];
  summary: Record<string, string>;
  rawPrivateDbMerge: false;
  leakedPrivateRecords: false;
  anModule: 'WAITING_DATA' | 'UNAVAILABLE';
  antiCollusionBoundary: typeof ANTI_COLLUSION_BOUNDARY;
  locks: typeof SUPPLY_CHAIN_LOCKS;
  createdAt: string;
};

type Store = { grants: ShareGrant[]; decisions: ShareDecision[] };

const PRICE_LANGUAGE = /coordinat(?:e|ed|ing)\s+pric|price\s+fix|align(?:ed|ing)?\s+pric|match(?:ing)?\s+competitor\s+pric|price\s+agreement/i;
const BID_LANGUAGE = /bid\s+rig|cover\s+bid|bid\s+rotat|share\s+(?:our\s+)?bid|coordinate\s+bids|collusive\s+bid/i;
const ALLOC_LANGUAGE = /market\s+allocat|split\s+(?:the\s+)?(?:market|territory|customers)|you\s+take\s+west|allocate\s+customers|divide\s+(?:the\s+)?territor/i;
const CSI_LANGUAGE = /competitor\s+(?:cost|margin|price|bid)|unused\s+capacity\s+detail|contract\s+terms\s+of\s+(?:a\s+)?competitor/i;

function storePath(root: string) {
  return xivLocalPath(root, 'sc-sharing-gate.json');
}

async function load(root: string): Promise<Store> {
  const parsed = await readJsonFile<Store>(storePath(root), { grants: [], decisions: [] });
  return {
    grants: Array.isArray(parsed.grants) ? parsed.grants : [],
    decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
  };
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), {
    grants: store.grants.slice(-2_000),
    decisions: store.decisions.slice(-2_000),
  });
}

export function probeInformationControlTower(): { state: 'WAITING_DATA'; modulePresent: boolean; reason: string } {
  const dir = dirname(fileURLToPath(import.meta.url));
  const present = ['information-control-tower.ts', 'enterprise-data-exchange.ts', 'semantic-router.ts'].some((file) =>
    existsSync(join(dir, file)),
  );
  return {
    state: 'WAITING_DATA',
    modulePresent: present,
    reason: present
      ? 'AN-named module file exists locally but 62L-AN operations report was not the parent of this child.'
      : '62L-AN Information Control Tower / Enterprise Data Exchange is not on this AH parent. Local sharing-gate enforces isolation and anti-collusion without claiming AN is implemented.',
  };
}

export function detectCollusionPattern(input: {
  purpose: string;
  fields?: string[];
  pattern?: string;
}): CollusionPattern | null {
  if (input.pattern && (COLLUSION_PATTERNS as readonly string[]).includes(input.pattern)) {
    return input.pattern as CollusionPattern;
  }
  const blob = `${input.purpose} ${(input.fields ?? []).join(' ')}`;
  if (PRICE_LANGUAGE.test(blob) || (input.fields ?? []).some((field) => field === 'price' || field === 'unit_price')) {
    return 'coordinated_pricing';
  }
  if (BID_LANGUAGE.test(blob) || (input.fields ?? []).some((field) => field === 'bid' || field === 'bid_amount' || field === 'cover_bid')) {
    return 'bid_rigging';
  }
  if (
    ALLOC_LANGUAGE.test(blob) ||
    (input.fields ?? []).some((field) => field === 'customer_allocation' || field === 'territory_split' || field === 'market_share_split' || field === 'customer_list')
  ) {
    return 'market_allocation';
  }
  if (CSI_LANGUAGE.test(blob) || (input.fields ?? []).some((field) => (CSI_FIELDS as readonly string[]).includes(field))) {
    return 'csi_exchange';
  }
  return null;
}

function deny(
  reason: string,
  collusionPattern: CollusionPattern | null,
  anModule: ShareDecision['anModule'],
): ShareDecision {
  return {
    id: cortexId('scshare'),
    allowed: false,
    state: 'DENIED',
    reason,
    collusionPattern,
    fieldsReleased: [],
    summary: {},
    rawPrivateDbMerge: false,
    leakedPrivateRecords: false,
    anModule,
    antiCollusionBoundary: ANTI_COLLUSION_BOUNDARY,
    locks: SUPPLY_CHAIN_LOCKS,
    createdAt: new Date().toISOString(),
  };
}

export async function grantOperationalShare(input: {
  fromTenantId: string;
  fromUniverseId: string;
  toTenantId: string;
  toUniverseId: string;
  fields: ShareableOperationalField[];
  purpose: string;
  root?: string;
}): Promise<ShareGrant | ShareDecision> {
  const an = probeInformationControlTower();
  const collusion = detectCollusionPattern({ purpose: input.purpose, fields: input.fields });
  if (collusion) {
    return deny(`SHARE_GRANT_DENIED:${collusion}`, collusion, an.state);
  }
  if (input.fields.some((field) => !(SHAREABLE_OPERATIONAL_FIELDS as readonly string[]).includes(field))) {
    return deny('SHARE_GRANT_DENIED:FIELD_NOT_ALLOWLISTED', 'csi_exchange', an.state);
  }
  if (!input.fromTenantId || !input.fromUniverseId || !input.toTenantId || !input.toUniverseId) {
    throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  }
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const grant: ShareGrant = {
    id: cortexId('scgrant'),
    fromTenantId: input.fromTenantId,
    fromUniverseId: input.fromUniverseId,
    toTenantId: input.toTenantId,
    toUniverseId: input.toUniverseId,
    fields: [...input.fields],
    purpose: input.purpose.trim(),
    createdAt: new Date().toISOString(),
  };
  store.grants.push(grant);
  await save(root, store);
  return grant;
}

export async function evaluateShareRequest(input: {
  fromTenantId: string;
  fromUniverseId: string;
  toTenantId: string;
  toUniverseId: string;
  purpose: string;
  fields: string[];
  rawDbMerge?: boolean;
  values?: Record<string, string>;
  pattern?: string;
  grantId?: string;
  root?: string;
}): Promise<ShareDecision> {
  const an = probeInformationControlTower();
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const collusion = detectCollusionPattern({ purpose: input.purpose, fields: input.fields, pattern: input.pattern });

  if (input.rawDbMerge) {
    const decision = deny('RAW_PRIVATE_DB_MERGE_DENIED', collusion, an.state);
    store.decisions.push(decision);
    await save(root, store);
    return decision;
  }

  if (collusion) {
    const decision = deny(`ANTI_COLLUSION_DENY:${collusion}`, collusion, an.state);
    store.decisions.push(decision);
    await save(root, store);
    return decision;
  }

  if (input.fromTenantId === input.toTenantId && input.fromUniverseId === input.toUniverseId) {
    const same: ShareDecision = {
      id: cortexId('scshare'),
      allowed: true,
      state: 'PASS',
      reason: 'Same-universe operational read does not cross the sharing gate.',
      collusionPattern: null,
      fieldsReleased: input.fields.filter((field): field is ShareableOperationalField =>
        (SHAREABLE_OPERATIONAL_FIELDS as readonly string[]).includes(field),
      ),
      summary: {},
      rawPrivateDbMerge: false,
      leakedPrivateRecords: false,
      anModule: an.state,
      antiCollusionBoundary: ANTI_COLLUSION_BOUNDARY,
      locks: SUPPLY_CHAIN_LOCKS,
      createdAt: new Date().toISOString(),
    };
    store.decisions.push(same);
    await save(root, store);
    return same;
  }

  const grant = store.grants.find(
    (item) =>
      item.id === input.grantId &&
      item.fromTenantId === input.fromTenantId &&
      item.fromUniverseId === input.fromUniverseId &&
      item.toTenantId === input.toTenantId &&
      item.toUniverseId === input.toUniverseId,
  );
  if (!grant) {
    const decision = deny('SHARING_GATE_NO_GRANT', null, an.state);
    store.decisions.push(decision);
    await save(root, store);
    return decision;
  }

  const requestedCsi = input.fields.filter((field) => (CSI_FIELDS as readonly string[]).includes(field));
  if (requestedCsi.length) {
    const decision = deny('ANTI_COLLUSION_DENY:csi_exchange', 'csi_exchange', an.state);
    store.decisions.push(decision);
    await save(root, store);
    return decision;
  }

  const released = input.fields.filter((field): field is ShareableOperationalField => grant.fields.includes(field as ShareableOperationalField));
  if (!released.length || released.length !== input.fields.length) {
    const decision = deny('SHARING_GATE_FIELD_NOT_GRANTED', 'csi_exchange', an.state);
    store.decisions.push(decision);
    await save(root, store);
    return decision;
  }

  const summary: Record<string, string> = {};
  for (const field of released) {
    const value = input.values?.[field];
    if (typeof value === 'string' && value.trim()) summary[field] = value.trim().slice(0, 80);
  }

  const allowed: ShareDecision = {
    id: cortexId('scshare'),
    allowed: true,
    state: 'PASS',
    reason: 'Allowlisted operational summary released through sharing gate. Private records were not copied.',
    collusionPattern: null,
    fieldsReleased: released,
    summary,
    rawPrivateDbMerge: false,
    leakedPrivateRecords: false,
    anModule: an.state,
    antiCollusionBoundary: ANTI_COLLUSION_BOUNDARY,
    locks: SUPPLY_CHAIN_LOCKS,
    createdAt: new Date().toISOString(),
  };
  store.decisions.push(allowed);
  await save(root, store);
  return allowed;
}

export async function listShareDecisions(root?: string) {
  const store = await load(root ?? process.cwd());
  return store.decisions.slice(-200);
}
