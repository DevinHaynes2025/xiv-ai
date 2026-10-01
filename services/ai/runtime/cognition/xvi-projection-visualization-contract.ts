export type XviSeriesKind = "HISTORICAL" | "PROJECTED";
export type XviChartKind = "BAR" | "LINE" | "PIE" | "SCATTER" | "NETWORK" | "TIMELINE";
export type XviCalibrationState = "UNTESTED" | "CALIBRATED" | "UNDERPERFORMING" | "DISPUTED";

export interface XviChartPoint {
  readonly x: string;
  readonly y: number;
  readonly lower: number | null;
  readonly upper: number | null;
  readonly kind: XviSeriesKind;
}

export interface XviChartSeries {
  readonly seriesId: string;
  readonly label: string;
  readonly unitLabel: string;
  readonly points: readonly XviChartPoint[];
}

export interface XviProjectionBacktest {
  readonly backtestId: string;
  readonly sampleCount: number;
  readonly meanAbsoluteError: number;
  readonly meanAbsolutePercentageError: number | null;
  readonly intervalCoverageRatio: number | null;
  readonly evaluatedAt: string;
}

export interface XviProjectionVisualizationInput {
  readonly visualizationId: string;
  readonly chartKind: XviChartKind;
  readonly title: string;
  readonly series: readonly XviChartSeries[];
  readonly sourceStoryId: string;
  readonly scenarioLabel: string;
  readonly assumptionsHash: string;
  readonly provenanceRootHashes: readonly string[];
  readonly backtest: XviProjectionBacktest | null;
  readonly observedAt: string;
  readonly safeReadOnly: true;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

export interface XviProjectionVisualizationReceipt {
  readonly schemaVersion: "xvi-projection-visualization-v1";
  readonly visualizationId: string;
  readonly chartKind: XviChartKind;
  readonly historicalPointCount: number;
  readonly projectedPointCount: number;
  readonly projectedPointsHaveIntervals: boolean;
  readonly independentProvenanceRoots: number;
  readonly calibrationState: XviCalibrationState;
  readonly canRender: boolean;
  readonly requiresHumanReview: boolean;
  readonly historicalAndProjectedSeparated: true;
  readonly safeReadOnly: true;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

const PLAIN = Object.getPrototypeOf({});
const CHARTS = new Set<XviChartKind>(["BAR","LINE","PIE","SCATTER","NETWORK","TIMELINE"]);

function plain(v:unknown,label:string):asserts v is Record<string,unknown>{
  if(v===null||typeof v!=="object"||Object.getPrototypeOf(v)!==PLAIN) throw new Error(`${label}_PLAIN_REQUIRED`);
  if(Object.getOwnPropertySymbols(v).length) throw new Error(`${label}_SYMBOLS_FORBIDDEN`);
  for(const k of Object.keys(v)){const d=Object.getOwnPropertyDescriptor(v,k);if(!d||d.get||d.set) throw new Error(`${label}_ACCESSOR_FORBIDDEN`);}
}
function exact(v:Record<string,unknown>,keys:readonly string[],label:string):void{
  const a=Object.keys(v).sort(),b=[...keys].sort(); if(a.length!==b.length||a.some((k,i)=>k!==b[i])) throw new Error(`${label}_SCHEMA_MISMATCH`);
}
function iso(v:string,label:string):void{if(typeof v!=="string"||!v.includes("T")||Number.isNaN(Date.parse(v))) throw new Error(`${label}_INVALID`);}
function hash(v:string,label:string):void{if(!/^[a-f0-9]{64}$/.test(v)) throw new Error(`${label}_INVALID`);}
function finite(v:number,label:string):void{if(!Number.isFinite(v)) throw new Error(`${label}_INVALID`);}
function safeInt(v:number,min:number,max:number,label:string):void{if(!Number.isSafeInteger(v)||v<min||v>max) throw new Error(`${label}_INVALID`);}

export function validateProjectionVisualizationInput(input:unknown):Readonly<XviProjectionVisualizationInput>{
  plain(input,"PROJECTION_VIZ");
  exact(input,["visualizationId","chartKind","title","series","sourceStoryId","scenarioLabel","assumptionsHash","provenanceRootHashes","backtest","observedAt","safeReadOnly","executionAuthority","mutationAuthority","productionAuthority"],"PROJECTION_VIZ");
  const r=input as unknown as XviProjectionVisualizationInput;
  if(!/^viz:/.test(r.visualizationId)||!CHARTS.has(r.chartKind)||!r.title?.trim()||!/^story:/.test(r.sourceStoryId)||!r.scenarioLabel?.trim()) throw new Error("PROJECTION_VIZ_IDENTITY_INVALID");
  hash(r.assumptionsHash,"ASSUMPTIONS_HASH");
  if(!Array.isArray(r.provenanceRootHashes)||r.provenanceRootHashes.length<1||r.provenanceRootHashes.length>128) throw new Error("PROVENANCE_ROOT_COUNT_INVALID");
  const roots=new Set<string>(); for(const h of r.provenanceRootHashes){hash(h,"PROVENANCE_ROOT_HASH");if(roots.has(h)) throw new Error("PROVENANCE_ROOT_DUPLICATE");roots.add(h);}
  if(!Array.isArray(r.series)||r.series.length<1||r.series.length>32) throw new Error("SERIES_COUNT_INVALID");
  const seriesIds=new Set<string>(); let hasProjected=false;
  for(const raw of r.series){
    plain(raw,"SERIES"); exact(raw,["seriesId","label","unitLabel","points"],"SERIES");
    const s=raw as unknown as XviChartSeries;
    if(!s.seriesId?.trim()||seriesIds.has(s.seriesId)||!s.label?.trim()||!s.unitLabel?.trim()||!Array.isArray(s.points)||s.points.length<1||s.points.length>10000) throw new Error("SERIES_INVALID");
    seriesIds.add(s.seriesId);
    for(const rawPoint of s.points){
      plain(rawPoint,"POINT"); exact(rawPoint,["x","y","lower","upper","kind"],"POINT");
      const p=rawPoint as unknown as XviChartPoint;
      if(!p.x?.trim()||!["HISTORICAL","PROJECTED"].includes(p.kind)) throw new Error("POINT_INVALID");
      finite(p.y,"POINT_Y");
      if(p.kind==="PROJECTED"){
        hasProjected=true;
        if(p.lower===null||p.upper===null) throw new Error("PROJECTED_INTERVAL_REQUIRED");
        finite(p.lower,"POINT_LOWER"); finite(p.upper,"POINT_UPPER");
        if(p.lower>p.upper||p.y<p.lower||p.y>p.upper) throw new Error("PROJECTED_INTERVAL_INVALID");
      } else if(p.lower!==null||p.upper!==null) throw new Error("HISTORICAL_INTERVAL_FORBIDDEN");
    }
  }
  if(!hasProjected && r.backtest!==null) throw new Error("BACKTEST_WITHOUT_PROJECTION");
  if(r.backtest!==null){
    plain(r.backtest,"BACKTEST"); exact(r.backtest,["backtestId","sampleCount","meanAbsoluteError","meanAbsolutePercentageError","intervalCoverageRatio","evaluatedAt"],"BACKTEST");
    const b=r.backtest;
    if(!/^backtest:/.test(b.backtestId)) throw new Error("BACKTEST_ID_INVALID");
    safeInt(b.sampleCount,1,1_000_000,"BACKTEST_SAMPLE_COUNT"); finite(b.meanAbsoluteError,"BACKTEST_MAE");
    if(b.meanAbsolutePercentageError!==null){finite(b.meanAbsolutePercentageError,"BACKTEST_MAPE");if(b.meanAbsolutePercentageError<0) throw new Error("BACKTEST_MAPE_INVALID");}
    if(b.intervalCoverageRatio!==null && (!Number.isFinite(b.intervalCoverageRatio)||b.intervalCoverageRatio<0||b.intervalCoverageRatio>1)) throw new Error("BACKTEST_COVERAGE_INVALID");
    iso(b.evaluatedAt,"BACKTEST_EVALUATED_AT");
  }
  iso(r.observedAt,"OBSERVED_AT");
  if(r.safeReadOnly!==true||r.executionAuthority!==false||r.mutationAuthority!==false||r.productionAuthority!==false) throw new Error("PROJECTION_VIZ_AUTHORITY_VIOLATION");
  return Object.freeze({...r,series:Object.freeze(r.series.map(s=>Object.freeze({...s,points:Object.freeze(s.points.map(p=>Object.freeze({...p})))}))),provenanceRootHashes:Object.freeze([...r.provenanceRootHashes]),backtest:r.backtest?Object.freeze({...r.backtest}):null});
}

export function assessProjectionVisualization(input:unknown):Readonly<XviProjectionVisualizationReceipt>{
  const r=validateProjectionVisualizationInput(input);
  let historicalPointCount=0,projectedPointCount=0,allProjectedIntervals=true;
  for(const s of r.series) for(const p of s.points){if(p.kind==="HISTORICAL") historicalPointCount++; else {projectedPointCount++;allProjectedIntervals=allProjectedIntervals&&p.lower!==null&&p.upper!==null;}}
  let calibrationState:XviCalibrationState="UNTESTED";
  if(r.backtest){
    const mape=r.backtest.meanAbsolutePercentageError;
    const coverage=r.backtest.intervalCoverageRatio;
    if((mape!==null&&mape>50)||(coverage!==null&&coverage<0.5)) calibrationState="UNDERPERFORMING";
    else calibrationState="CALIBRATED";
  }
  if(r.provenanceRootHashes.length<2) calibrationState="DISPUTED";
  const canRender=r.provenanceRootHashes.length>=1 && allProjectedIntervals && calibrationState!=="DISPUTED";
  return Object.freeze({
    schemaVersion:"xvi-projection-visualization-v1",
    visualizationId:r.visualizationId,
    chartKind:r.chartKind,
    historicalPointCount,
    projectedPointCount,
    projectedPointsHaveIntervals:allProjectedIntervals,
    independentProvenanceRoots:r.provenanceRootHashes.length,
    calibrationState,
    canRender,
    requiresHumanReview:calibrationState==="UNDERPERFORMING"||calibrationState==="DISPUTED",
    historicalAndProjectedSeparated:true,
    safeReadOnly:true,
    executionAuthority:false,
    mutationAuthority:false,
    productionAuthority:false,
  });
}
