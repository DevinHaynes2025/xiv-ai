export type XviCoverageDomain =
  | "ORGANIZATIONS" | "INFRASTRUCTURE" | "RESEARCH" | "ECONOMY" | "LANGUAGE"
  | "PUBLIC_RECORDS" | "CIVIL_SOCIETY" | "HEALTH" | "EDUCATION" | "LOGISTICS"
  | "ENERGY" | "TELECOM" | "ENVIRONMENT";

export interface XviCoverageDimension {
  readonly domain: XviCoverageDomain;
  readonly expectedUnits: number;
  readonly coveredUnits: number;
  readonly freshUnits: number;
  readonly independentSourceRoots: number;
  readonly compatibleLicenseUnits: number;
  readonly quarantinedUnits: number;
  readonly disputedUnits: number;
}

export interface XviCountryCellCompletenessInput {
  readonly cellId: string;
  readonly jurisdictionId: string;
  readonly languageTagsExpected: readonly string[];
  readonly languageTagsCovered: readonly string[];
  readonly dimensions: readonly XviCoverageDimension[];
  readonly observedAt: string;
  readonly safeReadOnly: true;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

export interface XviCountryCellCompletenessReceipt {
  readonly schemaVersion: "xvi-country-cell-completeness-v1";
  readonly cellId: string;
  readonly jurisdictionId: string;
  readonly domainCoverage: readonly Readonly<{
    readonly domain: XviCoverageDomain;
    readonly coverageRatio: number;
    readonly freshnessRatio: number;
    readonly licenseCompatibilityRatio: number;
    readonly independentSourceRoots: number;
    readonly quarantinedUnits: number;
    readonly disputedUnits: number;
  }>[];
  readonly languageCoverageRatio: number;
  readonly uncoveredLanguages: readonly string[];
  readonly domainsWithGaps: readonly XviCoverageDomain[];
  readonly domainsNeedingReview: readonly XviCoverageDomain[];
  readonly requiresHumanReview: boolean;
  readonly completenessIsTruth: false;
  readonly safeReadOnly: true;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

const PLAIN = Object.getPrototypeOf({});
const DOMAINS = new Set<XviCoverageDomain>(["ORGANIZATIONS","INFRASTRUCTURE","RESEARCH","ECONOMY","LANGUAGE","PUBLIC_RECORDS","CIVIL_SOCIETY","HEALTH","EDUCATION","LOGISTICS","ENERGY","TELECOM","ENVIRONMENT"]);

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
function safeInt(v:number,min:number,max:number,label:string):void{
  if(!Number.isSafeInteger(v)||v<min||v>max) throw new Error(`${label}_INVALID`);
}
function uniqueStrings(v:readonly string[],max:number,label:string):void{
  if(!Array.isArray(v)||v.length>max) throw new Error(`${label}_COUNT`);
  const seen=new Set<string>();
  for(const x of v){if(typeof x!=="string"||!x.trim()||x.length>240) throw new Error(`${label}_INVALID`);if(seen.has(x)) throw new Error(`${label}_DUPLICATE`);seen.add(x);}
}
function iso(v:string,label:string):void{
  if(typeof v!=="string"||!v.includes("T")||Number.isNaN(Date.parse(v))) throw new Error(`${label}_INVALID`);
}
function ratio(n:number,d:number):number{
  return d===0 ? 1 : Number((n/d).toFixed(6));
}

export function validateCountryCellCompletenessInput(input: unknown): Readonly<XviCountryCellCompletenessInput> {
  plain(input,"COMPLETENESS");
  exact(input,["cellId","jurisdictionId","languageTagsExpected","languageTagsCovered","dimensions","observedAt","safeReadOnly","executionAuthority","mutationAuthority","productionAuthority"],"COMPLETENESS");
  const r=input as unknown as XviCountryCellCompletenessInput;
  if(!/^cell:jurisdiction:/.test(r.cellId)||!/^jurisdiction:/.test(r.jurisdictionId)) throw new Error("COMPLETENESS_IDENTITY_INVALID");
  uniqueStrings(r.languageTagsExpected,128,"LANGUAGE_EXPECTED");
  uniqueStrings(r.languageTagsCovered,128,"LANGUAGE_COVERED");
  for(const tag of [...r.languageTagsExpected,...r.languageTagsCovered]) if(!/^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(tag)) throw new Error("LANGUAGE_TAG_INVALID");
  if(!Array.isArray(r.dimensions)||r.dimensions.length<1||r.dimensions.length>DOMAINS.size) throw new Error("DIMENSION_COUNT_INVALID");
  const seen=new Set<XviCoverageDomain>();
  for(const raw of r.dimensions){
    plain(raw,"DIMENSION");
    exact(raw,["domain","expectedUnits","coveredUnits","freshUnits","independentSourceRoots","compatibleLicenseUnits","quarantinedUnits","disputedUnits"],"DIMENSION");
    const d=raw as unknown as XviCoverageDimension;
    if(!DOMAINS.has(d.domain)||seen.has(d.domain)) throw new Error("DIMENSION_DOMAIN_INVALID");
    seen.add(d.domain);
    safeInt(d.expectedUnits,0,1_000_000_000,"EXPECTED_UNITS");
    safeInt(d.coveredUnits,0,1_000_000_000,"COVERED_UNITS");
    safeInt(d.freshUnits,0,1_000_000_000,"FRESH_UNITS");
    safeInt(d.independentSourceRoots,0,1_000_000,"INDEPENDENT_ROOTS");
    safeInt(d.compatibleLicenseUnits,0,1_000_000_000,"COMPATIBLE_LICENSE_UNITS");
    safeInt(d.quarantinedUnits,0,1_000_000_000,"QUARANTINED_UNITS");
    safeInt(d.disputedUnits,0,1_000_000_000,"DISPUTED_UNITS");
    if(d.coveredUnits>d.expectedUnits||d.freshUnits>d.coveredUnits||d.compatibleLicenseUnits>d.coveredUnits||d.quarantinedUnits>d.coveredUnits||d.disputedUnits>d.coveredUnits) throw new Error("DIMENSION_BOUNDS_INVALID");
  }
  iso(r.observedAt,"OBSERVED_AT");
  if(r.safeReadOnly!==true||r.executionAuthority!==false||r.mutationAuthority!==false||r.productionAuthority!==false) throw new Error("COMPLETENESS_AUTHORITY_VIOLATION");
  return Object.freeze({...r,languageTagsExpected:Object.freeze([...r.languageTagsExpected]),languageTagsCovered:Object.freeze([...r.languageTagsCovered]),dimensions:Object.freeze(r.dimensions.map(d=>Object.freeze({...d})))});
}

export function issueCountryCellCompletenessReceipt(input: unknown): Readonly<XviCountryCellCompletenessReceipt> {
  const r=validateCountryCellCompletenessInput(input);
  const coveredSet=new Set(r.languageTagsCovered);
  const uncoveredLanguages=r.languageTagsExpected.filter(x=>!coveredSet.has(x));
  const domainCoverage=r.dimensions.map(d=>Object.freeze({
    domain:d.domain,
    coverageRatio:ratio(d.coveredUnits,d.expectedUnits),
    freshnessRatio:ratio(d.freshUnits,d.coveredUnits),
    licenseCompatibilityRatio:ratio(d.compatibleLicenseUnits,d.coveredUnits),
    independentSourceRoots:d.independentSourceRoots,
    quarantinedUnits:d.quarantinedUnits,
    disputedUnits:d.disputedUnits,
  }));
  const domainsWithGaps=domainCoverage.filter(d=>d.coverageRatio<1).map(d=>d.domain);
  const domainsNeedingReview=domainCoverage.filter(d=>d.quarantinedUnits>0||d.disputedUnits>0||d.independentSourceRoots<2||d.freshnessRatio<0.8||d.licenseCompatibilityRatio<1).map(d=>d.domain);
  const languageCoverageRatio=ratio(r.languageTagsExpected.length-uncoveredLanguages.length,r.languageTagsExpected.length);
  return Object.freeze({
    schemaVersion:"xvi-country-cell-completeness-v1",
    cellId:r.cellId,
    jurisdictionId:r.jurisdictionId,
    domainCoverage:Object.freeze(domainCoverage),
    languageCoverageRatio,
    uncoveredLanguages:Object.freeze([...uncoveredLanguages]),
    domainsWithGaps:Object.freeze([...domainsWithGaps]),
    domainsNeedingReview:Object.freeze([...new Set(domainsNeedingReview)]),
    requiresHumanReview:uncoveredLanguages.length>0||domainsNeedingReview.length>0,
    completenessIsTruth:false,
    safeReadOnly:true,
    executionAuthority:false,
    mutationAuthority:false,
    productionAuthority:false,
  });
}
