export type XviOperatingMode = "ONLINE_GOVERNED" | "OFFLINE_GOVERNED" | "LOCAL_ONLY";
export type XviWorldRegion = "AFRICA" | "AMERICAS" | "ASIA" | "EUROPE" | "OCEANIA" | "CROSS_REGION";
export type XviGlobalOrgClass =
  | "COMPANY" | "STARTUP" | "UNIVERSITY" | "RESEARCH_INSTITUTE" | "PUBLIC_INSTITUTION"
  | "NONPROFIT" | "CIVIL_SOCIETY" | "PORT" | "AIRPORT" | "LOGISTICS_NODE"
  | "FINANCIAL_INSTITUTION" | "HEALTH_INSTITUTION" | "ENERGY_OPERATOR" | "TELECOM_OPERATOR"
  | "INDUSTRY_ASSOCIATION" | "CULTURAL_INSTITUTION" | "OTHER";
export type XviEvidenceClass = "OFFICIAL_RECORD" | "LICENSED_DATASET" | "PEER_REVIEWED" | "PUBLIC_REFERENCE" | "COMMUNITY_REPORT" | "UNVERIFIED";
export type XviAdmissionState = "REGISTERED" | "QUARANTINED" | "REVIEWED" | "ADMITTED" | "REVOKED";

export interface XviLocalizedName {
  readonly languageTag: string;
  readonly value: string;
  readonly preferred: boolean;
}

export interface XviGlobalOrgProvenance {
  readonly sourceId: string;
  readonly sourceRecordId: string;
  readonly evidenceClass: XviEvidenceClass;
  readonly licenseId: string;
  readonly allowedUse: readonly string[];
  readonly contentHash: string;
  readonly retrievedAt: string;
  readonly quarantineReasons: readonly string[];
}

export interface XviGlobalOrganizationRecord {
  readonly entityId: string;
  readonly canonicalName: string;
  readonly localizedNames: readonly XviLocalizedName[];
  readonly aliases: readonly string[];
  readonly organizationClass: XviGlobalOrgClass;
  readonly primaryJurisdictionId: string;
  readonly operatingJurisdictionIds: readonly string[];
  readonly region: XviWorldRegion;
  readonly sectors: readonly string[];
  readonly languages: readonly string[];
  readonly provenance: readonly XviGlobalOrgProvenance[];
  readonly admissionState: XviAdmissionState;
  readonly modesAllowed: readonly XviOperatingMode[];
  readonly observedAt: string;
  readonly validFrom: string | null;
  readonly validTo: string | null;
  readonly personalDataClass: "NONE" | "AGGREGATED" | "PUBLIC_PROFESSIONAL" | "RESTRICTED";
  readonly secretsPresent: false;
  readonly executionAuthority: false;
  readonly networkAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

export interface XviGlobalOrganizationAdmissionReceipt {
  readonly schemaVersion: "xvi-global-organization-registry-v1";
  readonly entityId: string;
  readonly primaryJurisdictionId: string;
  readonly operatingJurisdictionCount: number;
  readonly region: XviWorldRegion;
  readonly admissionState: XviAdmissionState;
  readonly provenanceCount: number;
  readonly localizedNameCount: number;
  readonly requiresHumanReview: boolean;
  readonly safeReadOnly: true;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

const PLAIN=Object.getPrototypeOf({});
const MODES=new Set<XviOperatingMode>(["ONLINE_GOVERNED","OFFLINE_GOVERNED","LOCAL_ONLY"]);
const REGIONS=new Set<XviWorldRegion>(["AFRICA","AMERICAS","ASIA","EUROPE","OCEANIA","CROSS_REGION"]);
const ORG_CLASSES=new Set<XviGlobalOrgClass>(["COMPANY","STARTUP","UNIVERSITY","RESEARCH_INSTITUTE","PUBLIC_INSTITUTION","NONPROFIT","CIVIL_SOCIETY","PORT","AIRPORT","LOGISTICS_NODE","FINANCIAL_INSTITUTION","HEALTH_INSTITUTION","ENERGY_OPERATOR","TELECOM_OPERATOR","INDUSTRY_ASSOCIATION","CULTURAL_INSTITUTION","OTHER"]);
const EVIDENCE=new Set<XviEvidenceClass>(["OFFICIAL_RECORD","LICENSED_DATASET","PEER_REVIEWED","PUBLIC_REFERENCE","COMMUNITY_REPORT","UNVERIFIED"]);
const ADMISSION=new Set<XviAdmissionState>(["REGISTERED","QUARANTINED","REVIEWED","ADMITTED","REVOKED"]);

function plain(v:unknown,label:string):asserts v is Record<string,unknown>{
  if(v===null||typeof v!=="object"||Object.getPrototypeOf(v)!==PLAIN) throw new Error(`${label}_PLAIN_REQUIRED`);
  if(Object.getOwnPropertySymbols(v).length) throw new Error(`${label}_SYMBOLS_FORBIDDEN`);
  for(const k of Object.keys(v)){const d=Object.getOwnPropertyDescriptor(v,k);if(!d||d.get||d.set) throw new Error(`${label}_ACCESSOR_FORBIDDEN`);}
}
function exact(v:Record<string,unknown>,keys:readonly string[],label:string):void{
  const a=Object.keys(v).sort(),b=[...keys].sort(); if(a.length!==b.length||a.some((k,i)=>k!==b[i])) throw new Error(`${label}_SCHEMA_MISMATCH`);
}
function iso(v:string,label:string):void{
  if(typeof v!=="string"||!v.includes("T")||Number.isNaN(Date.parse(v))) throw new Error(`${label}_INVALID`);
}
function hash(v:string,label:string):void{ if(!/^[a-f0-9]{64}$/.test(v)) throw new Error(`${label}_INVALID`); }
function uniqueStrings(v:readonly string[],max:number,label:string,min=0):void{
  if(!Array.isArray(v)||v.length<min||v.length>max) throw new Error(`${label}_COUNT`);
  const seen=new Set<string>(); for(const x of v){if(typeof x!=="string"||!x.trim()||x.length>240) throw new Error(`${label}_INVALID`);if(seen.has(x)) throw new Error(`${label}_DUPLICATE`);seen.add(x);}
}

export function validateGlobalOrganizationRecord(input:unknown):Readonly<XviGlobalOrganizationRecord>{
  plain(input,"GLOBAL_ORG");
  exact(input,["entityId","canonicalName","localizedNames","aliases","organizationClass","primaryJurisdictionId","operatingJurisdictionIds","region","sectors","languages","provenance","admissionState","modesAllowed","observedAt","validFrom","validTo","personalDataClass","secretsPresent","executionAuthority","networkAuthority","mutationAuthority","productionAuthority"],"GLOBAL_ORG");
  const r=input as unknown as XviGlobalOrganizationRecord;
  if(!/^org:global:/.test(r.entityId)||!r.canonicalName?.trim()||!ORG_CLASSES.has(r.organizationClass)||!/^jurisdiction:/.test(r.primaryJurisdictionId)||!REGIONS.has(r.region)) throw new Error("GLOBAL_ORG_IDENTITY_INVALID");
  uniqueStrings(r.aliases,64,"ALIASES"); uniqueStrings(r.operatingJurisdictionIds,196,"OPERATING_JURISDICTIONS",1); uniqueStrings(r.sectors,64,"SECTORS"); uniqueStrings(r.languages,64,"LANGUAGES"); uniqueStrings(r.modesAllowed,3,"MODES",1);
  if(!r.operatingJurisdictionIds.includes(r.primaryJurisdictionId)) throw new Error("PRIMARY_JURISDICTION_MUST_OPERATE");
  if(r.operatingJurisdictionIds.some(j=>!/^jurisdiction:/.test(j))) throw new Error("OPERATING_JURISDICTION_INVALID");
  if(r.modesAllowed.some(m=>!MODES.has(m))) throw new Error("MODE_INVALID");
  if(!Array.isArray(r.localizedNames)||r.localizedNames.length<1||r.localizedNames.length>64) throw new Error("LOCALIZED_NAME_COUNT");
  let preferredCount=0; const langSeen=new Set<string>();
  for(const raw of r.localizedNames){
    plain(raw,"LOCALIZED_NAME"); exact(raw,["languageTag","value","preferred"],"LOCALIZED_NAME");
    const n=raw as unknown as XviLocalizedName;
    if(!/^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(n.languageTag)||!n.value?.trim()||n.value.length>240||typeof n.preferred!=="boolean") throw new Error("LOCALIZED_NAME_INVALID");
    if(langSeen.has(n.languageTag)) throw new Error("LOCALIZED_LANGUAGE_DUPLICATE"); langSeen.add(n.languageTag); if(n.preferred) preferredCount++;
  }
  if(preferredCount!==1) throw new Error("ONE_PREFERRED_LOCALIZED_NAME_REQUIRED");
  if(!Array.isArray(r.provenance)||r.provenance.length<1||r.provenance.length>64) throw new Error("PROVENANCE_REQUIRED");
  for(const raw of r.provenance){
    plain(raw,"PROVENANCE"); exact(raw,["sourceId","sourceRecordId","evidenceClass","licenseId","allowedUse","contentHash","retrievedAt","quarantineReasons"],"PROVENANCE");
    const p=raw as unknown as XviGlobalOrgProvenance;
    if(!p.sourceId?.trim()||!p.sourceRecordId?.trim()||!EVIDENCE.has(p.evidenceClass)||!p.licenseId?.trim()) throw new Error("PROVENANCE_IDENTITY_INVALID");
    uniqueStrings(p.allowedUse,32,"ALLOWED_USE"); uniqueStrings(p.quarantineReasons,32,"QUARANTINE_REASONS"); hash(p.contentHash,"CONTENT_HASH"); iso(p.retrievedAt,"RETRIEVED_AT");
  }
  if(!ADMISSION.has(r.admissionState)||!["NONE","AGGREGATED","PUBLIC_PROFESSIONAL","RESTRICTED"].includes(r.personalDataClass)) throw new Error("GLOBAL_ORG_STATE_INVALID");
  if(r.admissionState==="ADMITTED"){
    if(r.personalDataClass==="RESTRICTED") throw new Error("RESTRICTED_NOT_ADMITTED");
    if(r.provenance.some(p=>p.evidenceClass==="UNVERIFIED"||p.quarantineReasons.length>0)) throw new Error("ADMISSION_REQUIRES_CLEAN_PROVENANCE");
  }
  if(r.provenance.some(p=>p.evidenceClass==="UNVERIFIED")&&r.admissionState!=="QUARANTINED") throw new Error("UNVERIFIED_MUST_QUARANTINE");
  iso(r.observedAt,"OBSERVED_AT");
  if(r.validFrom!==null) iso(r.validFrom,"VALID_FROM");
  if(r.validTo!==null) iso(r.validTo,"VALID_TO");
  if(r.validFrom&&r.validTo&&Date.parse(r.validFrom)>Date.parse(r.validTo)) throw new Error("TEMPORAL_RANGE_INVALID");
  if(r.secretsPresent!==false||r.executionAuthority!==false||r.networkAuthority!==false||r.mutationAuthority!==false||r.productionAuthority!==false) throw new Error("GLOBAL_ORG_AUTHORITY_VIOLATION");
  return Object.freeze({...r,localizedNames:Object.freeze(r.localizedNames.map(n=>Object.freeze({...n}))),aliases:Object.freeze([...r.aliases]),operatingJurisdictionIds:Object.freeze([...r.operatingJurisdictionIds]),sectors:Object.freeze([...r.sectors]),languages:Object.freeze([...r.languages]),provenance:Object.freeze(r.provenance.map(p=>Object.freeze({...p,allowedUse:Object.freeze([...p.allowedUse]),quarantineReasons:Object.freeze([...p.quarantineReasons])}))),modesAllowed:Object.freeze([...r.modesAllowed])});
}

export function issueGlobalOrganizationAdmissionReceipt(input:unknown):Readonly<XviGlobalOrganizationAdmissionReceipt>{
  const r=validateGlobalOrganizationRecord(input);
  return Object.freeze({
    schemaVersion:"xvi-global-organization-registry-v1",
    entityId:r.entityId,
    primaryJurisdictionId:r.primaryJurisdictionId,
    operatingJurisdictionCount:r.operatingJurisdictionIds.length,
    region:r.region,
    admissionState:r.admissionState,
    provenanceCount:r.provenance.length,
    localizedNameCount:r.localizedNames.length,
    requiresHumanReview:r.admissionState!=="ADMITTED"||r.provenance.some(p=>p.quarantineReasons.length>0),
    safeReadOnly:true,
    executionAuthority:false,
    mutationAuthority:false,
    productionAuthority:false,
  });
}
