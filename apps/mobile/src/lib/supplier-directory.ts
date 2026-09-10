import {
  bindStubSupplierSearchIndex,
  clearStubSupplierSearchIndex,
  listSupplierDirectoryView,
  searchSupplierDirectory,
  type SupplierDirectoryView,
} from '@/lib/ai';

/**
 * US-NET-01 — mobile helper for Supplier / manufacturer directory search.
 * Stub search index + RLS-scoped. WAITING_INDEX when unbound.
 * Never fabricates supplier inventory or ratings. L4 false; no production mutations.
 */

export const DEFAULT_DEMO_TENANT_ID = 'demo-tenant-business';

export type SupplierDirectorySessionResult = {
  view: SupplierDirectoryView;
};

export function sessionSupplierDirectoryView(input?: {
  query?: string;
  tenantId?: string;
}): SupplierDirectoryView {
  return listSupplierDirectoryView({
    query: input?.query,
    tenantId: input?.tenantId,
  });
}

export function bindSessionStubSupplierSearchIndex(input?: {
  tenantId?: string;
}): SupplierDirectorySessionResult {
  const tenantId = (input?.tenantId ?? DEFAULT_DEMO_TENANT_ID).trim();
  bindStubSupplierSearchIndex({ tenantId });
  return { view: listSupplierDirectoryView({ tenantId }) };
}

export function searchSessionSupplierDirectory(input: {
  query?: string;
  tenantId?: string;
}): SupplierDirectorySessionResult {
  const tenantId = (input.tenantId ?? DEFAULT_DEMO_TENANT_ID).trim();
  searchSupplierDirectory({ query: input.query, tenantId });
  return { view: listSupplierDirectoryView({ query: input.query, tenantId }) };
}

export function clearSessionStubSupplierSearchIndex(): SupplierDirectorySessionResult {
  clearStubSupplierSearchIndex();
  return { view: listSupplierDirectoryView() };
}