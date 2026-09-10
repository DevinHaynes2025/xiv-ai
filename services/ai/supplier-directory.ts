/**
 * US-NET-01 — Supplier / manufacturer directory search.
 * Search index stub + RLS-scoped results for Business role.
 * Honest WAITING_INDEX / WAITING_DATA when unbound; never fabricate supplier inventory or ratings.
 * L4 false. No autonomous production mutations.
 */

export const SUPPLIER_DIRECTORY_POLICY = {
  l4Autonomy: false as const,
  productionMutation: false as const,
  fabricateInventory: false as const,
  fabricateRatings: false as const,
  indexMode: 'stub' as const,
  rlsScoped: true as const,
  label: 'SUPPLIER_DIRECTORY_SEARCH_INDEX_STUB',
} as const;

export type IndexGate = 'WAITING_INDEX' | 'STUB_INDEX';

/** Inventory counts stay null — never invent stock/SKU quantities. */
export type InventoryGate = 'WAITING_DATA';

/** Ratings stay null — never invent stars/reviews/trust scores. */
export type RatingsGate = 'WAITING_DATA';

export type SupplierKind = 'supplier' | 'manufacturer';

export type SupplierInventoryMetrics = {
  gate: InventoryGate;
  onHandUnits: null;
  skuCount: null;
  note: string;
};

export type SupplierRatingsMetrics = {
  gate: RatingsGate;
  stars: null;
  reviewCount: null;
  trustScore: null;
  note: string;
};

export type SupplierDirectoryEntry = {
  id: string;
  name: string;
  kind: SupplierKind;
  category: string;
  region: string;
  /** RLS tenant/org scope — results never cross this boundary. */
  rlsTenantId: string;
  /** Explicit: stub directory card only — not a live marketplace listing. */
  stubOnly: true;
  liveMarketplace: false;
  inventory: SupplierInventoryMetrics;
  ratings: SupplierRatingsMetrics;
};

export type SupplierDirectoryView = {
  status: 'READY' | 'WAITING_INDEX' | 'WAITING_DATA';
  role: 'business';
  l4Autonomy: false;
  productionMutation: false;
  fabricateInventory: false;
  fabricateRatings: false;
  indexMode: 'stub';
  rlsScoped: true;
  indexGate: IndexGate | 'WAITING_INDEX';
  /** Active RLS tenant scope; null when index unbound. */
  tenantScope: string | null;
  /** Last search query; null when unbound / no search yet. */
  query: string | null;
  /** null when index unbound — honest empty; never invent supplier rows. */
  results: SupplierDirectoryEntry[] | null;
  /** Always WAITING_DATA — supplier inventory is never fabricated. */
  inventory: InventoryGate;
  /** Always WAITING_DATA — supplier ratings are never fabricated. */
  ratings: RatingsGate;
  note: string;
};

const WAITING_INVENTORY: SupplierInventoryMetrics = {
  gate: 'WAITING_DATA',
  onHandUnits: null,
  skuCount: null,
  note: 'WAITING_DATA — supplier inventory quantities are not fabricated in the stub index.',
};

const WAITING_RATINGS: SupplierRatingsMetrics = {
  gate: 'WAITING_DATA',
  stars: null,
  reviewCount: null,
  trustScore: null,
  note: 'WAITING_DATA — supplier ratings/reviews/trust scores are not fabricated in the stub index.',
};

/** Builtin stub directory cards — session demo only; not live marketplace inventory. */
export const BUILTIN_STUB_SUPPLIERS: readonly Omit<
  SupplierDirectoryEntry,
  'inventory' | 'ratings' | 'rlsTenantId'
>[] = [
  {
    id: 'stub-supplier-northstar-parts',
    name: 'Northstar Parts Co',
    kind: 'supplier',
    category: 'industrial_components',
    region: 'us-midwest',
    stubOnly: true,
    liveMarketplace: false,
  },
  {
    id: 'stub-mfg-helix-oem',
    name: 'Helix OEM Manufacturing',
    kind: 'manufacturer',
    category: 'precision_machining',
    region: 'us-south',
    stubOnly: true,
    liveMarketplace: false,
  },
  {
    id: 'stub-supplier-civic-logistics',
    name: 'Civic Logistics Supply',
    kind: 'supplier',
    category: 'logistics_packaging',
    region: 'us-northeast',
    stubOnly: true,
    liveMarketplace: false,
  },
  {
    id: 'stub-mfg-aurora-fab',
    name: 'Aurora Fabrication',
    kind: 'manufacturer',
    category: 'sheet_metal',
    region: 'us-west',
    stubOnly: true,
    liveMarketplace: false,
  },
] as const;

type SessionIndex = {
  boundAt: string;
  tenantId: string;
  entries: SupplierDirectoryEntry[];
  lastQuery: string | null;
  lastResults: SupplierDirectoryEntry[];
};

const globalStore = globalThis as typeof globalThis & {
  __xivSupplierDirectoryIndex?: SessionIndex | null;
};

function withHonestMetrics(
  row: Omit<SupplierDirectoryEntry, 'inventory' | 'ratings'> & {
    inventory?: SupplierInventoryMetrics;
    ratings?: SupplierRatingsMetrics;
  },
): SupplierDirectoryEntry {
  return {
    ...row,
    inventory: WAITING_INVENTORY,
    ratings: WAITING_RATINGS,
  };
}

export function resetSupplierDirectorySession() {
  globalStore.__xivSupplierDirectoryIndex = null;
}

export function supplierDirectoryAllowsL4(): false {
  return false;
}

export function supplierDirectoryAllowsProductionMutation(): false {
  return false;
}

export function supplierDirectoryAllowsFabricateInventory(): false {
  return false;
}

export function supplierDirectoryAllowsFabricateRatings(): false {
  return false;
}

export function isSupplierDirectoryIndexBound(): boolean {
  return Boolean(globalStore.__xivSupplierDirectoryIndex);
}

/**
 * Bind the stub search index for an RLS tenant/org scope.
 * Explicit demo action only — does not invent inventory counts or ratings.
 */
export function bindStubSupplierSearchIndex(input: { tenantId: string }): SessionIndex {
  const tenantId = (input.tenantId ?? '').trim();
  if (!tenantId) {
    throw new Error('rls_tenant_required — stub index bind requires a non-empty tenantId for RLS scope');
  }

  const entries = BUILTIN_STUB_SUPPLIERS.map((row) =>
    withHonestMetrics({ ...row, rlsTenantId: tenantId }),
  );

  const bundle: SessionIndex = {
    boundAt: new Date().toISOString(),
    tenantId,
    entries,
    lastQuery: null,
    lastResults: entries.slice(),
  };
  globalStore.__xivSupplierDirectoryIndex = bundle;
  return bundle;
}

export function clearStubSupplierSearchIndex() {
  globalStore.__xivSupplierDirectoryIndex = null;
}

function normalizeQuery(query: string | undefined | null): string {
  return (query ?? '').trim().toLowerCase();
}

function matchesQuery(entry: SupplierDirectoryEntry, q: string): boolean {
  if (!q) return true;
  const hay = `${entry.name} ${entry.kind} ${entry.category} ${entry.region} ${entry.id}`.toLowerCase();
  return hay.includes(q);
}

/**
 * Search the stub index under RLS tenant scope.
 * Wrong/missing tenant → no cross-tenant leak (empty / WAITING_DATA).
 * Inventory + ratings remain WAITING_DATA / null always.
 */
export function searchSupplierDirectory(input: {
  query?: string;
  tenantId: string;
}): SupplierDirectoryEntry[] {
  const index = globalStore.__xivSupplierDirectoryIndex ?? null;
  if (!index) {
    throw new Error('WAITING_INDEX — stub search index is not bound');
  }

  const tenantId = (input.tenantId ?? '').trim();
  if (!tenantId) {
    throw new Error('rls_tenant_required — search requires tenantId for RLS scope');
  }

  // RLS: refuse to return rows outside the bound tenant scope
  if (tenantId !== index.tenantId) {
    index.lastQuery = input.query ?? '';
    index.lastResults = [];
    return [];
  }

  const q = normalizeQuery(input.query);
  const results = index.entries
    .filter((entry) => entry.rlsTenantId === tenantId && matchesQuery(entry, q))
    .map((entry) => withHonestMetrics(entry));

  index.lastQuery = input.query ?? '';
  index.lastResults = results;
  return results;
}

/**
 * Supplier / manufacturer directory view.
 * Unbound → WAITING_INDEX with null results; inventory/ratings WAITING_DATA.
 * Bound stub → STUB_INDEX / READY with RLS-scoped results; never fabricates inventory or ratings.
 */
export function listSupplierDirectoryView(input?: {
  query?: string;
  tenantId?: string;
}): SupplierDirectoryView {
  const index = globalStore.__xivSupplierDirectoryIndex ?? null;

  if (!index) {
    return {
      status: 'WAITING_INDEX',
      role: 'business',
      l4Autonomy: false,
      productionMutation: false,
      fabricateInventory: false,
      fabricateRatings: false,
      indexMode: 'stub',
      rlsScoped: true,
      indexGate: 'WAITING_INDEX',
      tenantScope: null,
      query: null,
      results: null,
      inventory: 'WAITING_DATA',
      ratings: 'WAITING_DATA',
      note:
        'WAITING_INDEX — stub supplier/manufacturer search index not bound. Inventory and ratings are not fabricated. L4 false; no production mutations; RLS-scoped when bound.',
    };
  }

  const requestedTenant = (input?.tenantId ?? index.tenantId).trim();
  if (!requestedTenant || requestedTenant !== index.tenantId) {
    return {
      status: 'WAITING_DATA',
      role: 'business',
      l4Autonomy: false,
      productionMutation: false,
      fabricateInventory: false,
      fabricateRatings: false,
      indexMode: 'stub',
      rlsScoped: true,
      indexGate: 'STUB_INDEX',
      tenantScope: index.tenantId,
      query: input?.query ?? index.lastQuery,
      results: [],
      inventory: 'WAITING_DATA',
      ratings: 'WAITING_DATA',
      note:
        'WAITING_DATA — RLS tenant scope mismatch or missing tenantId; cross-tenant directory rows are not returned. Inventory and ratings remain WAITING_DATA (never fabricated). L4 false; no production mutations.',
    };
  }

  const q = normalizeQuery(input?.query ?? index.lastQuery);
  const results =
    input?.query !== undefined
      ? searchSupplierDirectory({ query: input.query, tenantId: requestedTenant })
      : index.lastResults
          .filter((entry) => entry.rlsTenantId === requestedTenant && matchesQuery(entry, q))
          .map((entry) => withHonestMetrics(entry));

  return {
    status: 'READY',
    role: 'business',
    l4Autonomy: false,
    productionMutation: false,
    fabricateInventory: false,
    fabricateRatings: false,
    indexMode: 'stub',
    rlsScoped: true,
    indexGate: 'STUB_INDEX',
    tenantScope: index.tenantId,
    query: input?.query ?? index.lastQuery,
    results,
    inventory: 'WAITING_DATA',
    ratings: 'WAITING_DATA',
    note: `STUB_INDEX — RLS-scoped stub directory for tenant ${index.tenantId} (bound ${index.boundAt}). Inventory and ratings remain WAITING_DATA (onHand/skuCount/stars/reviews/trust null). Not live marketplace. L4 false; no production mutations.`,
  };
}