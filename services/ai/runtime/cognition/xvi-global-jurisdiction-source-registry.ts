/* XVI 12D-875 — Global Jurisdiction + Source Registry Contract
   Repository-native integration form.
   No network, filesystem, secrets, providers, or production authority. */

export type XviOperatingMode = "ONLINE_GOVERNED" | "OFFLINE_GOVERNED" | "LOCAL_ONLY";
export type XviEntityClass = "UN_MEMBER_STATE" | "UN_OBSERVER_STATE" | "AU_MEMBER_SPECIAL_ENTITY";
export type XviSourceTrustClass = "OFFICIAL" | "PEER_REVIEWED" | "LICENSED" | "PUBLIC_REFERENCE" | "COMMUNITY" | "UNVERIFIED";
export type XviIngestionState = "REGISTERED" | "QUARANTINED" | "REVIEWED" | "ADMITTED" | "REVOKED";

export const XVI_GLOBAL_JURISDICTION_EXPECTATIONS = Object.freeze({
  unMembers: 193,
  unObservers: 2,
  auMembers: 55,
} as const);

export interface XviJurisdictionRecord {
  readonly id: string;
  readonly canonicalName: string;
  readonly isoAlpha2: string;
  readonly isoAlpha3: string;
  readonly isoNumeric: string;
  readonly entityClass: XviEntityClass;
  readonly unMember: boolean;
  readonly auMember: boolean;
  readonly status: "ACTIVE";
}

export interface XviSourceRegistryEntry {
  readonly sourceId: string;
  readonly provider: string;
  readonly jurisdictionId: string;
  readonly dataset: string;
  readonly licenseId: string;
  readonly allowedUse: readonly string[];
  readonly trustClass: XviSourceTrustClass;
  readonly personalDataClass: "NONE" | "AGGREGATED" | "PUBLIC_PROFESSIONAL" | "RESTRICTED";
  readonly refreshPolicy: "MANUAL" | "SCHEDULED" | "EVENT_DRIVEN";
  readonly schemaVersion: string;
  readonly contentHash: string;
  readonly retrievedAt: string;
  readonly expiresAt: string | null;
  readonly ingestionState: XviIngestionState;
  readonly quarantineReasons: readonly string[];
  readonly modesAllowed: readonly XviOperatingMode[];
  readonly secretsPresent: false;
  readonly productionAuthority: false;
}

const PLAIN = Object.getPrototypeOf({});
const MODES = new Set<XviOperatingMode>(["ONLINE_GOVERNED","OFFLINE_GOVERNED","LOCAL_ONLY"]);
const CLASSES = new Set<XviEntityClass>(["UN_MEMBER_STATE","UN_OBSERVER_STATE","AU_MEMBER_SPECIAL_ENTITY"]);
const TRUST = new Set<XviSourceTrustClass>(["OFFICIAL","PEER_REVIEWED","LICENSED","PUBLIC_REFERENCE","COMMUNITY","UNVERIFIED"]);
const STATES = new Set<XviIngestionState>(["REGISTERED","QUARANTINED","REVIEWED","ADMITTED","REVOKED"]);

function plain(v: unknown, label: string): asserts v is Record<string, unknown> {
  if (v===null || typeof v!=="object" || Object.getPrototypeOf(v)!==PLAIN) throw new Error(`${label}_PLAIN_REQUIRED`);
  if (Object.getOwnPropertySymbols(v).length) throw new Error(`${label}_SYMBOLS_FORBIDDEN`);
  for (const k of Object.keys(v)) {
    const d=Object.getOwnPropertyDescriptor(v,k);
    if(!d || d.get || d.set) throw new Error(`${label}_ACCESSOR_FORBIDDEN`);
  }
}

function exact(v: Record<string, unknown>, keys: readonly string[], label: string) {
  const a=Object.keys(v).sort(), b=[...keys].sort();
  if(a.length!==b.length || a.some((k,i)=>k!==b[i])) throw new Error(`${label}_SCHEMA_MISMATCH`);
}

function iso(v: string){ return typeof v==="string" && /T/.test(v) && !Number.isNaN(Date.parse(v)); }
function sha256(v: string){ return typeof v==="string" && /^[a-f0-9]{64}$/.test(v); }
function strings(v: readonly string[], max:number, label:string, allowEmpty=false) {
  if(!Array.isArray(v) || v.length>max || (!allowEmpty && v.length<1)) throw new Error(`${label}_COUNT`);
  const s=new Set<string>();
  for(const x of v){ if(typeof x!=="string" || !x.trim() || x.length>240) throw new Error(`${label}_INVALID`); if(s.has(x)) throw new Error(`${label}_DUPLICATE`); s.add(x); }
}

export function validateJurisdictionRecord(input: unknown): Readonly<XviJurisdictionRecord> {
  plain(input,"JURISDICTION");
  exact(input,["id","canonicalName","isoAlpha2","isoAlpha3","isoNumeric","entityClass","unMember","auMember","status"],"JURISDICTION");
  const r=input as unknown as XviJurisdictionRecord;
  if(!/^jurisdiction:/.test(r.id) || !r.canonicalName?.trim()) throw new Error("JURISDICTION_IDENTITY_INVALID");
  if(!/^[A-Z]{2}$/.test(r.isoAlpha2) || !/^[A-Z]{3}$/.test(r.isoAlpha3) || !/^\d{3}$/.test(r.isoNumeric)) throw new Error("ISO_IDENTIFIER_INVALID");
  if(!CLASSES.has(r.entityClass) || r.status!=="ACTIVE") throw new Error("JURISDICTION_CLASS_INVALID");
  if(typeof r.unMember!=="boolean" || typeof r.auMember!=="boolean") throw new Error("MEMBERSHIP_FLAG_INVALID");
  if(r.entityClass==="UN_MEMBER_STATE" && !r.unMember) throw new Error("UN_MEMBER_CLASS_MISMATCH");
  if(r.entityClass==="UN_OBSERVER_STATE" && r.unMember) throw new Error("UN_OBSERVER_CLASS_MISMATCH");
  return Object.freeze({...r});
}

export function validateGlobalJurisdictionCatalog(input: unknown): readonly Readonly<XviJurisdictionRecord>[] {
  if(!Array.isArray(input) || input.length<1 || input.length>512) throw new Error("CATALOG_COUNT_INVALID");
  const rows=input.map(validateJurisdictionRecord);
  const ids=new Set<string>(), a2=new Set<string>(), a3=new Set<string>(), num=new Set<string>();
  for(const r of rows){
    if(ids.has(r.id)||a2.has(r.isoAlpha2)||a3.has(r.isoAlpha3)||num.has(r.isoNumeric)) throw new Error("CATALOG_DUPLICATE_IDENTITY");
    ids.add(r.id); a2.add(r.isoAlpha2); a3.add(r.isoAlpha3); num.add(r.isoNumeric);
  }
  const unMembers=rows.filter(r=>r.unMember).length;
  const unObservers=rows.filter(r=>r.entityClass==="UN_OBSERVER_STATE").length;
  const auMembers=rows.filter(r=>r.auMember).length;
  if(unMembers!==XVI_GLOBAL_JURISDICTION_EXPECTATIONS.unMembers) throw new Error("UN_MEMBER_COUNT_MISMATCH");
  if(unObservers!==XVI_GLOBAL_JURISDICTION_EXPECTATIONS.unObservers) throw new Error("UN_OBSERVER_COUNT_MISMATCH");
  if(auMembers!==XVI_GLOBAL_JURISDICTION_EXPECTATIONS.auMembers) throw new Error("AU_MEMBER_COUNT_MISMATCH");
  return Object.freeze(rows);
}

export function validateSourceRegistryEntry(input: unknown): Readonly<XviSourceRegistryEntry> {
  plain(input,"SOURCE");
  exact(input,["sourceId","provider","jurisdictionId","dataset","licenseId","allowedUse","trustClass","personalDataClass","refreshPolicy","schemaVersion","contentHash","retrievedAt","expiresAt","ingestionState","quarantineReasons","modesAllowed","secretsPresent","productionAuthority"],"SOURCE");
  const r=input as unknown as XviSourceRegistryEntry;
  if(!r.sourceId?.trim()||!r.provider?.trim()||!/^jurisdiction:/.test(r.jurisdictionId)||!r.dataset?.trim()||!r.licenseId?.trim()) throw new Error("SOURCE_IDENTITY_INVALID");
  strings(r.allowedUse,32,"ALLOWED_USE");
  strings(r.quarantineReasons,32,"QUARANTINE",true);
  strings(r.modesAllowed,3,"MODES");
  if(r.modesAllowed.some(m=>!MODES.has(m))) throw new Error("MODE_INVALID");
  if(!TRUST.has(r.trustClass)||!STATES.has(r.ingestionState)) throw new Error("SOURCE_STATE_INVALID");
  if(!["NONE","AGGREGATED","PUBLIC_PROFESSIONAL","RESTRICTED"].includes(r.personalDataClass)) throw new Error("PERSONAL_DATA_CLASS_INVALID");
  if(!["MANUAL","SCHEDULED","EVENT_DRIVEN"].includes(r.refreshPolicy)) throw new Error("REFRESH_POLICY_INVALID");
  if(!sha256(r.contentHash)||!iso(r.retrievedAt)||(r.expiresAt!==null&&!iso(r.expiresAt))) throw new Error("SOURCE_BINDING_INVALID");
  if(r.expiresAt!==null && Date.parse(r.expiresAt)<=Date.parse(r.retrievedAt)) throw new Error("SOURCE_EXPIRY_INVALID");
  if((r.trustClass==="UNVERIFIED" || r.quarantineReasons.length>0) && r.ingestionState!=="QUARANTINED") throw new Error("UNTRUSTED_SOURCE_MUST_QUARANTINE");
  if(r.ingestionState==="ADMITTED" && r.personalDataClass==="RESTRICTED") throw new Error("RESTRICTED_SOURCE_NOT_ADMITTED");
  if(r.secretsPresent!==false || r.productionAuthority!==false) throw new Error("AUTHORITY_OR_SECRET_VIOLATION");
  return Object.freeze({...r,allowedUse:Object.freeze([...r.allowedUse]),quarantineReasons:Object.freeze([...r.quarantineReasons]),modesAllowed:Object.freeze([...r.modesAllowed])});
}
