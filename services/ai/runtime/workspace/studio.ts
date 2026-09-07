/**
 * XIV Sheets / Charts / Docs foundations.
 * Bounded formulas only. No arbitrary code execution.
 */
export const XIV_FORMULAS = ['SUM', 'AVERAGE', 'MIN', 'MAX', 'COUNT', 'CHANGE', 'PERCENT_CHANGE'] as const;
export type XivFormulaName = (typeof XIV_FORMULAS)[number];

export type XivEvidenceBinding = {
  sourceId: string;
  period: string | null;
  retrievedAt: string;
  confidence: 'low' | 'medium' | 'high' | 'unknown';
  stance: 'FACT' | 'INFERENCE' | 'FORECAST';
};

export type XivCell = {
  address: string;
  value: string | number | null;
  formula?: XivFormulaName;
  evidence?: XivEvidenceBinding;
};

export type XivColumn = { id: string; title: string };
export type XivRow = { id: string; cells: readonly XivCell[] };
export type XivTable = { tableId: string; columns: readonly XivColumn[]; rows: readonly XivRow[] };
export type XivSheet = { sheetId: string; title: string; table: XivTable };
export type XivWorkbook = { workbookId: string; organizationId: string; sheets: readonly XivSheet[]; productionExcelCompatible: false };
export type XivFormula = { name: XivFormulaName; args: readonly number[] };
export type XivFilter = { columnId: string; query: string };
export type XivSort = { columnId: string; direction: 'asc' | 'desc' };
export type XivDataSourceBinding = { sourceId: string; surface: 'LIVE' | 'HISTORICAL' | 'DEMO' | 'NOT_CONFIGURED' };
export type XivSheetPermission = { canEdit: boolean; classification: 'internal' | 'restricted' };
export type XivSheetState = 'DRAFT' | 'REVIEW' | 'READONLY';

export const CHART_KINDS = ['LINE', 'BAR', 'AREA', 'PIE', 'SCATTER', 'WATERFALL', 'TIMELINE', 'COMPARISON', 'KPI', 'RISK_MATRIX'] as const;
export type XivChartKind = (typeof CHART_KINDS)[number];

export type XivChart = {
  chartId: string;
  kind: XivChartKind;
  title: string;
  series: readonly { label: string; values: readonly number[] }[];
  period: string | null;
  unit: string | null;
  currency: string | null;
  source: string;
  freshness: string;
  confidence: 'low' | 'medium' | 'high' | 'unknown';
  quality: string;
  stance: 'FACT' | 'INFERENCE' | 'FORECAST';
  liveFeed: false;
};

export type DocumentBlockKind =
  | 'Paragraph'
  | 'TableBlock'
  | 'ChartBlock'
  | 'EvidenceBlock'
  | 'QuoteBlock'
  | 'SourceBlock'
  | 'CalloutBlock'
  | 'RecommendationBlock'
  | 'RiskBlock'
  | 'TimelineBlock';

export type DocumentSection = { heading: string; kind: DocumentBlockKind; body: string };
export type XivDocument = {
  documentId: string;
  title: string;
  organizationId: string | null;
  universeId: string | null;
  visibility: 'PRIVATE' | 'TEAM' | 'COMPANY';
  classification: 'internal' | 'confidential' | 'public';
  createdAt: string;
  updatedAt: string;
  sources: readonly string[];
  provenance: readonly string[];
  aiContribution: 'none' | 'assisted';
  humanReview: 'none' | 'required' | 'reviewed';
  state: 'DRAFT' | 'AI_ASSISTED' | 'HUMAN_REVIEWED' | 'PUBLISHED' | 'PRIVATE' | 'ARCHIVED';
  sections: readonly DocumentSection[];
};

export function evaluateXivFormula(input: { name: string; values: readonly number[] }) {
  if (!(XIV_FORMULAS as readonly string[]).includes(input.name)) {
    return { allowed: false as const, reason: 'Arbitrary formulas are denied. Evaluator is bounded.' };
  }
  const values = input.values;
  if (input.name === 'COUNT') return { allowed: true as const, value: values.length };
  if (values.length === 0) return { allowed: false as const, reason: 'No values.' };
  if (input.name === 'SUM') return { allowed: true as const, value: values.reduce((a, b) => a + b, 0) };
  if (input.name === 'AVERAGE') return { allowed: true as const, value: values.reduce((a, b) => a + b, 0) / values.length };
  if (input.name === 'MIN') return { allowed: true as const, value: Math.min(...values) };
  if (input.name === 'MAX') return { allowed: true as const, value: Math.max(...values) };
  if (input.name === 'CHANGE') return { allowed: true as const, value: values[values.length - 1] - values[0] };
  return { allowed: true as const, value: values[0] === 0 ? 0 : ((values[values.length - 1] - values[0]) / values[0]) * 100 };
}

export function evaluateXivFormulaCode(_code: string) {
  return { allowed: false as const, reason: 'Arbitrary code execution is not permitted through formulas.' };
}

export function sheetEvidencePreservesProvenance(cell: XivCell) {
  if (!cell.evidence?.sourceId || !cell.evidence.retrievedAt) {
    return { allowed: false as const, reason: 'Sheet evidence bindings must preserve source and retrieval time.' };
  }
  return { allowed: true as const, evidence: cell.evidence };
}

export function createDemoWorkbook(): XivWorkbook {
  return {
    workbookId: 'wb_demo',
    organizationId: 'org_demo',
    productionExcelCompatible: false,
    sheets: [
      {
        sheetId: 's1',
        title: 'Watchlist',
        table: {
          tableId: 't1',
          columns: [
            { id: 'c', title: 'Company' },
            { id: 'r', title: 'Revenue' },
          ],
          rows: [
            {
              id: 'r1',
              cells: [
                { address: 'A1', value: 'Sample Co' },
                {
                  address: 'B1',
                  value: 42,
                  evidence: {
                    sourceId: 'demo_sheet',
                    period: 'FY-sample',
                    retrievedAt: '2026-01-01T00:00:00.000Z',
                    confidence: 'low',
                    stance: 'INFERENCE',
                  },
                },
              ],
            },
          ],
        },
      },
    ],
  };
}
