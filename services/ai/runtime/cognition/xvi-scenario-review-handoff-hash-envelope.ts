import {
  evaluateScenarioReviewHandoff,
  validateScenarioReviewHandoffInput,
  type XviScenarioReviewHandoffInput,
  type XviScenarioHandoffRunMode,
  type XviScenarioHandoffDestination,
  type XviScenarioHandoffReason,
} from "./xvi-scenario-review-handoff-receipt";

export type XviScenarioHandoffSignatureAlgorithm =
  | "ED25519"
  | "ECDSA_P256_SHA256";

export type XviScenarioHandoffEnvelopeStatus =
  | "HASH_BOUND_PENDING_SIGNATURE"
  | "QUARANTINED";

export interface XviScenarioHandoffSignatureEvidence {
  readonly algorithm: XviScenarioHandoffSignatureAlgorithm;
  readonly publicKeyId: string;
  readonly payloadSha256: string;
  readonly signatureSha256: string;
  readonly signatureClaimVerified: boolean;
  readonly verifiedAt: string;
  readonly verifierClass: "TRUSTED_PUBLIC_KEY_VERIFIER";
}

export interface XviScenarioReviewHandoffHashEnvelopeInput {
  readonly envelopeId: string;
  readonly handoff: XviScenarioReviewHandoffInput;
  readonly payloadSha256: string;
  readonly signatureEvidence: XviScenarioHandoffSignatureEvidence;
  readonly zeroSecretContext: true;
  readonly safeReadOnly: true;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

export interface XviScenarioReviewHandoffHashEnvelopeReceipt {
  readonly schemaVersion: "xvi-scenario-review-handoff-hash-envelope-v1";
  readonly envelopeId: string;
  readonly handoffId: string;
  readonly scenarioSetId: string;
  readonly tenantId: string;
  readonly userScopeId: string;
  readonly runMode: XviScenarioHandoffRunMode;
  readonly destination: XviScenarioHandoffDestination;
  readonly reason: XviScenarioHandoffReason;
  readonly status: XviScenarioHandoffEnvelopeStatus;
  readonly canonicalPayloadSha256: string;
  readonly payloadHashMatches: boolean;
  readonly signatureEvidencePayloadMatches: boolean;
  readonly signatureClaimConsistent: boolean;
  readonly handoffStatus: "VALID" | "EXPIRED" | "REPLAYED" | "REVOKED";
  readonly boundPriorUseCount: number;
  readonly boundRevocationCount: number;
  readonly requiresIndependentSignatureVerification: true;
  readonly canPresentDestination: false;
  readonly quarantineEnvelope: boolean;
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

function id(value: string, prefix: string, label: string): void {
  if (typeof value !== "string" || !value.startsWith(prefix) || value.length > 240) {
    throw new Error(`${label}_INVALID`);
  }
}

function sha256Shape(value: string, label: string): void {
  if (!/^[a-f0-9]{64}$/.test(value)) {
    throw new Error(`${label}_INVALID`);
  }
}

function iso(value: string, label: string): void {
  if (typeof value !== "string" || !value.includes("T") || Number.isNaN(Date.parse(value))) {
    throw new Error(`${label}_INVALID`);
  }
}

function utf8Bytes(value: string): number[] {
  const out: number[] = [];
  for (const symbol of value) {
    const cp = symbol.codePointAt(0)!;
    if (cp <= 0x7f) {
      out.push(cp);
    } else if (cp <= 0x7ff) {
      out.push(0xc0 | (cp >>> 6), 0x80 | (cp & 0x3f));
    } else if (cp <= 0xffff) {
      out.push(
        0xe0 | (cp >>> 12),
        0x80 | ((cp >>> 6) & 0x3f),
        0x80 | (cp & 0x3f)
      );
    } else {
      out.push(
        0xf0 | (cp >>> 18),
        0x80 | ((cp >>> 12) & 0x3f),
        0x80 | ((cp >>> 6) & 0x3f),
        0x80 | (cp & 0x3f)
      );
    }
  }
  return out;
}

function rotr(value: number, shift: number): number {
  return (value >>> shift) | (value << (32 - shift));
}

export function sha256HexUtf8(value: string): string {
  const bytes = utf8Bytes(value);
  const bitLengthHi = Math.floor((bytes.length * 8) / 0x1_0000_0000);
  const bitLengthLo = (bytes.length * 8) >>> 0;
  bytes.push(0x80);
  while ((bytes.length % 64) !== 56) bytes.push(0);
  bytes.push(
    (bitLengthHi >>> 24) & 0xff,
    (bitLengthHi >>> 16) & 0xff,
    (bitLengthHi >>> 8) & 0xff,
    bitLengthHi & 0xff,
    (bitLengthLo >>> 24) & 0xff,
    (bitLengthLo >>> 16) & 0xff,
    (bitLengthLo >>> 8) & 0xff,
    bitLengthLo & 0xff
  );

  const k = [
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2,
  ];

  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
  const w = new Array<number>(64);

  for (let offset = 0; offset < bytes.length; offset += 64) {
    for (let i = 0; i < 16; i++) {
      const j = offset + i * 4;
      w[i] = (((bytes[j] << 24) | (bytes[j + 1] << 16) | (bytes[j + 2] << 8) | bytes[j + 3]) >>> 0);
    }
    for (let i = 16; i < 64; i++) {
      const s0 = (rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3)) >>> 0;
      const s1 = (rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10)) >>> 0;
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    let a=h0,b=h1,c=h2,d=h3,e=h4,f=h5,g=h6,h=h7;
    for (let i = 0; i < 64; i++) {
      const S1 = (rotr(e,6) ^ rotr(e,11) ^ rotr(e,25)) >>> 0;
      const ch = ((e & f) ^ (~e & g)) >>> 0;
      const temp1 = (h + S1 + ch + k[i] + w[i]) >>> 0;
      const S0 = (rotr(a,2) ^ rotr(a,13) ^ rotr(a,22)) >>> 0;
      const maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
      const temp2 = (S0 + maj) >>> 0;
      h=g; g=f; f=e; e=(d + temp1) >>> 0; d=c; c=b; b=a; a=(temp1 + temp2) >>> 0;
    }

    h0=(h0+a)>>>0; h1=(h1+b)>>>0; h2=(h2+c)>>>0; h3=(h3+d)>>>0;
    h4=(h4+e)>>>0; h5=(h5+f)>>>0; h6=(h6+g)>>>0; h7=(h7+h)>>>0;
  }

  return [h0,h1,h2,h3,h4,h5,h6,h7]
    .map((value) => value.toString(16).padStart(8, "0"))
    .join("");
}

export function canonicalizeScenarioReviewHandoff(input: unknown): string {
  const handoff = validateScenarioReviewHandoffInput(input);
  const priorUses = [...handoff.priorUses]
    .map((use) => [
      use.handoffId,
      use.replayKey,
      use.tenantId,
      use.userScopeId,
      use.consumedAt,
    ] as const)
    .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  const revoked = [...handoff.revokedHandoffIds].sort();

  return JSON.stringify([
    "xvi-scenario-review-handoff-payload-v1",
    handoff.handoffId,
    handoff.scenarioSetId,
    handoff.tenantId,
    handoff.userScopeId,
    handoff.runMode,
    handoff.destination,
    handoff.reason,
    handoff.replayKey,
    handoff.issuedAt,
    handoff.expiresAt,
    priorUses,
    revoked,
    handoff.zeroSecretContext,
    handoff.safeReadOnly,
    handoff.requiresUserGesture,
    handoff.canAutoNavigate,
    handoff.executionAuthority,
    handoff.mutationAuthority,
    handoff.productionAuthority,
  ]);
}

function validateSignatureEvidence(input: unknown): Readonly<XviScenarioHandoffSignatureEvidence> {
  plain(input, "SCENARIO_HANDOFF_SIGNATURE_EVIDENCE");
  exact(
    input,
    [
      "algorithm",
      "publicKeyId",
      "payloadSha256",
      "signatureSha256",
      "signatureClaimVerified",
      "verifiedAt",
      "verifierClass",
    ],
    "SCENARIO_HANDOFF_SIGNATURE_EVIDENCE"
  );
  const evidence = input as unknown as XviScenarioHandoffSignatureEvidence;
  if (!ALGORITHMS.has(evidence.algorithm)) throw new Error("SCENARIO_HANDOFF_SIGNATURE_ALGORITHM_INVALID");
  id(evidence.publicKeyId, "public-key:", "PUBLIC_KEY_ID");
  sha256Shape(evidence.payloadSha256, "SIGNATURE_PAYLOAD_SHA256");
  sha256Shape(evidence.signatureSha256, "SIGNATURE_SHA256");
  iso(evidence.verifiedAt, "SIGNATURE_VERIFIED_AT");
  if (typeof evidence.signatureClaimVerified !== "boolean") {
    throw new Error("SCENARIO_HANDOFF_SIGNATURE_CLAIM_INVALID");
  }
  if (evidence.verifierClass !== "TRUSTED_PUBLIC_KEY_VERIFIER") {
    throw new Error("SCENARIO_HANDOFF_VERIFIER_CLASS_INVALID");
  }
  return Object.freeze({ ...evidence });
}

export function evaluateScenarioReviewHandoffHashEnvelope(
  input: unknown,
  now: string
): Readonly<XviScenarioReviewHandoffHashEnvelopeReceipt> {
  plain(input, "SCENARIO_HANDOFF_ENVELOPE");
  exact(
    input,
    [
      "envelopeId",
      "handoff",
      "payloadSha256",
      "signatureEvidence",
      "zeroSecretContext",
      "safeReadOnly",
      "executionAuthority",
      "mutationAuthority",
      "productionAuthority",
    ],
    "SCENARIO_HANDOFF_ENVELOPE"
  );

  const envelope = input as unknown as XviScenarioReviewHandoffHashEnvelopeInput;
  id(envelope.envelopeId, "scenario-envelope:", "ENVELOPE_ID");
  sha256Shape(envelope.payloadSha256, "PAYLOAD_SHA256");
  if (
    envelope.zeroSecretContext !== true ||
    envelope.safeReadOnly !== true ||
    envelope.executionAuthority !== false ||
    envelope.mutationAuthority !== false ||
    envelope.productionAuthority !== false
  ) {
    throw new Error("SCENARIO_HANDOFF_ENVELOPE_AUTHORITY_VIOLATION");
  }

  const handoff = validateScenarioReviewHandoffInput(envelope.handoff);
  const handoffReceipt = evaluateScenarioReviewHandoff(handoff, now);
  const evidence = validateSignatureEvidence(envelope.signatureEvidence);
  iso(now, "NOW");
  const verifiedAtMs = Date.parse(evidence.verifiedAt);
  const issuedAtMs = Date.parse(handoff.issuedAt);
  const expiresAtMs = Date.parse(handoff.expiresAt);
  const nowMs = Date.parse(now);
  if (verifiedAtMs < issuedAtMs || verifiedAtMs > expiresAtMs || verifiedAtMs > nowMs) {
    throw new Error("SCENARIO_HANDOFF_SIGNATURE_VERIFICATION_TIME_INVALID");
  }

  const canonicalPayload = canonicalizeScenarioReviewHandoff(handoff);
  const canonicalPayloadSha256 = sha256HexUtf8(canonicalPayload);
  const payloadHashMatches = envelope.payloadSha256 === canonicalPayloadSha256;
  const signatureEvidencePayloadMatches = evidence.payloadSha256 === canonicalPayloadSha256;
  const signatureClaimConsistent = evidence.signatureClaimVerified === true;
  const clean =
    handoffReceipt.status === "VALID" &&
    payloadHashMatches &&
    signatureEvidencePayloadMatches &&
    signatureClaimConsistent;

  return Object.freeze({
    schemaVersion: "xvi-scenario-review-handoff-hash-envelope-v1",
    envelopeId: envelope.envelopeId,
    handoffId: handoff.handoffId,
    scenarioSetId: handoff.scenarioSetId,
    tenantId: handoff.tenantId,
    userScopeId: handoff.userScopeId,
    runMode: handoff.runMode,
    destination: handoff.destination,
    reason: handoff.reason,
    status: clean ? "HASH_BOUND_PENDING_SIGNATURE" : "QUARANTINED",
    canonicalPayloadSha256,
    payloadHashMatches,
    signatureEvidencePayloadMatches,
    signatureClaimConsistent,
    handoffStatus: handoffReceipt.status,
    boundPriorUseCount: handoff.priorUses.length,
    boundRevocationCount: handoff.revokedHandoffIds.length,
    requiresIndependentSignatureVerification: true,
    canPresentDestination: false,
    quarantineEnvelope: !clean,
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