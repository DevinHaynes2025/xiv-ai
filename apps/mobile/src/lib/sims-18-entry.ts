import {
  acknowledgeSims18Entry,
  attemptSims18Entry,
  bindSims18EntryFixture,
  clearSims18EntryFixture,
  listSims18EntryView,
  selectSimsWorld,
  type Sims18AckFlags,
  type Sims18EntryView,
} from '@/lib/ai';

/**
 * US-SIM-01 -- mobile helper for Sims 18+ entry product surface.
 * LOCAL/SIMULATION stubs. WAITING_DATA when unbound.
 * Portal/wormhole labels are metaphors only. 18+ ack is SIMULATION.
 * Never claims live sim world, live age verification, or live portal physics. L4 false.
 */

export const DEFAULT_DEMO_SIM_UNIVERSE_ID = 'demo-sims-18-entry';
export const DEFAULT_DEMO_SIM_TENANT_ID = 'xiv';

export type Sims18EntrySessionResult = {
  view: Sims18EntryView;
};

export function sessionSims18EntryView(input?: {
  tenantId?: string;
  universeId?: string;
  forceDenied?: boolean;
}): Sims18EntryView {
  return listSims18EntryView({
    tenantId: input?.tenantId,
    universeId: input?.universeId,
    forceDenied: input?.forceDenied,
  });
}

export function bindSessionSims18EntryFixture(input?: {
  tenantId?: string;
  universeId?: string;
  selectedWorldId?: string | null;
  forceDenied?: boolean;
}): Sims18EntrySessionResult {
  const tenantId = (input?.tenantId ?? DEFAULT_DEMO_SIM_TENANT_ID).trim();
  const universeId = (input?.universeId ?? DEFAULT_DEMO_SIM_UNIVERSE_ID).trim();
  bindSims18EntryFixture({
    tenantId,
    universeId,
    selectedWorldId: input?.selectedWorldId,
    forceDenied: input?.forceDenied,
  });
  return { view: listSims18EntryView({ tenantId, universeId, forceDenied: input?.forceDenied }) };
}

export function clearSessionSims18EntryFixture(): Sims18EntrySessionResult {
  clearSims18EntryFixture();
  return { view: listSims18EntryView() };
}

export function acknowledgeSessionSims18Entry(
  input: Partial<Pick<Sims18AckFlags, 'age18PlusAcknowledged' | 'sandboxRulesAcknowledged'>>,
  scope?: { tenantId?: string; universeId?: string },
): Sims18EntrySessionResult {
  acknowledgeSims18Entry(input);
  return {
    view: listSims18EntryView({
      tenantId: scope?.tenantId ?? DEFAULT_DEMO_SIM_TENANT_ID,
      universeId: scope?.universeId ?? DEFAULT_DEMO_SIM_UNIVERSE_ID,
    }),
  };
}

export function selectSessionSimsWorld(
  worldId: string,
  scope?: { tenantId?: string; universeId?: string },
): Sims18EntrySessionResult {
  selectSimsWorld(worldId);
  return {
    view: listSims18EntryView({
      tenantId: scope?.tenantId ?? DEFAULT_DEMO_SIM_TENANT_ID,
      universeId: scope?.universeId ?? DEFAULT_DEMO_SIM_UNIVERSE_ID,
    }),
  };
}

export function attemptSessionSims18Entry(input?: {
  worldId?: string;
  tenantId?: string;
  universeId?: string;
}): Sims18EntrySessionResult & { allowed: boolean } {
  const result = attemptSims18Entry({ worldId: input?.worldId });
  const view = listSims18EntryView({
    tenantId: input?.tenantId ?? DEFAULT_DEMO_SIM_TENANT_ID,
    universeId: input?.universeId ?? DEFAULT_DEMO_SIM_UNIVERSE_ID,
  });
  return { view, allowed: result.allowed };
}
