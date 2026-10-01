export type XviScenarioHandoffRunMode =
  | "ONLINE_GOVERNED"
  | "OFFLINE_GOVERNED"
  | "LOCAL_ONLY";

export type XviScenarioHandoffDestination =
  | "UNIVERSE_SCENARIO_DETAIL"
  | "NEEDS_YOU_SCENARIO_ASSUMPTIONS"
  | "NEEDS_YOU_SCENARIO_EVIDENCE";

export type XviScenarioHandoffReason =
  | "CLEAR_SCENARIO_EXPLORATION"
  | "ASSUMPTION_REVIEW_REQUIRED"
  | "EVIDENCE_REVIEW_REQUIRED";

export type XviScenarioHandoffStatus =
  | "VALID"
  | "EXPIRED"
  | "REPLAYED"
  | "REVOKED";

export interface XviScenarioHandoffUse {
  readonly handoffId: string;
  readonly replayKey: string;
  readonly tenantId: string;
  readonly userScopeId: string;
  readonly consumedAt: string;
}

export interface XviScenarioReviewHandoffInput {
  readonly handoffId: string;
  readonly scenarioSetId: string;
  readonly tenantId: string;
  readonly userScopeId: string;
  readonly runMode: XviScenarioHandoffRunMode;
  readonly destination: XviScenarioHandoffDestination;
  readonly reason: XviScenarioHandoffReason;
  readonly replayKey: string;
  readonly issuedAt: string;
  readonly expiresAt: string;
  readonly priorUses: readonly XviScenarioHandoffUse[];
  readonly revokedHandoffIds: readonly string[];
  readonly zeroSecretContext: true;
  readonly safeReadOnly: true;
  readonly requiresUserGesture: true;
  readonly canAutoNavigate: false;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

export interface XviScenarioReviewHandoffReceipt {
  readonly schemaVersion: "xvi-scenario-review-handoff-v1";
  readonly handoffId: string;
  readonly scenarioSetId: string;
  readonly tenantId: string;
  readonly userScopeId: string;
  readonly runMode: XviScenarioHandoffRunMode;
  readonly destination: XviScenarioHandoffDestination;
  readonly reason: XviScenarioHandoffReason;
  readonly status: XviScenarioHandoffStatus;
  readonly replayDetected: boolean;
  readonly revoked: boolean;
  readonly expired: boolean;
  readonly leaseDurationMs: number;
  readonly expiresAt: string;
  readonly canPresentDestination: boolean;
  readonly requiresHumanReview: boolean;
  readonly requiresRenewal: boolean;
  readonly quarantineHandoff: boolean;
  readonly zeroSecretContext: true;
  readonly safeReadOnly: true;
  readonly requiresUserGesture: true;
  readonly canAutoNavigate: false;
  readonly canConsumeReplayKey: false;
  readonly navigationAuthority: false;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

const PLAIN = Object.getPrototypeOf({});
const MAX_TTL_MS = 15 * 60 * 1000;
const MODES = new Set<XviScenarioHandoffRunMode>([
  "ONLINE_GOVERNED",
  "OFFLINE_GOVERNED",
  "LOCAL_ONLY",
]);
const DESTINATIONS = new Set<XviScenarioHandoffDestination>([
  "UNIVERSE_SCENARIO_DETAIL",
  "NEEDS_YOU_SCENARIO_ASSUMPTIONS",
  "NEEDS_YOU_SCENARIO_EVIDENCE",
]);
const REASONS = new Set<XviScenarioHandoffReason>([
  "CLEAR_SCENARIO_EXPLORATION",
  "ASSUMPTION_REVIEW_REQUIRED",
  "EVIDENCE_REVIEW_REQUIRED",
]);

function plain(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Object.getPrototypeOf(value) !== PLAIN) {
    throw new Error(`${label}_PLAIN_REQUIRED`);
  }
  if (Object.getOwnPropertySymbols(value).length) {
    throw new Error(`${label}_SYMBOLS_FORBIDDEN`);
  }
  for (const key of Object.keys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || descriptor.get || descriptor.set) {
      throw new Error(`${label}_ACCESSOR_FORBIDDEN`);
    }
  }
}

function exact(value: Record<string, unknown>, keys: readonly string[], label: string): void {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    throw new Error(`${label}_SCHEMA_MISMATCH`);
  }
}

function iso(value: string, label: string): void {
  if (typeof value !== "string" || !value.includes("T") || Number.isNaN(Date.parse(value))) {
    throw new Error(`${label}_INVALID`);
  }
}

function sha256(value: string, label: string): void {
  if (!/^[a-f0-9]{64}$/.test(value)) {
    throw new Error(`${label}_INVALID`);
  }
}

function id(value: string, prefix: string, label: string): void {
  if (typeof value !== "string" || !value.startsWith(prefix) || value.length > 240) {
    throw new Error(`${label}_INVALID`);
  }
}

function validateDestinationReason(
  destination: XviScenarioHandoffDestination,
  reason: XviScenarioHandoffReason
): void {
  const expected =
    reason === "CLEAR_SCENARIO_EXPLORATION"
      ? "UNIVERSE_SCENARIO_DETAIL"
      : reason === "ASSUMPTION_REVIEW_REQUIRED"
        ? "NEEDS_YOU_SCENARIO_ASSUMPTIONS"
        : "NEEDS_YOU_SCENARIO_EVIDENCE";
  if (destination !== expected) {
    throw new Error("SCENARIO_HANDOFF_DESTINATION_REASON_MISMATCH");
  }
}

export function validateScenarioReviewHandoffInput(
  input: unknown
): Readonly<XviScenarioReviewHandoffInput> {
  plain(input, "SCENARIO_HANDOFF");
  exact(
    input,
    [
      "handoffId",
      "scenarioSetId",
      "tenantId",
      "userScopeId",
      "runMode",
      "destination",
      "reason",
      "replayKey",
      "issuedAt",
      "expiresAt",
      "priorUses",
      "revokedHandoffIds",
      "zeroSecretContext",
      "safeReadOnly",
      "requiresUserGesture",
      "canAutoNavigate",
      "executionAuthority",
      "mutationAuthority",
      "productionAuthority",
    ],
    "SCENARIO_HANDOFF"
  );

  const request = input as unknown as XviScenarioReviewHandoffInput;
  id(request.handoffId, "scenario-handoff:", "HANDOFF_ID");
  id(request.scenarioSetId, "scenario-set:", "SCENARIO_SET_ID");
  id(request.tenantId, "tenant:", "TENANT_ID");
  id(request.userScopeId, "user-scope:", "USER_SCOPE_ID");

  if (!MODES.has(request.runMode)) throw new Error("SCENARIO_HANDOFF_MODE_INVALID");
  if (!DESTINATIONS.has(request.destination)) throw new Error("SCENARIO_HANDOFF_DESTINATION_INVALID");
  if (!REASONS.has(request.reason)) throw new Error("SCENARIO_HANDOFF_REASON_INVALID");
  validateDestinationReason(request.destination, request.reason);

  sha256(request.replayKey, "REPLAY_KEY");
  iso(request.issuedAt, "ISSUED_AT");
  iso(request.expiresAt, "EXPIRES_AT");
  const leaseDurationMs = Date.parse(request.expiresAt) - Date.parse(request.issuedAt);
  if (leaseDurationMs <= 0 || leaseDurationMs > MAX_TTL_MS) {
    throw new Error("SCENARIO_HANDOFF_TTL_INVALID");
  }

  if (!Array.isArray(request.priorUses) || request.priorUses.length > 10_000) {
    throw new Error("SCENARIO_HANDOFF_PRIOR_USE_COUNT_INVALID");
  }
  const useKeys = new Set<string>();
  const priorUses = request.priorUses.map((raw) => {
    plain(raw, "SCENARIO_HANDOFF_PRIOR_USE");
    exact(
      raw,
      ["handoffId", "replayKey", "tenantId", "userScopeId", "consumedAt"],
      "SCENARIO_HANDOFF_PRIOR_USE"
    );
    const use = raw as unknown as XviScenarioHandoffUse;
    id(use.handoffId, "scenario-handoff:", "PRIOR_HANDOFF_ID");
    sha256(use.replayKey, "PRIOR_REPLAY_KEY");
    id(use.tenantId, "tenant:", "PRIOR_TENANT_ID");
    id(use.userScopeId, "user-scope:", "PRIOR_USER_SCOPE_ID");
    iso(use.consumedAt, "PRIOR_CONSUMED_AT");
    const uniqueKey = `${use.tenantId}\u0000${use.userScopeId}\u0000${use.replayKey}`;
    if (useKeys.has(uniqueKey)) throw new Error("SCENARIO_HANDOFF_PRIOR_USE_DUPLICATE");
    useKeys.add(uniqueKey);
    if (
      use.handoffId === request.handoffId &&
      (use.tenantId !== request.tenantId || use.userScopeId !== request.userScopeId)
    ) {
      throw new Error("SCENARIO_HANDOFF_SCOPE_COLLISION");
    }
    return Object.freeze({ ...use });
  });

  if (!Array.isArray(request.revokedHandoffIds) || request.revokedHandoffIds.length > 10_000) {
    throw new Error("SCENARIO_HANDOFF_REVOCATION_COUNT_INVALID");
  }
  const revokedSeen = new Set<string>();
  const revokedHandoffIds = request.revokedHandoffIds.map((value) => {
    id(value, "scenario-handoff:", "REVOKED_HANDOFF_ID");
    if (revokedSeen.has(value)) throw new Error("SCENARIO_HANDOFF_REVOCATION_DUPLICATE");
    revokedSeen.add(value);
    return value;
  });

  if (
    request.zeroSecretContext !== true ||
    request.safeReadOnly !== true ||
    request.requiresUserGesture !== true ||
    request.canAutoNavigate !== false ||
    request.executionAuthority !== false ||
    request.mutationAuthority !== false ||
    request.productionAuthority !== false
  ) {
    throw new Error("SCENARIO_HANDOFF_AUTHORITY_VIOLATION");
  }

  return Object.freeze({
    ...request,
    priorUses: Object.freeze(priorUses),
    revokedHandoffIds: Object.freeze(revokedHandoffIds),
  });
}

export function evaluateScenarioReviewHandoff(
  input: unknown,
  now: string
): Readonly<XviScenarioReviewHandoffReceipt> {
  const request = validateScenarioReviewHandoffInput(input);
  iso(now, "NOW");
  const nowMs = Date.parse(now);
  const issuedAtMs = Date.parse(request.issuedAt);
  const expiresAtMs = Date.parse(request.expiresAt);

  if (issuedAtMs > nowMs) throw new Error("SCENARIO_HANDOFF_ISSUED_IN_FUTURE");
  for (const use of request.priorUses) {
    if (Date.parse(use.consumedAt) > nowMs) {
      throw new Error("SCENARIO_HANDOFF_PRIOR_USE_IN_FUTURE");
    }
  }

  const scopedUses = request.priorUses.filter(
    (use) => use.tenantId === request.tenantId && use.userScopeId === request.userScopeId
  );
  const replayDetected = scopedUses.some(
    (use) => use.replayKey === request.replayKey || use.handoffId === request.handoffId
  );
  const revoked = request.revokedHandoffIds.includes(request.handoffId);
  const expired = nowMs >= expiresAtMs;

  let status: XviScenarioHandoffStatus = "VALID";
  if (revoked) status = "REVOKED";
  else if (replayDetected) status = "REPLAYED";
  else if (expired) status = "EXPIRED";

  const requiresDestinationReview = request.destination !== "UNIVERSE_SCENARIO_DETAIL";
  const quarantineHandoff = status === "REPLAYED" || status === "REVOKED";

  return Object.freeze({
    schemaVersion: "xvi-scenario-review-handoff-v1",
    handoffId: request.handoffId,
    scenarioSetId: request.scenarioSetId,
    tenantId: request.tenantId,
    userScopeId: request.userScopeId,
    runMode: request.runMode,
    destination: request.destination,
    reason: request.reason,
    status,
    replayDetected,
    revoked,
    expired,
    leaseDurationMs: expiresAtMs - issuedAtMs,
    expiresAt: request.expiresAt,
    canPresentDestination: status === "VALID",
    requiresHumanReview: requiresDestinationReview || quarantineHandoff,
    requiresRenewal: status === "EXPIRED",
    quarantineHandoff,
    zeroSecretContext: true,
    safeReadOnly: true,
    requiresUserGesture: true,
    canAutoNavigate: false,
    canConsumeReplayKey: false,
    navigationAuthority: false,
    executionAuthority: false,
    mutationAuthority: false,
    productionAuthority: false,
  });
}