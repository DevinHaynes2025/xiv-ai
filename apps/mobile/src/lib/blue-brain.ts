import {
  bindBlueBrainFixture,
  clearBlueBrainFixture,
  listBlueBrainView,
  type BlueBrainPolicyGateState,
  type BlueBrainView,
} from '@/lib/ai';

/**
 * US-BB-01 -- mobile helper for Blue Brain product surface (Executive / Business).
 * LOCAL/SIMULATION fixture presenter. WAITING_DATA when unbound.
 * WAITING_PROVIDER / WAITING_SYNC when bound without live sync proof.
 * GATE_DENIED when policy gate denies. Never fabricates neural/ADC metrics.
 * L4 false; productionMutation false; mayEnterGlobalBrain false; liveCloudSyncClaimed false.
 */

export const DEFAULT_DEMO_BLUE_UNIVERSE_ID = 'demo-blue-brain';
export const DEFAULT_DEMO_BLUE_TENANT_ID = 'xiv';
export const DEFAULT_DEMO_BLUE_DEVICE_SCOPE = 'asus-local';

export type BlueBrainSessionResult = {
  view: BlueBrainView;
};

export function sessionBlueBrainView(input?: {
  tenantId?: string;
  universeId?: string;
  deviceScope?: string;
  policyGate?: BlueBrainPolicyGateState;
}): BlueBrainView {
  return listBlueBrainView({
    tenantId: input?.tenantId,
    universeId: input?.universeId,
    deviceScope: input?.deviceScope,
    policyGate: input?.policyGate,
  });
}

export function bindSessionBlueBrainFixture(input?: {
  tenantId?: string;
  universeId?: string;
  deviceScope?: string;
  policyGate?: BlueBrainPolicyGateState;
}): BlueBrainSessionResult {
  const tenantId = (input?.tenantId ?? DEFAULT_DEMO_BLUE_TENANT_ID).trim();
  const universeId = (input?.universeId ?? DEFAULT_DEMO_BLUE_UNIVERSE_ID).trim();
  const deviceScope = (input?.deviceScope ?? DEFAULT_DEMO_BLUE_DEVICE_SCOPE).trim();
  const policyGate = input?.policyGate ?? 'ALLOWED';
  bindBlueBrainFixture({ tenantId, universeId, deviceScope, policyGate });
  return { view: listBlueBrainView({ tenantId, universeId, deviceScope, policyGate }) };
}

export function clearSessionBlueBrainFixture(): BlueBrainSessionResult {
  clearBlueBrainFixture();
  return { view: listBlueBrainView() };
}