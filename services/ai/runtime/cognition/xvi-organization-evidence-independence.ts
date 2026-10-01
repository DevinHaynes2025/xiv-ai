export type XviOperatingMode = "ONLINE_GOVERNED" | "OFFLINE_GOVERNED" | "LOCAL_ONLY";
export type XviSourceRelation = "ORIGINAL" | "MIRROR" | "SYNDICATED" | "DERIVED" | "AGGREGATED";

export interface XviSourceLineageEvidence {
  readonly sourceId: string;
  readonly upstreamSourceIds: readonly string[];
  readonly relation: XviSourceRelation;
  readonly contentHash: string;
  readonly observedAt: string;
  readonly supportsIdentity: boolean;
  readonly quarantineReasons: readonly string[];
}

export interface XviEvidenceIndependenceInput {
  readonly organizationId: string;
  readonly mode: XviOperatingMode;
  readonly evidence: readonly XviSourceLineageEvidence[];
  readonly safeReadOnly: true;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

export interface XviEvidenceIndependenceReceipt {
  readonly schemaVersion: "xvi-evidence-independence-v1";
  readonly organizationId: string;
  readonly evidenceCount: number;
  readonly independentGroupCount: number;
  readonly independentSupportingGroupCount: number;
  readonly dependentEvidenceCount: number;
  readonly duplicateContentHashCount: number;
  readonly quarantinedEvidenceCount: number;
  readonly sourceGroups: readonly Readonly<{
    readonly rootSourceId: string;
    readonly memberSourceIds: readonly string[];
    readonly supportingMembers: number;
    readonly contradictingMembers: number;
  }>[];
  readonly requiresHumanReview: boolean;
  readonly safeReadOnly: true;
  readonly independenceIsTruth: false;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

const PLAIN = Object.getPrototypeOf({});
const MODES = new Set<XviOperatingMode>(["ONLINE_GOVERNED","OFFLINE_GOVERNED","LOCAL_ONLY"]);
const RELATIONS = new Set<XviSourceRelation>(["ORIGINAL","MIRROR","SYNDICATED","DERIVED","AGGREGATED"]);

function plain(v: unknown, label: string): asserts v is Record<string, unknown> {
  if (v === null || typeof v !== "object" || Object.getPrototypeOf(v) !== PLAIN) throw new Error(`${label}_PLAIN_REQUIRED`);
  if (Object.getOwnPropertySymbols(v).length) throw new Error(`${label}_SYMBOLS_FORBIDDEN`);
  for (const k of Object.keys(v)) {
    const d = Object.getOwnPropertyDescriptor(v, k);
    if (!d || d.get || d.set) throw new Error(`${label}_ACCESSOR_FORBIDDEN`);
  }
}
function exact(v: Record<string, unknown>, keys: readonly string[], label: string): void {
  const a = Object.keys(v).sort(), b = [...keys].sort();
  if (a.length !== b.length || a.some((k,i)=>k!==b[i])) throw new Error(`${label}_SCHEMA_MISMATCH`);
}
function iso(v: string, label: string): void {
  if (typeof v !== "string" || !v.includes("T") || Number.isNaN(Date.parse(v))) throw new Error(`${label}_INVALID`);
}
function hash(v: string): boolean { return typeof v === "string" && /^[a-f0-9]{64}$/.test(v); }
function uniqueStrings(v: readonly string[], max: number, label: string): void {
  if (!Array.isArray(v) || v.length > max) throw new Error(`${label}_COUNT`);
  const seen = new Set<string>();
  for (const x of v) {
    if (typeof x !== "string" || !x.trim() || x.length > 240) throw new Error(`${label}_INVALID`);
    if (seen.has(x)) throw new Error(`${label}_DUPLICATE`);
    seen.add(x);
  }
}

export function validateEvidenceIndependenceInput(input: unknown): Readonly<XviEvidenceIndependenceInput> {
  plain(input,"INDEPENDENCE_INPUT");
  exact(input,["organizationId","mode","evidence","safeReadOnly","executionAuthority","mutationAuthority","productionAuthority"],"INDEPENDENCE_INPUT");
  const r = input as unknown as XviEvidenceIndependenceInput;
  if (!/^org:/.test(r.organizationId) || !MODES.has(r.mode)) throw new Error("INDEPENDENCE_IDENTITY_INVALID");
  if (!Array.isArray(r.evidence) || r.evidence.length < 1 || r.evidence.length > 128) throw new Error("INDEPENDENCE_EVIDENCE_COUNT");
  const sourceIds = new Set<string>();
  for (const raw of r.evidence) {
    plain(raw,"LINEAGE_EVIDENCE");
    exact(raw,["sourceId","upstreamSourceIds","relation","contentHash","observedAt","supportsIdentity","quarantineReasons"],"LINEAGE_EVIDENCE");
    const e = raw as unknown as XviSourceLineageEvidence;
    if (!e.sourceId?.trim() || sourceIds.has(e.sourceId)) throw new Error("SOURCE_ID_INVALID_OR_DUPLICATE");
    sourceIds.add(e.sourceId);
    uniqueStrings(e.upstreamSourceIds,32,"UPSTREAM_SOURCES");
    if (e.upstreamSourceIds.includes(e.sourceId)) throw new Error("SELF_UPSTREAM_FORBIDDEN");
    if (!RELATIONS.has(e.relation) || !hash(e.contentHash)) throw new Error("LINEAGE_BINDING_INVALID");
    iso(e.observedAt,"LINEAGE_OBSERVED_AT");
    if (typeof e.supportsIdentity !== "boolean") throw new Error("LINEAGE_SUPPORT_FLAG_INVALID");
    if (!Array.isArray(e.quarantineReasons) || e.quarantineReasons.length > 16) throw new Error("LINEAGE_QUARANTINE_INVALID");
    if (e.relation === "ORIGINAL" && e.upstreamSourceIds.length > 0) throw new Error("ORIGINAL_CANNOT_HAVE_UPSTREAM");
    if (e.relation !== "ORIGINAL" && e.upstreamSourceIds.length < 1) throw new Error("DEPENDENT_SOURCE_REQUIRES_UPSTREAM");
  }
  if (r.safeReadOnly !== true || r.executionAuthority !== false || r.mutationAuthority !== false || r.productionAuthority !== false) throw new Error("INDEPENDENCE_AUTHORITY_VIOLATION");
  return Object.freeze({...r,evidence:Object.freeze(r.evidence.map(e=>Object.freeze({...e,upstreamSourceIds:Object.freeze([...e.upstreamSourceIds]),quarantineReasons:Object.freeze([...e.quarantineReasons])})))});
}

export function assessEvidenceIndependence(input: unknown): Readonly<XviEvidenceIndependenceReceipt> {
  const r = validateEvidenceIndependenceInput(input);
  const byId = new Map(r.evidence.map(e=>[e.sourceId,e] as const));

  const resolving = new Set<string>();
  const memo = new Map<string,string>();

  function rootOf(sourceId: string): string {
    const cached = memo.get(sourceId);
    if (cached) return cached;
    if (resolving.has(sourceId)) throw new Error("SOURCE_LINEAGE_CYCLE");
    resolving.add(sourceId);
    const e = byId.get(sourceId);
    if (!e) {
      resolving.delete(sourceId);
      return sourceId;
    }
    let root = sourceId;
    if (e.relation !== "ORIGINAL") {
      const upstreamRoots = [...new Set(e.upstreamSourceIds.map(rootOf))].sort();
      if (upstreamRoots.length !== 1) throw new Error("AMBIGUOUS_DEPENDENCY_ROOT");
      root = upstreamRoots[0];
    }
    resolving.delete(sourceId);
    memo.set(sourceId,root);
    return root;
  }

  const groups = new Map<string,XviSourceLineageEvidence[]>();
  for (const e of r.evidence) {
    const root = rootOf(e.sourceId);
    const list = groups.get(root) ?? [];
    list.push(e);
    groups.set(root,list);
  }

  const hashCounts = new Map<string,number>();
  for (const e of r.evidence) hashCounts.set(e.contentHash,(hashCounts.get(e.contentHash)??0)+1);
  const duplicateContentHashCount = [...hashCounts.values()].filter(n=>n>1).reduce((sum,n)=>sum+n-1,0);

  const sourceGroups = [...groups.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([root,members])=>Object.freeze({
    rootSourceId:root,
    memberSourceIds:Object.freeze(members.map(m=>m.sourceId).sort()),
    supportingMembers:members.filter(m=>m.supportsIdentity).length,
    contradictingMembers:members.filter(m=>!m.supportsIdentity).length,
  }));

  const independentSupportingGroupCount = sourceGroups.filter(g=>g.supportingMembers>0 && g.contradictingMembers===0).length;
  const dependentEvidenceCount = r.evidence.filter(e=>e.relation!=="ORIGINAL").length;
  const quarantinedEvidenceCount = r.evidence.filter(e=>e.quarantineReasons.length>0).length;
  const requiresHumanReview =
    independentSupportingGroupCount < 2 ||
    sourceGroups.some(g=>g.contradictingMembers>0) ||
    quarantinedEvidenceCount>0 ||
    duplicateContentHashCount>0;

  return Object.freeze({
    schemaVersion:"xvi-evidence-independence-v1",
    organizationId:r.organizationId,
    evidenceCount:r.evidence.length,
    independentGroupCount:sourceGroups.length,
    independentSupportingGroupCount,
    dependentEvidenceCount,
    duplicateContentHashCount,
    quarantinedEvidenceCount,
    sourceGroups:Object.freeze(sourceGroups),
    requiresHumanReview,
    safeReadOnly:true,
    independenceIsTruth:false,
    executionAuthority:false,
    mutationAuthority:false,
    productionAuthority:false,
  });
}
