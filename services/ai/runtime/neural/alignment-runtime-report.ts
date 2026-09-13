import { buildReconciledAlignmentReport } from './reconciled-alignment-report';

export type RuntimeAlignmentInput=Parameters<typeof buildReconciledAlignmentReport>[0];
export type AlignmentRuntimeSource={kind:'DISCONNECTED'|'LOCAL_REFERENCE';read():RuntimeAlignmentInput};

export const DISCONNECTED_ALIGNMENT_RUNTIME:AlignmentRuntimeSource={kind:'DISCONNECTED',read:()=>({evidence:[]})};

export function buildRuntimeAlignmentReport(source:AlignmentRuntimeSource=DISCONNECTED_ALIGNMENT_RUNTIME){
  try{return buildReconciledAlignmentReport(source.read())}
  catch{return buildReconciledAlignmentReport({evidence:[]})}
}
