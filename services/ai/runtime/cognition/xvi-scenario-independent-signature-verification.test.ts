import test from "node:test";
import assert from "node:assert/strict";
import {
  createHash,
  generateKeyPairSync,
  sign,
} from "node:crypto";
import {
  canonicalizeScenarioReviewHandoff,
  sha256HexUtf8,
} from "./xvi-scenario-review-handoff-hash-envelope";
import {
  evaluateScenarioIndependentSignatureVerification,
} from "./xvi-scenario-independent-signature-verification";

const now = "2026-10-01T16:20:00.000Z";
const replayKey = "a".repeat(64);

function handoff(runMode: "ONLINE_GOVERNED" | "OFFLINE_GOVERNED" | "LOCAL_ONLY" = "ONLINE_GOVERNED") {
  return {
    handoffId: "scenario-handoff:alpha",
    scenarioSetId: "scenario-set:alpha",
    tenantId: "tenant:alpha",
    userScopeId: "user-scope:alpha",
    runMode,
    destination: "UNIVERSE_SCENARIO_DETAIL",
    reason: "CLEAR_SCENARIO_EXPLORATION",
    replayKey,
    issuedAt: "2026-10-01T16:15:00.000Z",
    expiresAt: "2026-10-01T16:25:00.000Z",
    priorUses: [],
    revokedHandoffIds: [],
    zeroSecretContext: true,
    safeReadOnly: true,
    requiresUserGesture: true,
    canAutoNavigate: false,
    executionAuthority: false,
    mutationAuthority: false,
    productionAuthority: false,
  } as const;
}

function makeEd25519(runMode: "ONLINE_GOVERNED" | "OFFLINE_GOVERNED" | "LOCAL_ONLY" = "ONLINE_GOVERNED") {
  const pair = generateKeyPairSync("ed25519");
  const h = handoff(runMode);
  const digest = sha256HexUtf8(canonicalizeScenarioReviewHandoff(h));
  const signature = sign(null, Buffer.from(digest, "utf8"), pair.privateKey);
  const signatureSha256 = createHash("sha256").update(signature).digest("hex");
  const publicKeyPem = pair.publicKey.export({ type: "spki", format: "pem" }).toString();
  const envelope = {
    envelopeId: "scenario-envelope:alpha",
    handoff: h,
    payloadSha256: digest,
    signatureEvidence: {
      algorithm: "ED25519",
      publicKeyId: "public-key:ed-alpha",
      payloadSha256: digest,
      signatureSha256,
      signatureClaimVerified: true,
      verifiedAt: "2026-10-01T16:19:00.000Z",
      verifierClass: "TRUSTED_PUBLIC_KEY_VERIFIER",
    },
    zeroSecretContext: true,
    safeReadOnly: true,
    executionAuthority: false,
    mutationAuthority: false,
    productionAuthority: false,
  } as const;
  const registry = {
    schemaVersion: "xvi-scenario-public-key-registry-v1",
    registryVersion: 1,
    keys: [{
      publicKeyId: "public-key:ed-alpha",
      algorithm: "ED25519",
      publicKeyPem,
      status: "ACTIVE",
      notBefore: "2026-09-01T00:00:00.000Z",
      notAfter: "2027-09-01T00:00:00.000Z",
    }],
    zeroSecretContext: true,
  } as const;
  return { pair, envelope, registry, signature, signatureBase64: signature.toString("base64") };
}

function verificationInput() {
  const x = makeEd25519();
  return {
    fixture: x,
    input: {
      envelope: x.envelope,
      registry: x.registry,
      minimumAcceptedRegistryVersion: 1,
      signatureBase64: x.signatureBase64,
      zeroSecretContext: true,
      safeReadOnly: true,
      executionAuthority: false,
      mutationAuthority: false,
      productionAuthority: false,
    } as const,
  };
}

test("independently verifies ED25519 with public material only", () => {
  const { input } = verificationInput();
  const receipt = evaluateScenarioIndependentSignatureVerification(input, now);
  assert.equal(receipt.status, "VERIFIED");
  assert.equal(receipt.independentlyVerified, true);
  assert.equal(receipt.canPresentDestination, true);
  assert.equal(receipt.navigationAuthority, false);
  assert.equal(receipt.executionAuthority, false);
  assert.equal(receipt.mutationAuthority, false);
  assert.equal(receipt.productionAuthority, false);
});

test("all governed modes preserve zero action authority", () => {
  for (const runMode of ["ONLINE_GOVERNED", "OFFLINE_GOVERNED", "LOCAL_ONLY"] as const) {
    const x = makeEd25519(runMode);
    const receipt = evaluateScenarioIndependentSignatureVerification({
      envelope: x.envelope,
      registry: x.registry,
      minimumAcceptedRegistryVersion: 1,
      signatureBase64: x.signatureBase64,
      zeroSecretContext: true,
      safeReadOnly: true,
      executionAuthority: false,
      mutationAuthority: false,
      productionAuthority: false,
    }, now);
    assert.equal(receipt.status, "VERIFIED");
    assert.equal(receipt.runMode, runMode);
    assert.equal(receipt.canAutoNavigate, false);
    assert.equal(receipt.navigationAuthority, false);
  }
});

test("independently verifies ECDSA P-256 with SHA-256", () => {
  const pair = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
  const h = handoff();
  const digest = sha256HexUtf8(canonicalizeScenarioReviewHandoff(h));
  const signature = sign("sha256", Buffer.from(digest, "utf8"), pair.privateKey);
  const signatureSha256 = createHash("sha256").update(signature).digest("hex");
  const input = {
    envelope: {
      envelopeId: "scenario-envelope:ecdsa",
      handoff: h,
      payloadSha256: digest,
      signatureEvidence: {
        algorithm: "ECDSA_P256_SHA256",
        publicKeyId: "public-key:ecdsa-alpha",
        payloadSha256: digest,
        signatureSha256,
        signatureClaimVerified: true,
        verifiedAt: "2026-10-01T16:19:00.000Z",
        verifierClass: "TRUSTED_PUBLIC_KEY_VERIFIER",
      },
      zeroSecretContext: true,
      safeReadOnly: true,
      executionAuthority: false,
      mutationAuthority: false,
      productionAuthority: false,
    },
    registry: {
      schemaVersion: "xvi-scenario-public-key-registry-v1",
      registryVersion: 2,
      keys: [{
        publicKeyId: "public-key:ecdsa-alpha",
        algorithm: "ECDSA_P256_SHA256",
        publicKeyPem: pair.publicKey.export({ type: "spki", format: "pem" }).toString(),
        status: "ACTIVE",
        notBefore: "2026-09-01T00:00:00.000Z",
        notAfter: "2027-09-01T00:00:00.000Z",
      }],
      zeroSecretContext: true,
    },
    minimumAcceptedRegistryVersion: 2,
    signatureBase64: signature.toString("base64"),
    zeroSecretContext: true,
    safeReadOnly: true,
    executionAuthority: false,
    mutationAuthority: false,
    productionAuthority: false,
  } as const;
  const receipt = evaluateScenarioIndependentSignatureVerification(input, now);
  assert.equal(receipt.status, "VERIFIED");
  assert.equal(receipt.algorithm, "ECDSA_P256_SHA256");
});

test("unknown key fails closed", () => {
  const { input } = verificationInput();
  const receipt = evaluateScenarioIndependentSignatureVerification({
    ...input,
    registry: { ...input.registry, keys: [] },
  }, now);
  assert.equal(receipt.status, "UNKNOWN_KEY");
  assert.equal(receipt.independentlyVerified, false);
  assert.equal(receipt.canPresentDestination, false);
});

test("revoked key fails closed", () => {
  const { input } = verificationInput();
  const receipt = evaluateScenarioIndependentSignatureVerification({
    ...input,
    registry: {
      ...input.registry,
      keys: input.registry.keys.map((key) => ({ ...key, status: "REVOKED" as const })),
    },
  }, now);
  assert.equal(receipt.status, "REVOKED_KEY");
  assert.equal(receipt.keyRevoked, true);
  assert.equal(receipt.canPresentDestination, false);
});

test("not-yet-valid key fails closed", () => {
  const { input } = verificationInput();
  const receipt = evaluateScenarioIndependentSignatureVerification({
    ...input,
    registry: {
      ...input.registry,
      keys: input.registry.keys.map((key) => ({
        ...key,
        notBefore: "2026-10-02T00:00:00.000Z",
        notAfter: "2027-10-02T00:00:00.000Z",
      })),
    },
  }, now);
  assert.equal(receipt.status, "KEY_NOT_YET_VALID");
});

test("expired key fails closed", () => {
  const { input } = verificationInput();
  const receipt = evaluateScenarioIndependentSignatureVerification({
    ...input,
    registry: {
      ...input.registry,
      keys: input.registry.keys.map((key) => ({
        ...key,
        notBefore: "2025-01-01T00:00:00.000Z",
        notAfter: "2026-10-01T16:19:00.000Z",
      })),
    },
  }, now);
  assert.equal(receipt.status, "KEY_EXPIRED");
});

test("signature hash mismatch fails before cryptographic trust", () => {
  const { input } = verificationInput();
  const other = generateKeyPairSync("ed25519");
  const badSignature = sign(null, Buffer.from(input.envelope.payloadSha256, "utf8"), other.privateKey);
  const receipt = evaluateScenarioIndependentSignatureVerification({
    ...input,
    signatureBase64: badSignature.toString("base64"),
  }, now);
  assert.equal(receipt.status, "SIGNATURE_HASH_MISMATCH");
  assert.equal(receipt.signatureVerified, false);
});

test("cryptographically invalid signature fails closed when hash evidence matches", () => {
  const { input } = verificationInput();
  const other = generateKeyPairSync("ed25519");
  const badSignature = sign(null, Buffer.from(input.envelope.payloadSha256, "utf8"), other.privateKey);
  const badHash = createHash("sha256").update(badSignature).digest("hex");
  const receipt = evaluateScenarioIndependentSignatureVerification({
    ...input,
    envelope: {
      ...input.envelope,
      signatureEvidence: {
        ...input.envelope.signatureEvidence,
        signatureSha256: badHash,
      },
    },
    signatureBase64: badSignature.toString("base64"),
  }, now);
  assert.equal(receipt.status, "SIGNATURE_INVALID");
  assert.equal(receipt.signatureHashMatchesEvidence, true);
  assert.equal(receipt.signatureVerified, false);
});

test("quarantined envelope cannot be independently promoted", () => {
  const { input } = verificationInput();
  const receipt = evaluateScenarioIndependentSignatureVerification({
    ...input,
    envelope: {
      ...input.envelope,
      handoff: {
        ...input.envelope.handoff,
        revokedHandoffIds: [input.envelope.handoff.handoffId],
      },
    },
  }, now);
  assert.equal(receipt.status, "ENVELOPE_QUARANTINED");
  assert.equal(receipt.independentlyVerified, false);
});

test("algorithm mismatch between registry and signature evidence is refused", () => {
  const { input } = verificationInput();
  assert.throws(() => evaluateScenarioIndependentSignatureVerification({
    ...input,
    registry: {
      ...input.registry,
      keys: input.registry.keys.map((key) => ({ ...key, algorithm: "ECDSA_P256_SHA256" as const })),
    },
  }, now), /(ALGORITHM_MISMATCH|CURVE_INVALID)/);
});

test("private key material is refused by the public-key registry", () => {
  const { input, fixture } = verificationInput();
  const privateKeyPem = fixture.pair.privateKey.export({ type: "pkcs8", format: "pem" }).toString();
  assert.throws(() => evaluateScenarioIndependentSignatureVerification({
    ...input,
    registry: {
      ...input.registry,
      keys: input.registry.keys.map((key) => ({ ...key, publicKeyPem: privateKeyPem })),
    },
  }, now), /PUBLIC_MATERIAL_REQUIRED/);
});


test("duplicate public key material under another key ID is refused", () => {
  const { input } = verificationInput();
  const original = input.registry.keys[0];
  assert.throws(() => evaluateScenarioIndependentSignatureVerification({
    ...input,
    registry: {
      ...input.registry,
      keys: [
        { ...original, status: "REVOKED" as const },
        {
          ...original,
          publicKeyId: "public-key:ed-clone",
          status: "ACTIVE" as const,
        },
      ],
    },
  }, now), /PUBLIC_KEY_MATERIAL_DUPLICATE/);
});


test("registry rollback below trusted version floor fails closed", () => {
  const { input } = verificationInput();
  const receipt = evaluateScenarioIndependentSignatureVerification({
    ...input,
    minimumAcceptedRegistryVersion: 2,
  }, now);
  assert.equal(receipt.status, "REGISTRY_ROLLBACK_DETECTED");
  assert.equal(receipt.registryVersion, 1);
  assert.equal(receipt.minimumAcceptedRegistryVersion, 2);
  assert.equal(receipt.independentlyVerified, false);
  assert.equal(receipt.signatureVerified, false);
  assert.equal(receipt.canPresentDestination, false);
  assert.equal(receipt.navigationAuthority, false);
  assert.equal(receipt.executionAuthority, false);
});

test("registry version floor must be a non-negative safe integer", () => {
  const { input } = verificationInput();
  assert.throws(() => evaluateScenarioIndependentSignatureVerification({
    ...input,
    minimumAcceptedRegistryVersion: -1,
  }, now), /REGISTRY_VERSION_INVALID/);
});

test("authority escalation is refused", () => {
  const { input } = verificationInput();
  assert.throws(() => evaluateScenarioIndependentSignatureVerification({
    ...input,
    executionAuthority: true,
  }, now), /AUTHORITY_VIOLATION/);
});

test("extra verification fields fail exact-schema validation", () => {
  const { input } = verificationInput();
  assert.throws(() => evaluateScenarioIndependentSignatureVerification({
    ...input,
    debug: true,
  }, now), /SCHEMA_MISMATCH/);
});

test("accessor-bearing registry fails without executing getter", () => {
  const { input } = verificationInput();
  let hits = 0;
  const hostile: Record<string, unknown> = { ...input.registry };
  Object.defineProperty(hostile, "registryVersion", {
    enumerable: true,
    get() {
      hits += 1;
      return 1;
    },
  });
  assert.throws(() => evaluateScenarioIndependentSignatureVerification({
    ...input,
    registry: hostile,
  }, now), /ACCESSOR_FORBIDDEN/);
  assert.equal(hits, 0);
});