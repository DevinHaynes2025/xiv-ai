import {
  createHash,
  createPublicKey,
  verify as verifySignature,
  type KeyObject,
} from "node:crypto";
import {
  evaluateScenarioReviewHandoffHashEnvelope,
  type XviScenarioReviewHandoffHashEnvelopeInput,
  type XviScenarioHandoffSignatureAlgorithm,
} from "./xvi-scenario-review-handoff-hash-envelope";

export type XviScenarioPublicKeyStatus = "ACTIVE" | "REVOKED";

export interface XviScenarioPublicKeyRecord {
  readonly publicKeyId: string;
  readonly algorithm: XviScenarioHandoffSignatureAlgorithm;
  readonly publicKeyPem: string;
  readonly status: XviScenarioPublicKeyStatus;
  readonly notBefore: string;
  readonly notAfter: string;
}

export interface XviScenarioPublicKeyRegistrySnapshot {
  readonly schemaVersion: "xvi-scenario-public-key-registry-v1";
  readonly registryVersion: number;
  readonly keys: readonly XviScenarioPublicKeyRecord[];
  readonly zeroSecretContext: true;
}

export interface XviScenarioIndependentSignatureVerificationInput {
  readonly envelope: XviScenarioReviewHandoffHashEnvelopeInput;
  readonly registry: XviScenarioPublicKeyRegistrySnapshot;
  readonly minimumAcceptedRegistryVersion: number;
  readonly signatureBase64: string;
  readonly zeroSecretContext: true;
  readonly safeReadOnly: true;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

export type XviScenarioIndependentSignatureVerificationStatus =
  | "VERIFIED"
  | "ENVELOPE_QUARANTINED"
  | "REGISTRY_ROLLBACK_DETECTED"
  | "UNKNOWN_KEY"
  | "REVOKED_KEY"
  | "KEY_NOT_YET_VALID"
  | "KEY_EXPIRED"
  | "SIGNATURE_HASH_MISMATCH"
  | "SIGNATURE_INVALID";

export interface XviScenarioIndependentSignatureVerificationReceipt {
  readonly schemaVersion: "xvi-scenario-independent-signature-verification-v1";
  readonly envelopeId: string;
  readonly handoffId: string;
  readonly scenarioSetId: string;
  readonly tenantId: string;
  readonly userScopeId: string;
  readonly runMode: "ONLINE_GOVERNED" | "OFFLINE_GOVERNED" | "LOCAL_ONLY";
  readonly publicKeyId: string;
  readonly algorithm: XviScenarioHandoffSignatureAlgorithm;
  readonly registryVersion: number;
  readonly minimumAcceptedRegistryVersion: number;
  readonly status: XviScenarioIndependentSignatureVerificationStatus;
  readonly trustedKeyFound: boolean;
  readonly keyRevoked: boolean;
  readonly keyWithinValidityWindow: boolean;
  readonly signatureHashMatchesEvidence: boolean;
  readonly signatureVerified: boolean;
  readonly independentlyVerified: boolean;
  readonly payloadSha256: string;
  readonly signatureSha256: string;
  readonly canPresentDestination: boolean;
  readonly quarantineVerification: boolean;
  readonly zeroSecretContext: true;
  readonly safeReadOnly: true;
  readonly requiresUserGesture: true;
  readonly canAutoNavigate: false;
  readonly navigationAuthority: false;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

const PLAIN = Object.getPrototypeOf({});
const MAX_KEYS = 1_000;
const MAX_PUBLIC_KEY_PEM_BYTES = 8_192;
const ALGORITHMS = new Set<XviScenarioHandoffSignatureAlgorithm>([
  "ED25519",
  "ECDSA_P256_SHA256",
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

function safeVersion(value: number): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error("SCENARIO_PUBLIC_KEY_REGISTRY_VERSION_INVALID");
  }
}

function validateSignatureBase64(value: string): Buffer {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > 16_384 ||
    value.length % 4 !== 0 ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(value)
  ) {
    throw new Error("SCENARIO_SIGNATURE_BASE64_INVALID");
  }
  const decoded = Buffer.from(value, "base64");
  if (decoded.length === 0 || decoded.toString("base64") !== value) {
    throw new Error("SCENARIO_SIGNATURE_BASE64_INVALID");
  }
  return decoded;
}

function validatePublicKeyPem(value: string, label: string): KeyObject {
  if (
    typeof value !== "string" ||
    Buffer.byteLength(value, "utf8") > MAX_PUBLIC_KEY_PEM_BYTES ||
    !value.startsWith("-----BEGIN PUBLIC KEY-----") ||
    !value.includes("-----END PUBLIC KEY-----") ||
    value.includes("PRIVATE KEY")
  ) {
    throw new Error(`${label}_PUBLIC_MATERIAL_REQUIRED`);
  }
  try {
    return createPublicKey(value);
  } catch {
    throw new Error(`${label}_INVALID`);
  }
}

function assertKeyAlgorithm(
  key: KeyObject,
  algorithm: XviScenarioHandoffSignatureAlgorithm
): void {
  if (algorithm === "ED25519") {
    if (key.asymmetricKeyType !== "ed25519") {
      throw new Error("SCENARIO_PUBLIC_KEY_ALGORITHM_MISMATCH");
    }
    return;
  }
  if (key.asymmetricKeyType !== "ec") {
    throw new Error("SCENARIO_PUBLIC_KEY_ALGORITHM_MISMATCH");
  }
  const details = key.asymmetricKeyDetails as { readonly namedCurve?: string } | undefined;
  if (details?.namedCurve !== "prime256v1") {
    throw new Error("SCENARIO_PUBLIC_KEY_CURVE_INVALID");
  }
}

function validateRegistry(input: unknown): Readonly<XviScenarioPublicKeyRegistrySnapshot> {
  plain(input, "SCENARIO_PUBLIC_KEY_REGISTRY");
  exact(input, ["schemaVersion", "registryVersion", "keys", "zeroSecretContext"], "SCENARIO_PUBLIC_KEY_REGISTRY");
  const registry = input as unknown as XviScenarioPublicKeyRegistrySnapshot;
  if (registry.schemaVersion !== "xvi-scenario-public-key-registry-v1") {
    throw new Error("SCENARIO_PUBLIC_KEY_REGISTRY_SCHEMA_INVALID");
  }
  safeVersion(registry.registryVersion);
  if (registry.zeroSecretContext !== true) {
    throw new Error("SCENARIO_PUBLIC_KEY_REGISTRY_SECRET_CONTEXT_VIOLATION");
  }
  if (!Array.isArray(registry.keys) || registry.keys.length > MAX_KEYS) {
    throw new Error("SCENARIO_PUBLIC_KEY_REGISTRY_COUNT_INVALID");
  }

  const seen = new Set<string>();
  const seenPublicKeyMaterial = new Set<string>();
  const keys = registry.keys.map((raw) => {
    plain(raw, "SCENARIO_PUBLIC_KEY");
    exact(raw, ["publicKeyId", "algorithm", "publicKeyPem", "status", "notBefore", "notAfter"], "SCENARIO_PUBLIC_KEY");
    const key = raw as unknown as XviScenarioPublicKeyRecord;
    id(key.publicKeyId, "public-key:", "PUBLIC_KEY_ID");
    if (seen.has(key.publicKeyId)) throw new Error("SCENARIO_PUBLIC_KEY_DUPLICATE");
    seen.add(key.publicKeyId);
    if (!ALGORITHMS.has(key.algorithm)) throw new Error("SCENARIO_PUBLIC_KEY_ALGORITHM_INVALID");
    if (key.status !== "ACTIVE" && key.status !== "REVOKED") {
      throw new Error("SCENARIO_PUBLIC_KEY_STATUS_INVALID");
    }
    iso(key.notBefore, "PUBLIC_KEY_NOT_BEFORE");
    iso(key.notAfter, "PUBLIC_KEY_NOT_AFTER");
    if (Date.parse(key.notAfter) <= Date.parse(key.notBefore)) {
      throw new Error("SCENARIO_PUBLIC_KEY_WINDOW_INVALID");
    }
    const publicKey = validatePublicKeyPem(key.publicKeyPem, "SCENARIO_PUBLIC_KEY");
    assertKeyAlgorithm(publicKey, key.algorithm);
    const publicKeyFingerprint = publicKeyFingerprintSha256(publicKey);
    if (seenPublicKeyMaterial.has(publicKeyFingerprint)) {
      throw new Error("SCENARIO_PUBLIC_KEY_MATERIAL_DUPLICATE");
    }
    seenPublicKeyMaterial.add(publicKeyFingerprint);
    return Object.freeze({ ...key });
  });

  return Object.freeze({
    ...registry,
    keys: Object.freeze(keys),
  });
}

function hashSignature(signature: Buffer): string {
  return createHash("sha256").update(signature).digest("hex");
}

function publicKeyFingerprintSha256(key: KeyObject): string {
  const spkiDer = key.export({ type: "spki", format: "der" });
  return createHash("sha256").update(spkiDer).digest("hex");
}

export function evaluateScenarioIndependentSignatureVerification(
  input: unknown,
  now: string
): Readonly<XviScenarioIndependentSignatureVerificationReceipt> {
  plain(input, "SCENARIO_SIGNATURE_VERIFICATION");
  exact(
    input,
    [
      "envelope",
      "registry",
      "minimumAcceptedRegistryVersion",
      "signatureBase64",
      "zeroSecretContext",
      "safeReadOnly",
      "executionAuthority",
      "mutationAuthority",
      "productionAuthority",
    ],
    "SCENARIO_SIGNATURE_VERIFICATION"
  );
  const request = input as unknown as XviScenarioIndependentSignatureVerificationInput;
  safeVersion(request.minimumAcceptedRegistryVersion);
  if (
    request.zeroSecretContext !== true ||
    request.safeReadOnly !== true ||
    request.executionAuthority !== false ||
    request.mutationAuthority !== false ||
    request.productionAuthority !== false
  ) {
    throw new Error("SCENARIO_SIGNATURE_VERIFICATION_AUTHORITY_VIOLATION");
  }
  iso(now, "NOW");

  const envelopeReceipt = evaluateScenarioReviewHandoffHashEnvelope(request.envelope, now);
  const registry = validateRegistry(request.registry);
  const signature = validateSignatureBase64(request.signatureBase64);
  const evidence = request.envelope.signatureEvidence;
  const signatureSha256 = hashSignature(signature);
  const signatureHashMatchesEvidence = signatureSha256 === evidence.signatureSha256;
  const keyRecord = registry.keys.find((key) => key.publicKeyId === evidence.publicKeyId);

  let status: XviScenarioIndependentSignatureVerificationStatus = "UNKNOWN_KEY";
  let keyRevoked = false;
  let keyWithinValidityWindow = false;
  let signatureVerified = false;

  if (envelopeReceipt.status === "QUARANTINED") {
    status = "ENVELOPE_QUARANTINED";
  } else if (registry.registryVersion < request.minimumAcceptedRegistryVersion) {
    status = "REGISTRY_ROLLBACK_DETECTED";
  } else if (!keyRecord) {
    status = "UNKNOWN_KEY";
  } else {
    if (keyRecord.algorithm !== evidence.algorithm) {
      throw new Error("SCENARIO_SIGNATURE_KEY_ALGORITHM_MISMATCH");
    }
    keyRevoked = keyRecord.status === "REVOKED";
    const nowMs = Date.parse(now);
    const notBeforeMs = Date.parse(keyRecord.notBefore);
    const notAfterMs = Date.parse(keyRecord.notAfter);
    keyWithinValidityWindow = nowMs >= notBeforeMs && nowMs < notAfterMs;

    if (keyRevoked) {
      status = "REVOKED_KEY";
    } else if (nowMs < notBeforeMs) {
      status = "KEY_NOT_YET_VALID";
    } else if (nowMs >= notAfterMs) {
      status = "KEY_EXPIRED";
    } else if (!signatureHashMatchesEvidence) {
      status = "SIGNATURE_HASH_MISMATCH";
    } else {
      const publicKey = validatePublicKeyPem(keyRecord.publicKeyPem, "SCENARIO_PUBLIC_KEY");
      const payload = Buffer.from(envelopeReceipt.canonicalPayloadSha256, "utf8");
      signatureVerified =
        evidence.algorithm === "ED25519"
          ? verifySignature(null, payload, publicKey, signature)
          : verifySignature("sha256", payload, publicKey, signature);
      status = signatureVerified ? "VERIFIED" : "SIGNATURE_INVALID";
    }
  }

  const independentlyVerified = status === "VERIFIED" && signatureVerified;

  return Object.freeze({
    schemaVersion: "xvi-scenario-independent-signature-verification-v1",
    envelopeId: envelopeReceipt.envelopeId,
    handoffId: envelopeReceipt.handoffId,
    scenarioSetId: envelopeReceipt.scenarioSetId,
    tenantId: envelopeReceipt.tenantId,
    userScopeId: envelopeReceipt.userScopeId,
    runMode: envelopeReceipt.runMode,
    publicKeyId: evidence.publicKeyId,
    algorithm: evidence.algorithm,
    registryVersion: registry.registryVersion,
    minimumAcceptedRegistryVersion: request.minimumAcceptedRegistryVersion,
    status,
    trustedKeyFound: Boolean(keyRecord),
    keyRevoked,
    keyWithinValidityWindow,
    signatureHashMatchesEvidence,
    signatureVerified,
    independentlyVerified,
    payloadSha256: envelopeReceipt.canonicalPayloadSha256,
    signatureSha256,
    canPresentDestination: independentlyVerified,
    quarantineVerification: !independentlyVerified,
    zeroSecretContext: true,
    safeReadOnly: true,
    requiresUserGesture: true,
    canAutoNavigate: false,
    navigationAuthority: false,
    executionAuthority: false,
    mutationAuthority: false,
    productionAuthority: false,
  });
}