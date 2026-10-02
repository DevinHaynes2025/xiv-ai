
import { createHash } from "node:crypto";

export type XviAtomicRunMode =
  | "ONLINE_GOVERNED"
  | "OFFLINE_GOVERNED"
  | "LOCAL_ONLY";

export type XviAtomicDirection =
  | "POSITIVE"
  | "NEGATIVE";

export type XviAtomicIntent =
  | "ANALYZE"
  | "SIMULATE"
  | "SUMMARIZE"
  | "PROPOSE";

export interface XviAtomicCapabilityLease {
  readonly leaseId: string;
  readonly tenantId: string;
  readonly userScopeId: string;
  readonly issuedAt: string;
  readonly expiresAt: string;
  readonly allowedIntents: readonly XviAtomicIntent[];
  readonly zeroSecretContext: true;
  readonly safeReadOnly: true;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

export interface XviAtomicAgentFabricInput {
  readonly fabricId: string;
  readonly universeId: string;
  readonly tenantId: string;
  readonly userScopeId: string;
  readonly runMode: XviAtomicRunMode;
  readonly direction: XviAtomicDirection;
  readonly startLayer: number;
  readonly requestedLayers: number;
  readonly atomBudgetPerLayer: number;
  readonly intent: XviAtomicIntent;
  readonly lease: XviAtomicCapabilityLease;
  readonly seedDigest: string;
  readonly zeroSecretContext: true;
  readonly safeReadOnly: true;
  readonly canSpawnExternalProcess: false;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

export interface XviAtomicLayerReceipt {
  readonly layerIndex: number;
  readonly signedCoordinate: number;
  readonly atomBudget: number;
  readonly intent: XviAtomicIntent;
  readonly layerDigest: string;
}

export interface XviAtomicAgentFabricReceipt {
  readonly schemaVersion: "xvi-atomic-agent-fabric-v1";
  readonly fabricId: string;
  readonly universeId: string;
  readonly tenantId: string;
  readonly userScopeId: string;
  readonly runMode: XviAtomicRunMode;
  readonly direction: XviAtomicDirection;
  readonly requestedLayers: number;
  readonly startLayer: number;
  readonly endLayer: number;
  readonly totalAtomBudget: number;
  readonly layers: readonly XviAtomicLayerReceipt[];
  readonly nextWindowRequired: boolean;
  readonly maxLogicalLayers: 1000;
  readonly maxAtomsPerLayer: 10000;
  readonly zeroSecretContext: true;
  readonly safeReadOnly: true;
  readonly requiresUserGestureForExternalAction: true;
  readonly canSpawnExternalProcess: false;
  readonly navigationAuthority: false;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

const PLAIN = Object.getPrototypeOf({});
const MAX_LOGICAL_LAYERS = 1000;
const MAX_ATOMS_PER_LAYER = 10_000;
const MAX_TOTAL_ATOMS = 1_000_000;
const MAX_LEASE_MS = 15 * 60 * 1000;
const MODES = new Set<XviAtomicRunMode>([
  "ONLINE_GOVERNED",
  "OFFLINE_GOVERNED",
  "LOCAL_ONLY",
]);
const DIRECTIONS = new Set<XviAtomicDirection>([
  "POSITIVE",
  "NEGATIVE",
]);
const INTENTS = new Set<XviAtomicIntent>([
  "ANALYZE",
  "SIMULATE",
  "SUMMARIZE",
  "PROPOSE",
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

function id(value: string, prefix: string, label: string): void {
  if (typeof value !== "string" || !value.startsWith(prefix) || value.length > 240) {
    throw new Error(`${label}_INVALID`);
  }
}

function hash(value: string, label: string): void {
  if (!/^[a-f0-9]{64}$/.test(value)) {
    throw new Error(`${label}_INVALID`);
  }
}

function safeInt(value: number, min: number, max: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new Error(`${label}_INVALID`);
  }
}

function validateLease(input: unknown, now: string): Readonly<XviAtomicCapabilityLease> {
  plain(input, "ATOMIC_LEASE");
  exact(
    input,
    [
      "leaseId",
      "tenantId",
      "userScopeId",
      "issuedAt",
      "expiresAt",
      "allowedIntents",
      "zeroSecretContext",
      "safeReadOnly",
      "executionAuthority",
      "mutationAuthority",
      "productionAuthority",
    ],
    "ATOMIC_LEASE"
  );

  const lease = input as unknown as XviAtomicCapabilityLease;
  id(lease.leaseId, "atomic-lease:", "ATOMIC_LEASE_ID");
  id(lease.tenantId, "tenant:", "ATOMIC_LEASE_TENANT");
  id(lease.userScopeId, "user-scope:", "ATOMIC_LEASE_USER_SCOPE");
  iso(lease.issuedAt, "ATOMIC_LEASE_ISSUED_AT");
  iso(lease.expiresAt, "ATOMIC_LEASE_EXPIRES_AT");
  iso(now, "ATOMIC_NOW");

  const nowMs = Date.parse(now);
  const issuedAtMs = Date.parse(lease.issuedAt);
  const expiresAtMs = Date.parse(lease.expiresAt);

  if (issuedAtMs > nowMs) throw new Error("ATOMIC_LEASE_ISSUED_IN_FUTURE");
  if (expiresAtMs <= nowMs) throw new Error("ATOMIC_LEASE_EXPIRED");
  if (expiresAtMs <= issuedAtMs || expiresAtMs - issuedAtMs > MAX_LEASE_MS) {
    throw new Error("ATOMIC_LEASE_TTL_INVALID");
  }

  if (!Array.isArray(lease.allowedIntents) || lease.allowedIntents.length < 1 || lease.allowedIntents.length > 4) {
    throw new Error("ATOMIC_LEASE_INTENTS_INVALID");
  }
  const seen = new Set<XviAtomicIntent>();
  for (const intent of lease.allowedIntents) {
    if (!INTENTS.has(intent) || seen.has(intent)) {
      throw new Error("ATOMIC_LEASE_INTENTS_INVALID");
    }
    seen.add(intent);
  }

  if (
    lease.zeroSecretContext !== true ||
    lease.safeReadOnly !== true ||
    lease.executionAuthority !== false ||
    lease.mutationAuthority !== false ||
    lease.productionAuthority !== false
  ) {
    throw new Error("ATOMIC_LEASE_AUTHORITY_VIOLATION");
  }

  return Object.freeze({
    ...lease,
    allowedIntents: Object.freeze([...lease.allowedIntents]),
  });
}

function digestLayer(
  previousDigest: string,
  fabricId: string,
  tenantId: string,
  userScopeId: string,
  runMode: XviAtomicRunMode,
  direction: XviAtomicDirection,
  layerIndex: number,
  signedCoordinate: number,
  atomBudget: number,
  intent: XviAtomicIntent
): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        previousDigest,
        fabricId,
        tenantId,
        userScopeId,
        runMode,
        direction,
        layerIndex,
        signedCoordinate,
        atomBudget,
        intent,
      }),
      "utf8"
    )
    .digest("hex");
}

export function planAtomicAgentFabric(
  input: unknown,
  now: string
): Readonly<XviAtomicAgentFabricReceipt> {
  plain(input, "ATOMIC_FABRIC");
  exact(
    input,
    [
      "fabricId",
      "universeId",
      "tenantId",
      "userScopeId",
      "runMode",
      "direction",
      "startLayer",
      "requestedLayers",
      "atomBudgetPerLayer",
      "intent",
      "lease",
      "seedDigest",
      "zeroSecretContext",
      "safeReadOnly",
      "canSpawnExternalProcess",
      "executionAuthority",
      "mutationAuthority",
      "productionAuthority",
    ],
    "ATOMIC_FABRIC"
  );

  const request = input as unknown as XviAtomicAgentFabricInput;
  id(request.fabricId, "atomic-fabric:", "ATOMIC_FABRIC_ID");
  id(request.universeId, "universe:", "ATOMIC_UNIVERSE_ID");
  id(request.tenantId, "tenant:", "ATOMIC_TENANT_ID");
  id(request.userScopeId, "user-scope:", "ATOMIC_USER_SCOPE_ID");

  if (!MODES.has(request.runMode)) throw new Error("ATOMIC_RUN_MODE_INVALID");
  if (!DIRECTIONS.has(request.direction)) throw new Error("ATOMIC_DIRECTION_INVALID");
  if (!INTENTS.has(request.intent)) throw new Error("ATOMIC_INTENT_INVALID");

  safeInt(request.startLayer, 0, MAX_LOGICAL_LAYERS - 1, "ATOMIC_START_LAYER");
  safeInt(request.requestedLayers, 1, MAX_LOGICAL_LAYERS, "ATOMIC_REQUESTED_LAYERS");
  safeInt(request.atomBudgetPerLayer, 1, MAX_ATOMS_PER_LAYER, "ATOMIC_LAYER_BUDGET");
  hash(request.seedDigest, "ATOMIC_SEED_DIGEST");

  if (request.startLayer + request.requestedLayers > MAX_LOGICAL_LAYERS) {
    throw new Error("ATOMIC_LAYER_WINDOW_EXCEEDS_LIMIT");
  }
  const totalAtomBudget = request.requestedLayers * request.atomBudgetPerLayer;
  if (!Number.isSafeInteger(totalAtomBudget) || totalAtomBudget > MAX_TOTAL_ATOMS) {
    throw new Error("ATOMIC_TOTAL_BUDGET_EXCEEDS_LIMIT");
  }

  if (
    request.zeroSecretContext !== true ||
    request.safeReadOnly !== true ||
    request.canSpawnExternalProcess !== false ||
    request.executionAuthority !== false ||
    request.mutationAuthority !== false ||
    request.productionAuthority !== false
  ) {
    throw new Error("ATOMIC_FABRIC_AUTHORITY_VIOLATION");
  }

  const lease = validateLease(request.lease, now);
  if (lease.tenantId !== request.tenantId || lease.userScopeId !== request.userScopeId) {
    throw new Error("ATOMIC_LEASE_SCOPE_MISMATCH");
  }
  if (!lease.allowedIntents.includes(request.intent)) {
    throw new Error("ATOMIC_LEASE_INTENT_NOT_AUTHORIZED");
  }

  const layers: XviAtomicLayerReceipt[] = [];
  let previousDigest = request.seedDigest;

  for (let offset = 0; offset < request.requestedLayers; offset += 1) {
    const layerIndex = request.startLayer + offset;
    const signedCoordinate =
      request.direction === "POSITIVE"
        ? layerIndex + 1
        : -(layerIndex + 1);

    const layerDigest = digestLayer(
      previousDigest,
      request.fabricId,
      request.tenantId,
      request.userScopeId,
      request.runMode,
      request.direction,
      layerIndex,
      signedCoordinate,
      request.atomBudgetPerLayer,
      request.intent
    );

    layers.push(Object.freeze({
      layerIndex,
      signedCoordinate,
      atomBudget: request.atomBudgetPerLayer,
      intent: request.intent,
      layerDigest,
    }));

    previousDigest = layerDigest;
  }

  const endLayer = request.startLayer + request.requestedLayers - 1;

  return Object.freeze({
    schemaVersion: "xvi-atomic-agent-fabric-v1",
    fabricId: request.fabricId,
    universeId: request.universeId,
    tenantId: request.tenantId,
    userScopeId: request.userScopeId,
    runMode: request.runMode,
    direction: request.direction,
    requestedLayers: request.requestedLayers,
    startLayer: request.startLayer,
    endLayer,
    totalAtomBudget,
    layers: Object.freeze(layers),
    nextWindowRequired: endLayer < MAX_LOGICAL_LAYERS - 1,
    maxLogicalLayers: MAX_LOGICAL_LAYERS,
    maxAtomsPerLayer: MAX_ATOMS_PER_LAYER,
    zeroSecretContext: true,
    safeReadOnly: true,
    requiresUserGestureForExternalAction: true,
    canSpawnExternalProcess: false,
    navigationAuthority: false,
    executionAuthority: false,
    mutationAuthority: false,
    productionAuthority: false,
  });
}
