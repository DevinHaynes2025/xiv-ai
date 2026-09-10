import {
  clearCommerceCsvDemo,
  listSystemNavigatorView,
  loadCommerceCsvDemo,
  parseCommerceCsvDemo,
  type CommerceCsvDemoRow,
  type SystemNavigatorView,
} from '@/lib/ai';

/**
 * US-SYS-01 — mobile helper for Executive System Navigator CSV/commerce demo.
 * Connector stub only (not live ERP). Honest WAITING_CONNECTOR / WAITING_DATA when unbound.
 * Never fabricates commerce metrics. L4 false; no production mutations.
 */

export type SystemNavigatorSessionResult = {
  view: SystemNavigatorView;
};

export function sessionSystemNavigatorView(): SystemNavigatorView {
  return listSystemNavigatorView();
}

export function loadSessionCommerceCsvDemo(input?: {
  label?: string;
  rows?: CommerceCsvDemoRow[];
  csvText?: string;
}): SystemNavigatorSessionResult {
  let rows = input?.rows;
  if (!rows && input?.csvText) {
    rows = parseCommerceCsvDemo(input.csvText);
  }
  loadCommerceCsvDemo({
    label: input?.label,
    rows,
  });
  return { view: listSystemNavigatorView() };
}

export function clearSessionCommerceCsvDemo(): SystemNavigatorSessionResult {
  clearCommerceCsvDemo();
  return { view: listSystemNavigatorView() };
}

/** Builtin demo CSV text for Executive role demo path (explicit load only). */
export const BUILTIN_COMMERCE_CSV_TEXT = `sku,channel,units,revenueUsd
SKU-1001,direct,12,480
SKU-2044,marketplace,7,259
SKU-3310,retail,3,150
`;
