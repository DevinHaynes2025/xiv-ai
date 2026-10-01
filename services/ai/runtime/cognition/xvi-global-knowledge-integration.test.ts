import test from "node:test";
import assert from "node:assert/strict";

import {
  XVI_GLOBAL_JURISDICTION_EXPECTATIONS,
  validateJurisdictionRecord,
  validateGlobalJurisdictionCatalog,
  validateSourceRegistryEntry,
} from "./xvi-global-jurisdiction-source-registry";

import {
  validateAfricaOrganizationRecord,
  issueOrganizationAdmissionReceipt,
} from "./xvi-africa-organization-society-registry";

import {
  validateAfricaKnowledgeEdge,
  issueEdgeAdmissionReceipt,
} from "./xvi-africa-relationship-evidence-edge";

const H = "a".repeat(64);

test("12D-875 expectations preserve 193/2/55 invariants", () => {
  assert.deepEqual(XVI_GLOBAL_JURISDICTION_EXPECTATIONS, {
    unMembers: 193,
    unObservers: 2,
    auMembers: 55,
  });
});

test("12D-875 jurisdiction validation is deny-by-default", () => {
  const valid = {
    id: "jurisdiction:iso3166-1:ng",
    canonicalName: "Nigeria",
    isoAlpha2: "NG",
    isoAlpha3: "NGA",
    isoNumeric: "566",
    entityClass: "UN_MEMBER_STATE",
    unMember: true,
    auMember: true,
    status: "ACTIVE",
  };
  assert.equal(validateJurisdictionRecord(valid).isoAlpha2, "NG");
  assert.throws(() => validateJurisdictionRecord({...valid, injected: true}), /SCHEMA_MISMATCH/);
  assert.throws(() => validateJurisdictionRecord({...valid, isoAlpha2: "ng"}), /ISO_IDENTIFIER_INVALID/);
});

test("12D-875 incomplete catalog cannot masquerade as global", () => {
  const nigeria = {
    id: "jurisdiction:iso3166-1:ng",
    canonicalName: "Nigeria",
    isoAlpha2: "NG",
    isoAlpha3: "NGA",
    isoNumeric: "566",
    entityClass: "UN_MEMBER_STATE",
    unMember: true,
    auMember: true,
    status: "ACTIVE",
  };
  assert.throws(() => validateGlobalJurisdictionCatalog([nigeria]), /UN_MEMBER_COUNT_MISMATCH/);
});

test("12D-875 unverified source must quarantine and carries no production authority", () => {
  const source = {
    sourceId: "source:test",
    provider: "Example",
    jurisdictionId: "jurisdiction:iso3166-1:ng",
    dataset: "Example dataset",
    licenseId: "license:test",
    allowedUse: ["knowledge-index"],
    trustClass: "UNVERIFIED",
    personalDataClass: "NONE",
    refreshPolicy: "MANUAL",
    schemaVersion: "1",
    contentHash: H,
    retrievedAt: "2026-09-30T23:50:00-05:00",
    expiresAt: null,
    ingestionState: "QUARANTINED",
    quarantineReasons: ["UNVERIFIED"],
    modesAllowed: ["LOCAL_ONLY"],
    secretsPresent: false,
    productionAuthority: false,
  };
  assert.equal(validateSourceRegistryEntry(source).ingestionState, "QUARANTINED");
  assert.throws(() => validateSourceRegistryEntry({...source, ingestionState:"ADMITTED"}), /UNTRUSTED_SOURCE_MUST_QUARANTINE/);
});

const organization = {
  entityId:"org:africa:example-university-ng",
  canonicalName:"Example University",
  aliases:["EU"],
  organizationClass:"UNIVERSITY",
  jurisdiction:{jurisdictionId:"jurisdiction:iso3166-1:ng",isoAlpha2:"NG",auMember:true},
  subnationalRegion:"Lagos",
  locality:"Lagos",
  sectors:["education","research"],
  languages:["English"],
  websiteDomain:"example.edu.ng",
  provenance:[{
    sourceId:"source:official",
    sourceRecordId:"record:1",
    evidenceClass:"OFFICIAL_RECORD",
    licenseId:"license:public-use",
    allowedUse:["knowledge-index"],
    retrievedAt:"2026-09-30T23:50:00-05:00",
    contentHash:H,
    sourceTrustScore:95,
    quarantineReasons:[],
  }],
  resolution:{
    resolutionState:"RESOLVED",
    canonicalNameBasis:["source:official"],
    aliasBasis:["source:official"],
    externalIds:{registry:"EX-1"},
    duplicateCandidateIds:[],
    confidence:0.98,
    reviewed:true,
  },
  admissionState:"ADMITTED",
  modesAllowed:["ONLINE_GOVERNED","OFFLINE_GOVERNED","LOCAL_ONLY"],
  observedAt:"2026-09-30T23:50:00-05:00",
  validFrom:null,
  validTo:null,
  supersedesEntityId:null,
  personalDataClass:"NONE",
  secretsPresent:false,
  executionAuthority:false,
  networkAuthority:false,
  mutationAuthority:false,
  productionAuthority:false,
};

test("12D-876 organization receipt is read-only and zero-authority", () => {
  const validated = validateAfricaOrganizationRecord(organization);
  const receipt = issueOrganizationAdmissionReceipt(validated);
  assert.equal(receipt.safeReadOnly, true);
  assert.equal(receipt.executionAuthority, false);
  assert.equal(receipt.mutationAuthority, false);
  assert.equal(receipt.productionAuthority, false);
});

test("12D-876 unverified provenance cannot be admitted", () => {
  const x = structuredClone(organization);
  x.provenance[0].evidenceClass = "UNVERIFIED";
  assert.throws(() => validateAfricaOrganizationRecord(x), /UNVERIFIED_MUST_QUARANTINE|ADMISSION_REQUIRES_CLEAN_PROVENANCE/);
});

const edge = {
  edgeId:"edge:africa:test:1",
  sourceEntityId:"org:africa:test:a",
  targetEntityId:"org:africa:test:b",
  edgeType:"PARTNERS_WITH",
  jurisdictionIds:["jurisdiction:iso3166-1:ng"],
  evidence:[{
    sourceId:"src:1",
    sourceRecordId:"r1",
    evidenceClass:"OFFICIAL_RECORD",
    licenseId:"lic:open",
    retrievedAt:"2026-09-30T23:00:00Z",
    contentHash:H,
    supports:true,
    confidence:0.95,
    quarantineReasons:[],
  }],
  disputeState:"UNDISPUTED",
  admissionState:"ADMITTED",
  validFrom:null,
  validTo:null,
  observedAt:"2026-09-30T23:01:00Z",
  supersedesEdgeId:null,
  modesAllowed:["ONLINE_GOVERNED","OFFLINE_GOVERNED","LOCAL_ONLY"],
  tenantVisibility:"PUBLIC",
  revoked:false,
  secretsPresent:false,
  executionAuthority:false,
  networkAuthority:false,
  mutationAuthority:false,
  productionAuthority:false,
};

test("12D-877 admitted edge remains zero-authority", () => {
  const receipt = issueEdgeAdmissionReceipt(validateAfricaKnowledgeEdge(edge));
  assert.equal(receipt.safeReadOnly, true);
  assert.equal(receipt.executionAuthority, false);
  assert.equal(receipt.mutationAuthority, false);
  assert.equal(receipt.productionAuthority, false);
  assert.equal(receipt.supportingEvidenceCount, 1);
});

test("12D-877 contradiction cannot be hidden as undisputed", () => {
  const x = structuredClone(edge);
  x.evidence.push({...x.evidence[0],sourceId:"src:2",sourceRecordId:"r2",supports:false});
  assert.throws(() => validateAfricaKnowledgeEdge(x), /UNDISPUTED_CONTRADICTION/);
});

test("12D-877 authority escalation is refused", () => {
  assert.throws(() => validateAfricaKnowledgeEdge({...edge,executionAuthority:true}), /AUTHORITY_OR_SECRET_VIOLATION/);
});
