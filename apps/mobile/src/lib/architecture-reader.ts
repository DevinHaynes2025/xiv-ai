import {
  bindArchitectureReaderFixture,
  clearArchitectureReaderFixture,
  listArchitectureReaderView,
  type ArchitectureReaderView,
} from '@/lib/ai';

/**
 * US-ARCH-01 — mobile helper for Architecture Reader + Council (Executive / Command Center).
 * Product-lane fixture presenter. WAITING_DATA when unbound; WAITING_PROVIDER for cloud.
 * Never fabricates live fabric metrics. L4 false; productionAutoApply false; readOnly.
 */

export const DEFAULT_DEMO_ARCHITECTURE_UNIVERSE_ID = 'demo-cc';
export const DEFAULT_DEMO_ARCHITECTURE_TENANT_ID = 'xiv';

export type ArchitectureReaderSessionResult = {
  view: ArchitectureReaderView;
};

export function sessionArchitectureReaderView(input?: {
  tenantId?: string;
  universeId?: string;
}): ArchitectureReaderView {
  return listArchitectureReaderView({
    tenantId: input?.tenantId,
    universeId: input?.universeId,
  });
}

export function bindSessionArchitectureReaderFixture(input?: {
  tenantId?: string;
  universeId?: string;
}): ArchitectureReaderSessionResult {
  const tenantId = (input?.tenantId ?? DEFAULT_DEMO_ARCHITECTURE_TENANT_ID).trim();
  const universeId = (input?.universeId ?? DEFAULT_DEMO_ARCHITECTURE_UNIVERSE_ID).trim();
  bindArchitectureReaderFixture({ tenantId, universeId });
  return { view: listArchitectureReaderView({ tenantId, universeId }) };
}

export function clearSessionArchitectureReaderFixture(): ArchitectureReaderSessionResult {
  clearArchitectureReaderFixture();
  return { view: listArchitectureReaderView() };
}