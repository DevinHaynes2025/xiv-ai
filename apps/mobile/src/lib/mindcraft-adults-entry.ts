import {
  acknowledgeMindcraftAdultsEntry,
  attemptMindcraftRoomEntry,
  bindMindcraftAdultsEntryFixture,
  clearMindcraftAdultsEntryFixture,
  clearMindcraftPolicyDenialStubs,
  listMindcraftAdultsEntryView,
  probeMindcraftPolicyDenialStubs,
  selectMindcraftRoom,
  type MindcraftAckFlags,
  type MindcraftAdultsEntryView,
  type MindcraftRoomId,
} from '@/lib/ai';

/**
 * US-MC-01 -- mobile helper for Adult Mindcraft gated room entry.
 * LOCAL/SIMULATION stubs. WAITING_DATA when unbound.
 * 18+ / ToS / waiver / anti-predator acknowledgments are SIMULATION flags.
 * Never claims live legal waiver, live age verification, or live Mindcraft world. L4 false.
 */

export const DEFAULT_DEMO_MC_UNIVERSE_ID = 'demo-mindcraft-adults-entry';
export const DEFAULT_DEMO_MC_TENANT_ID = 'xiv';

export type MindcraftAdultsEntrySessionResult = {
  view: MindcraftAdultsEntryView;
};

export function sessionMindcraftAdultsEntryView(input?: {
  tenantId?: string;
  universeId?: string;
  forceDenied?: boolean;
}): MindcraftAdultsEntryView {
  return listMindcraftAdultsEntryView({
    tenantId: input?.tenantId,
    universeId: input?.universeId,
    forceDenied: input?.forceDenied,
  });
}

export function bindSessionMindcraftAdultsEntryFixture(input?: {
  tenantId?: string;
  universeId?: string;
  selectedRoomId?: MindcraftRoomId | null;
  forceDenied?: boolean;
  healthEntryLinesPresent?: boolean;
  cultureEntryLinesPresent?: boolean;
}): MindcraftAdultsEntrySessionResult {
  const tenantId = (input?.tenantId ?? DEFAULT_DEMO_MC_TENANT_ID).trim();
  const universeId = (input?.universeId ?? DEFAULT_DEMO_MC_UNIVERSE_ID).trim();
  bindMindcraftAdultsEntryFixture({
    tenantId,
    universeId,
    selectedRoomId: input?.selectedRoomId,
    forceDenied: input?.forceDenied,
    healthEntryLinesPresent: input?.healthEntryLinesPresent,
    cultureEntryLinesPresent: input?.cultureEntryLinesPresent,
  });
  return {
    view: listMindcraftAdultsEntryView({
      tenantId,
      universeId,
      forceDenied: input?.forceDenied,
    }),
  };
}

export function clearSessionMindcraftAdultsEntryFixture(): MindcraftAdultsEntrySessionResult {
  clearMindcraftAdultsEntryFixture();
  return { view: listMindcraftAdultsEntryView() };
}

export function acknowledgeSessionMindcraftAdultsEntry(
  input: Partial<
    Pick<
      MindcraftAckFlags,
      | 'age18PlusAcknowledged'
      | 'tosRulesAcknowledged'
      | 'waiverAcknowledged'
      | 'antiPredatorAcknowledged'
      | 'antiBullyAcknowledged'
      | 'nonSexualCulturalAcknowledged'
    >
  >,
  scope?: { tenantId?: string; universeId?: string },
): MindcraftAdultsEntrySessionResult {
  acknowledgeMindcraftAdultsEntry(input);
  return {
    view: listMindcraftAdultsEntryView({
      tenantId: scope?.tenantId ?? DEFAULT_DEMO_MC_TENANT_ID,
      universeId: scope?.universeId ?? DEFAULT_DEMO_MC_UNIVERSE_ID,
    }),
  };
}

export function selectSessionMindcraftRoom(
  roomId: MindcraftRoomId,
  scope?: { tenantId?: string; universeId?: string },
): MindcraftAdultsEntrySessionResult {
  selectMindcraftRoom(roomId);
  return {
    view: listMindcraftAdultsEntryView({
      tenantId: scope?.tenantId ?? DEFAULT_DEMO_MC_TENANT_ID,
      universeId: scope?.universeId ?? DEFAULT_DEMO_MC_UNIVERSE_ID,
    }),
  };
}

export function attemptSessionMindcraftRoomEntry(input?: {
  roomId?: MindcraftRoomId;
  tenantId?: string;
  universeId?: string;
}): MindcraftAdultsEntrySessionResult & { allowed: boolean } {
  const result = attemptMindcraftRoomEntry({ roomId: input?.roomId });
  const view = listMindcraftAdultsEntryView({
    tenantId: input?.tenantId ?? DEFAULT_DEMO_MC_TENANT_ID,
    universeId: input?.universeId ?? DEFAULT_DEMO_MC_UNIVERSE_ID,
  });
  return { view, allowed: result.allowed };
}

export function probeSessionMindcraftPolicyDenials(scope?: {
  tenantId?: string;
  universeId?: string;
}): MindcraftAdultsEntrySessionResult {
  probeMindcraftPolicyDenialStubs();
  return {
    view: listMindcraftAdultsEntryView({
      tenantId: scope?.tenantId ?? DEFAULT_DEMO_MC_TENANT_ID,
      universeId: scope?.universeId ?? DEFAULT_DEMO_MC_UNIVERSE_ID,
    }),
  };
}

export function clearSessionMindcraftPolicyDenials(scope?: {
  tenantId?: string;
  universeId?: string;
}): MindcraftAdultsEntrySessionResult {
  clearMindcraftPolicyDenialStubs();
  return {
    view: listMindcraftAdultsEntryView({
      tenantId: scope?.tenantId ?? DEFAULT_DEMO_MC_TENANT_ID,
      universeId: scope?.universeId ?? DEFAULT_DEMO_MC_UNIVERSE_ID,
    }),
  };
}
