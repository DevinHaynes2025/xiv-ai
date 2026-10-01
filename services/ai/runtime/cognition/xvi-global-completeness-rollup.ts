export type XviWorldRegion = "AFRICA" | "AMERICAS" | "ASIA" | "EUROPE" | "OCEANIA";
export type XviCoverageDomain =
  | "ORGANIZATIONS" | "INFRASTRUCTURE" | "RESEARCH" | "ECONOMY" | "LANGUAGE"
  | "PUBLIC_RECORDS" | "CIVIL_SOCIETY" | "HEALTH" | "EDUCATION" | "LOGISTICS"
  | "ENERGY" | "TELECOM" | "ENVIRONMENT";

export interface XviCountryDomainCoverage {
  readonly domain: XviCoverageDomain;
  readonly coverageRatio: number;
  readonly freshnessRatio: number;
  readonly licenseCompatibilityRatio: number;
  readonly independentSourceRoots: number;
  readonly quarantinedUnits: number;
  readonly disputedUnits: number;
}

export interface XviCountryCompletenessSnapshot {
  readonly jurisdictionId: string;
  readonly region: XviWorldRegion;
  readonly domainCoverage: readonly XviCountryDomainCoverage[];
  readonly languageCoverageRatio: number;
  readonly uncoveredLanguages: readonly string[];
  readonly observedAt: string;
}

export interface XviGlobalCompletenessRollupInput {
  readonly snapshots: readonly XviCountryCompletenessSnapshot[];
  readonly requiredDomains: readonly XviCoverageDomain[];
  readonly observedAt: string;
  readonly safeReadOnly: true;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

export interface XviRegionCompletenessRollup {
  readonly region: XviWorldRegion;
  readonly countryCount: number;
  readonly domainAverages: readonly Readonly<{
    readonly domain: XviCoverageDomain;
    readonly averageCoverageRatio: number;
    readonly averageFreshnessRatio: number;
    readonly averageLicenseCompatibilityRatio: number;
  }>[];
  readonly zeroCoverageCountries: readonly Readonly<{
    readonly jurisdictionId: string;
    readonly domain: XviCoverageDomain;
  }>[];
  readonly weakIndependenceCountries: readonly Readonly<{
    readonly jurisdictionId: string;
    readonly domain: XviCoverageDomain;
    readonly independentSourceRoots: number;
  }>[];
  readonly languageGapCountries: readonly string[];
  readonly quarantinedCountryCount: number;
  readonly disputedCountryCount: number;
  readonly requiresHumanReview: boolean;
}

export interface XviGlobalCompletenessRollupReceipt {
  readonly schemaVersion: "xvi-global-completeness-rollup-v1";
  readonly regionRollups: readonly XviRegionCompletenessRollup[];
  readonly totalCountries: number;
  readonly countriesWithAnyGap: readonly string[];
  readonly countriesWithZeroCoverage: readonly string[];
  readonly countriesWithLanguageGaps: readonly string[];
  readonly globalRequiresHumanReview: boolean;
  readonly averagesAreNotCompleteness: true;
  readonly safeReadOnly: true;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

const PLAIN = Object.getPrototypeOf({});
const REGIONS = new Set<XviWorldRegion>(["AFRICA","AMERICAS","ASIA","EUROPE","OCEANIA"]);
const DOMAINS = new Set<XviCoverageDomain>(["ORGANIZATIONS","INFRASTRUCTURE","RESEARCH","ECONOMY","LANGUAGE","PUBLIC_RECORDS","CIVIL_SOCIETY","HEALTH","EDUCATION","LOGISTICS","ENERGY","TELECOM","ENVIRONMENT"]);

function plain(v:unknown,label:string):asserts v is Record<string,unknown>{
  if(v===null||typeof v!=="object"||Object.getPrototypeOf(v)!==PLAIN) throw new Error(`${label}_PLAIN_REQUIRED`);
  if(Object.getOwnPropertySymbols(v).length) throw new Error(`${label}_SYMBOLS_FORBIDDEN`);
  for(const k of Object.keys(v)){const d=Object.getOwnPropertyDescriptor(v,k);if(!d||d.get||d.set) throw new Error(`${label}_ACCESSOR_FORBIDDEN`);}
}
function exact(v:Record<string,unknown>,keys:readonly string[],label:string):void{
  const a=Object.keys(v).sort(),b=[...keys].sort();
  if(a.length!==b.length||a.some((k,i)=>k!==b[i])) throw new Error(`${label}_SCHEMA_MISMATCH`);
}
function iso(v:string,label:string):void{
  if(typeof v!=="string"||!v.includes("T")||Number.isNaN(Date.parse(v))) throw new Error(`${label}_INVALID`);
}
function ratio(v:number,label:string):void{
  if(!Number.isFinite(v)||v<0||v>1) throw new Error(`${label}_INVALID`);
}
function safeInt(v:number,min:number,max:number,label:string):void{
  if(!Number.isSafeInteger(v)||v<min||v>max) throw new Error(`${label}_INVALID`);
}
function uniqueStrings(v:readonly string[],max:number,label:string,min=0):void{
  if(!Array.isArray(v)||v.length<min||v.length>max) throw new Error(`${label}_COUNT`);
  const seen=new Set<string>();
  for(const x of v){if(typeof x!=="string"||!x.trim()||x.length>240) throw new Error(`${label}_INVALID`);if(seen.has(x)) throw new Error(`${label}_DUPLICATE`);seen.add(x);}
}
function avg(values:number[]):number{
  return values.length===0?0:Number((values.reduce((a,b)=>a+b,0)/values.length).toFixed(6));
}

export function validateGlobalCompletenessRollupInput(input:unknown):Readonly<XviGlobalCompletenessRollupInput>{
  plain(input,"GLOBAL_ROLLUP");
  exact(input,["snapshots","requiredDomains","observedAt","safeReadOnly","executionAuthority","mutationAuthority","productionAuthority"],"GLOBAL_ROLLUP");
  const r=input as unknown as XviGlobalCompletenessRollupInput;
  if(!Array.isArray(r.snapshots)||r.snapshots.length<1||r.snapshots.length>196) throw new Error("SNAPSHOT_COUNT_INVALID");
  uniqueStrings(r.requiredDomains,DOMAINS.size,"REQUIRED_DOMAINS",1);
  if(r.requiredDomains.some(x=>!DOMAINS.has(x))) throw new Error("REQUIRED_DOMAIN_INVALID");
  const countries=new Set<string>();
  for(const raw of r.snapshots){
    plain(raw,"COUNTRY_SNAPSHOT");
    exact(raw,["jurisdictionId","region","domainCoverage","languageCoverageRatio","uncoveredLanguages","observedAt"],"COUNTRY_SNAPSHOT");
    const s=raw as unknown as XviCountryCompletenessSnapshot;
    if(!/^jurisdiction:/.test(s.jurisdictionId)||countries.has(s.jurisdictionId)||!REGIONS.has(s.region)) throw new Error("COUNTRY_SNAPSHOT_IDENTITY_INVALID");
    countries.add(s.jurisdictionId);
    ratio(s.languageCoverageRatio,"LANGUAGE_COVERAGE_RATIO");
    uniqueStrings(s.uncoveredLanguages,128,"UNCOVERED_LANGUAGES");
    iso(s.observedAt,"COUNTRY_OBSERVED_AT");
    if(!Array.isArray(s.domainCoverage)||s.domainCoverage.length<1||s.domainCoverage.length>DOMAINS.size) throw new Error("COUNTRY_DOMAIN_COUNT_INVALID");
    const seen=new Set<XviCoverageDomain>();
    for(const rawDomain of s.domainCoverage){
      plain(rawDomain,"COUNTRY_DOMAIN");
      exact(rawDomain,["domain","coverageRatio","freshnessRatio","licenseCompatibilityRatio","independentSourceRoots","quarantinedUnits","disputedUnits"],"COUNTRY_DOMAIN");
      const d=rawDomain as unknown as XviCountryDomainCoverage;
      if(!DOMAINS.has(d.domain)||seen.has(d.domain)) throw new Error("COUNTRY_DOMAIN_INVALID");
      seen.add(d.domain);
      ratio(d.coverageRatio,"COVERAGE_RATIO"); ratio(d.freshnessRatio,"FRESHNESS_RATIO"); ratio(d.licenseCompatibilityRatio,"LICENSE_RATIO");
      safeInt(d.independentSourceRoots,0,1_000_000,"INDEPENDENT_ROOTS"); safeInt(d.quarantinedUnits,0,1_000_000_000,"QUARANTINED_UNITS"); safeInt(d.disputedUnits,0,1_000_000_000,"DISPUTED_UNITS");
    }
  }
  iso(r.observedAt,"OBSERVED_AT");
  if(r.safeReadOnly!==true||r.executionAuthority!==false||r.mutationAuthority!==false||r.productionAuthority!==false) throw new Error("GLOBAL_ROLLUP_AUTHORITY_VIOLATION");
  return Object.freeze({...r,snapshots:Object.freeze(r.snapshots.map(s=>Object.freeze({...s,domainCoverage:Object.freeze(s.domainCoverage.map(d=>Object.freeze({...d}))),uncoveredLanguages:Object.freeze([...s.uncoveredLanguages])}))),requiredDomains:Object.freeze([...r.requiredDomains])});
}

export function issueGlobalCompletenessRollup(input:unknown):Readonly<XviGlobalCompletenessRollupReceipt>{
  const r=validateGlobalCompletenessRollupInput(input);
  const byRegion=new Map<XviWorldRegion,XviCountryCompletenessSnapshot[]>();
  for(const s of r.snapshots){const list=byRegion.get(s.region)??[];list.push(s);byRegion.set(s.region,list);}
  const countriesWithAnyGap=new Set<string>(),countriesWithZeroCoverage=new Set<string>(),countriesWithLanguageGaps=new Set<string>();
  const regionRollups:XviRegionCompletenessRollup[]=[];

  for(const region of ["AFRICA","AMERICAS","ASIA","EUROPE","OCEANIA"] as const){
    const snapshots=byRegion.get(region)??[];
    if(snapshots.length===0) continue;
    const zeroCoverageCountries:{jurisdictionId:string;domain:XviCoverageDomain}[]=[];
    const weakIndependenceCountries:{jurisdictionId:string;domain:XviCoverageDomain;independentSourceRoots:number}[]=[];
    const languageGapCountries:string[]=[];
    let quarantinedCountryCount=0,disputedCountryCount=0;

    const domainAverages=r.requiredDomains.map(domain=>{
      const rows=snapshots.map(s=>s.domainCoverage.find(d=>d.domain===domain));
      const coverage=rows.map(d=>d?.coverageRatio??0);
      const freshness=rows.map(d=>d?.freshnessRatio??0);
      const license=rows.map(d=>d?.licenseCompatibilityRatio??0);
      snapshots.forEach((s,i)=>{
        const d=rows[i];
        if(!d||d.coverageRatio===0){zeroCoverageCountries.push({jurisdictionId:s.jurisdictionId,domain});countriesWithZeroCoverage.add(s.jurisdictionId);countriesWithAnyGap.add(s.jurisdictionId);}
        if(!d||d.coverageRatio<1||d.freshnessRatio<0.8||d.licenseCompatibilityRatio<1||d.independentSourceRoots<2||d.quarantinedUnits>0||d.disputedUnits>0) countriesWithAnyGap.add(s.jurisdictionId);
        if(d&&d.independentSourceRoots<2) weakIndependenceCountries.push({jurisdictionId:s.jurisdictionId,domain,independentSourceRoots:d.independentSourceRoots});
      });
      return Object.freeze({domain,averageCoverageRatio:avg(coverage),averageFreshnessRatio:avg(freshness),averageLicenseCompatibilityRatio:avg(license)});
    });

    for(const s of snapshots){
      if(s.uncoveredLanguages.length>0||s.languageCoverageRatio<1){languageGapCountries.push(s.jurisdictionId);countriesWithLanguageGaps.add(s.jurisdictionId);countriesWithAnyGap.add(s.jurisdictionId);}
      if(s.domainCoverage.some(d=>d.quarantinedUnits>0)) quarantinedCountryCount++;
      if(s.domainCoverage.some(d=>d.disputedUnits>0)) disputedCountryCount++;
    }

    regionRollups.push(Object.freeze({
      region,
      countryCount:snapshots.length,
      domainAverages:Object.freeze(domainAverages),
      zeroCoverageCountries:Object.freeze(zeroCoverageCountries.map(x=>Object.freeze({...x}))),
      weakIndependenceCountries:Object.freeze(weakIndependenceCountries.map(x=>Object.freeze({...x}))),
      languageGapCountries:Object.freeze([...languageGapCountries]),
      quarantinedCountryCount,
      disputedCountryCount,
      requiresHumanReview:zeroCoverageCountries.length>0||weakIndependenceCountries.length>0||languageGapCountries.length>0||quarantinedCountryCount>0||disputedCountryCount>0,
    }));
  }

  return Object.freeze({
    schemaVersion:"xvi-global-completeness-rollup-v1",
    regionRollups:Object.freeze(regionRollups),
    totalCountries:r.snapshots.length,
    countriesWithAnyGap:Object.freeze([...countriesWithAnyGap].sort()),
    countriesWithZeroCoverage:Object.freeze([...countriesWithZeroCoverage].sort()),
    countriesWithLanguageGaps:Object.freeze([...countriesWithLanguageGaps].sort()),
    globalRequiresHumanReview:regionRollups.some(x=>x.requiresHumanReview),
    averagesAreNotCompleteness:true,
    safeReadOnly:true,
    executionAuthority:false,
    mutationAuthority:false,
    productionAuthority:false,
  });
}
