export interface CouncilArtifact { artifactId:string; authorAgent:string; content:string; evidenceRefs:readonly string[]; }
export interface ReviewFinding { reviewer:string; severity:'INFO'|'WARN'|'BLOCK'; message:string; evidenceRefs:readonly string[]; }
export interface CouncilReview { artifactId:string; accepted:boolean; findings:readonly ReviewFinding[]; lessons:readonly string[]; requiresHumanReview:boolean; }
export const REVIEW_LEARNING_GUARDRAILS={offlineFirst:true,productionMutationAllowed:false,selfApprovalAllowed:false,modelWeightMutationAllowed:false,agentCodeMutationAllowed:false,blockWithoutEvidence:true} as const;
export function reviewArtifact(input:{artifact:CouncilArtifact; findings:readonly ReviewFinding[]}):CouncilReview{
  const blockers=input.findings.filter(f=>f.severity==='BLOCK');
  const evidenceMissing=input.artifact.evidenceRefs.length===0;
  const accepted=blockers.length===0&&!evidenceMissing;
  const lessons=input.findings.filter(f=>f.severity!=='INFO').map(f=>`${f.reviewer}:${f.message}`);
  return Object.freeze({artifactId:input.artifact.artifactId,accepted,findings:Object.freeze([...input.findings]),lessons:Object.freeze(lessons),requiresHumanReview:!accepted});
}
