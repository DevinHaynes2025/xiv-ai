import {
  bindPocketBrainFixture,
  clearPocketBrainFixture,
  listPocketBrainView,
  type PocketBrainView,
} from '@/lib/ai';

/**
 * US-PB-01 -- mobile helper for Pocket Brain product surface (Executive / Business).
 * LOCAL/SIMULATION fixture presenter. WAITING_DATA when unbound.
 * WAITING_PROVIDER / WAITING_SYNC when bound without live sync proof.
 * Never fabricates pocket/Global Brain metrics. L4 false; productionMutation false.
 */

export const DEFAULT_DEMO_POCKET_UNIVERSE_ID = 'demo-pocket';
export const DEFAULT_DEMO_POCKET_TENANT_ID = 'xiv';
export const DEFAULT_DEMO_POCKET_DEVICE_SCOPE = 'asus-local';

export type PocketBrainSessionResult = {
  view: PocketBrainView;
};

export function sessionPocketBrainView(input?: {
  tenantId?: string;
  universeId?: string;
  deviceScope?: string;
}): PocketBrainView {
  return listPocketBrainView({
    tenantId: input?.tenantId,
    universeId: input?.universeId,
    deviceScope: input?.deviceScope,
  });
}

export function bindSessionPocketBrainFixture(input?: {
  tenantId?: string;
  universeId?: string;
  deviceScope?: string;
}): PocketBrainSessionResult {
  const tenantId = (input?.tenantId ?? DEFAULT_DEMO_POCKET_TENANT_ID).trim();
  const universeId = (input?.universeId ?? DEFAULT_DEMO_POCKET_UNIVERSE_ID).trim();
  const deviceScope = (input?.deviceScope ?? DEFAULT_DEMO_POCKET_DEVICE_SCOPE).trim();
  bindPocketBrainFixture({ tenantId, universeId, deviceScope });
  return { view: listPocketBrainView({ tenantId, universeId, deviceScope }) };
}

export function clearSessionPocketBrainFixture(): PocketBrainSessionResult {
  clearPocketBrainFixture();
  return { view: listPocketBrainView() };
}