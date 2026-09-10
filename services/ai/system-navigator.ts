/**
 * US-SYS-01 — System Navigator CSV/commerce demo.
 * Connector stub, not live ERP.
 * CSV/commerce demo path for Executive role.
 * Honest WAITING_DATA / WAITING_CONNECTOR when unbound — never fabricate commerce metrics.
 * L4 remains false. No autonomous production mutations.
 */

export const SYSTEM_NAVIGATOR_POLICY = {
  l4Autonomy: false as const,
  productionMutation: false as const,
  liveErp: false as const,
  connectorMode: 'stub' as const,
  commercePath: 'csv_demo' as const,
  label: 'SYSTEM_NAVIGATOR_CSV_COMMERCE_DEMO',
} as const;

export type SystemConnectorKind = 'erp' | 'crm' | 'wms' | 'commerce_csv' | 'documents';

export type SystemConnectorStatus =
  | 'WAITING_CONNECTOR'
  | 'STUB_UNBOUND'
  | 'STUB_DEMO_CSV'
  | 'NOT_LIVE_ERP';

export type CommerceMetricGate = 'WAITING_DATA' | 'WAITING_CONNECTOR' | 'DEMO_CSV';

export type SystemConnectorStub = {
  id: string;
  kind: SystemConnectorKind;
  name: string;
  domain: 'Physical' | 'Digital' | 'Commerce';
  status: SystemConnectorStatus;
  /** Explicit: never a live ERP/CRM link in this story. */
  live: false;
  freshness: string;
  access: string;
  note: string;
};

export type CommerceCsvDemoRow = {
  sku: string;
  channel: string;
  units: number;
  revenueUsd: number;
};

export type CommerceCsvDemoSnapshot = {
  gate: CommerceMetricGate;
  /** Present only when a demo CSV was explicitly loaded — never invented when unbound. */
  rows: CommerceCsvDemoRow[] | null;
  totals: {
    units: number | null;
    revenueUsd: number | null;
    rowCount: number | null;
  };
  sourceLabel: string;
  demoOnly: true;
  liveErp: false;
  productionMutation: false;
  note: string;
};

export type SystemNavigatorView = {
  status: 'READY' | 'WAITING_DATA' | 'WAITING_CONNECTOR';
  role: 'executive';
  l4Autonomy: false;
  productionMutation: false;
  liveErp: false;
  connectorMode: 'stub';
  connectors: SystemConnectorStub[];
  commerce: CommerceCsvDemoSnapshot;
  note: string;
};

export type CommerceCsvDemoBundle = {
  label: string;
  loadedAt: string;
  rows: CommerceCsvDemoRow[];
};

const DEFAULT_CONNECTORS: SystemConnectorStub[] = [
  {
    id: 'sys-erp',
    kind: 'erp',
    name: 'ERP',
    domain: 'Physical',
    status: 'WAITING_CONNECTOR',
    live: false,
    freshness: 'No ingest',
    access: 'None',
    note: 'Connector stub only — not live ERP. Credentials are not stored on device.',
  },
  {
    id: 'sys-wms',
    kind: 'wms',
    name: 'WMS',
    domain: 'Physical',
    status: 'WAITING_CONNECTOR',
    live: false,
    freshness: 'No ingest',
    access: 'None',
    note: 'WAITING_CONNECTOR — warehouse feed not bound.',
  },
  {
    id: 'sys-crm',
    kind: 'crm',
    name: 'CRM',
    domain: 'Digital',
    status: 'WAITING_CONNECTOR',
    live: false,
    freshness: 'No ingest',
    access: 'None',
    note: 'WAITING_CONNECTOR — CRM stub; no live customer sync.',
  },
  {
    id: 'sys-docs',
    kind: 'documents',
    name: 'Documents',
    domain: 'Digital',
    status: 'STUB_UNBOUND',
    live: false,
    freshness: 'No ingest',
    access: 'Permission-aware later',
    note: 'Document connector stub unbound. NOT live ERP.',
  },
  {
    id: 'sys-commerce-csv',
    kind: 'commerce_csv',
    name: 'Commerce CSV demo',
    domain: 'Commerce',
    status: 'WAITING_CONNECTOR',
    live: false,
    freshness: 'No CSV loaded',
    access: 'Executive demo path only',
    note: 'CSV/commerce demo path. Metrics appear only after an explicit demo CSV load — never fabricated.',
  },
];

/** Built-in sample CSV rows — only returned after loadCommerceCsvDemo(); never as unbound metrics. */
export const BUILTIN_COMMERCE_CSV_DEMO_ROWS: readonly CommerceCsvDemoRow[] = [
  { sku: 'SKU-1001', channel: 'direct', units: 12, revenueUsd: 480 },
  { sku: 'SKU-2044', channel: 'marketplace', units: 7, revenueUsd: 259 },
  { sku: 'SKU-3310', channel: 'retail', units: 3, revenueUsd: 150 },
] as const;

const globalStore = globalThis as typeof globalThis & {
  __xivSystemNavigatorCsvDemo?: CommerceCsvDemoBundle | null;
};

export function resetSystemNavigatorSession() {
  globalStore.__xivSystemNavigatorCsvDemo = null;
}

export function isCommerceCsvDemoLoaded(): boolean {
  return Boolean(globalStore.__xivSystemNavigatorCsvDemo?.rows?.length);
}

export function systemNavigatorAllowsL4(): false {
  return false;
}

export function systemNavigatorAllowsProductionMutation(): false {
  return false;
}

export function systemNavigatorAllowsLiveErp(): false {
  return false;
}

function sanitizeDemoRows(rows: CommerceCsvDemoRow[]): CommerceCsvDemoRow[] {
  return rows
    .map((row) => ({
      sku: String(row.sku ?? '').trim(),
      channel: String(row.channel ?? '').trim() || 'unknown',
      units: Number.isFinite(row.units) ? Math.max(0, Math.floor(row.units)) : 0,
      revenueUsd: Number.isFinite(row.revenueUsd) ? Math.max(0, Number(row.revenueUsd)) : 0,
    }))
    .filter((row) => row.sku.length > 0);
}

/**
 * Explicitly attach a CSV commerce demo bundle (session memory only).
 * Does not connect live ERP. Does not mutate production systems.
 */
export function loadCommerceCsvDemo(input?: {
  label?: string;
  rows?: CommerceCsvDemoRow[];
}): CommerceCsvDemoBundle {
  const rows = sanitizeDemoRows(
    input?.rows?.length ? input.rows : [...BUILTIN_COMMERCE_CSV_DEMO_ROWS],
  );
  if (!rows.length) {
    throw new Error('commerce_csv_demo_rows_required');
  }
  const bundle: CommerceCsvDemoBundle = {
    label: (input?.label ?? 'builtin-commerce-demo.csv').trim() || 'builtin-commerce-demo.csv',
    loadedAt: new Date().toISOString(),
    rows,
  };
  globalStore.__xivSystemNavigatorCsvDemo = bundle;
  return bundle;
}

export function clearCommerceCsvDemo() {
  globalStore.__xivSystemNavigatorCsvDemo = null;
}

function buildCommerceSnapshot(demo: CommerceCsvDemoBundle | null | undefined): CommerceCsvDemoSnapshot {
  if (!demo || !demo.rows.length) {
    return {
      gate: 'WAITING_CONNECTOR',
      rows: null,
      totals: { units: null, revenueUsd: null, rowCount: null },
      sourceLabel: 'unbound',
      demoOnly: true,
      liveErp: false,
      productionMutation: false,
      note:
        'WAITING_CONNECTOR — commerce CSV demo not loaded. Commerce metrics are not fabricated. Not live ERP.',
    };
  }

  const units = demo.rows.reduce((sum, row) => sum + row.units, 0);
  const revenueUsd = demo.rows.reduce((sum, row) => sum + row.revenueUsd, 0);

  return {
    gate: 'DEMO_CSV',
    rows: demo.rows.slice(),
    totals: {
      units,
      revenueUsd,
      rowCount: demo.rows.length,
    },
    sourceLabel: demo.label,
    demoOnly: true,
    liveErp: false,
    productionMutation: false,
    note: `DEMO_CSV only (${demo.label}). Not live ERP. L4 false; no production mutations.`,
  };
}

function buildConnectors(demoLoaded: boolean): SystemConnectorStub[] {
  return DEFAULT_CONNECTORS.map((item) => {
    if (item.kind !== 'commerce_csv') {
      return { ...item, live: false as const };
    }
    if (demoLoaded) {
      return {
        ...item,
        status: 'STUB_DEMO_CSV' as const,
        live: false as const,
        freshness: 'Session demo CSV',
        note: 'CSV/commerce demo stub bound in session memory — not live ERP.',
      };
    }
    return {
      ...item,
      status: 'WAITING_CONNECTOR' as const,
      live: false as const,
      freshness: 'No CSV loaded',
      note: 'WAITING_CONNECTOR — load an explicit commerce CSV demo to surface DEMO_CSV metrics. Never fabricate.',
    };
  });
}

/**
 * Executive System Navigator view.
 * Unbound → WAITING_CONNECTOR / WAITING_DATA with null commerce totals (honest).
 * After loadCommerceCsvDemo → DEMO_CSV labeled metrics only.
 */
export function listSystemNavigatorView(): SystemNavigatorView {
  const demo = globalStore.__xivSystemNavigatorCsvDemo ?? null;
  const demoLoaded = Boolean(demo?.rows?.length);
  const commerce = buildCommerceSnapshot(demo);
  const connectors = buildConnectors(demoLoaded);

  const status: SystemNavigatorView['status'] = demoLoaded
    ? 'READY'
    : 'WAITING_CONNECTOR';

  const note = demoLoaded
    ? 'Connector stubs active. Commerce path is DEMO_CSV (session) — not live ERP. L4 false; no autonomous production mutations.'
    : 'WAITING_CONNECTOR — ERP/CRM/WMS remain stubs. Commerce CSV demo unbound; metrics stay null (WAITING_DATA / WAITING_CONNECTOR). Nothing fabricated.';

  return {
    status,
    role: 'executive',
    l4Autonomy: false,
    productionMutation: false,
    liveErp: false,
    connectorMode: 'stub',
    connectors,
    commerce,
    note,
  };
}

/**
 * Parse a minimal CSV string into commerce demo rows.
 * Expected headers: sku,channel,units,revenueUsd (order flexible).
 * Returns empty array on blank input — caller must not treat empty as live metrics.
 */
export function parseCommerceCsvDemo(csvText: string): CommerceCsvDemoRow[] {
  const text = csvText.trim();
  if (!text) return [];

  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const header = lines[0].split(',').map((cell) => cell.trim().toLowerCase());
  const skuIdx = header.indexOf('sku');
  const channelIdx = header.indexOf('channel');
  const unitsIdx = header.indexOf('units');
  const revenueIdx = header.findIndex((h) => h === 'revenueusd' || h === 'revenue_usd' || h === 'revenue');

  if (skuIdx < 0 || unitsIdx < 0 || revenueIdx < 0) {
    throw new Error('commerce_csv_headers_invalid');
  }

  const rows: CommerceCsvDemoRow[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cells = lines[i].split(',').map((cell) => cell.trim());
    const sku = cells[skuIdx] ?? '';
    if (!sku) continue;
    rows.push({
      sku,
      channel: channelIdx >= 0 ? cells[channelIdx] || 'unknown' : 'unknown',
      units: Number(cells[unitsIdx] ?? 0),
      revenueUsd: Number(cells[revenueIdx] ?? 0),
    });
  }

  return sanitizeDemoRows(rows);
}
