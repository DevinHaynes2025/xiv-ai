import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { OfflineStoryQueue, type OfflineStory } from './offline-story-queue';
import { preparePathwayCandidateFromQueue } from './pathway-evidence-bridge';
import { evaluatePathwayCandidate } from './neural-pathway-growth-engine';

const tenantId='pathway-tenant', outputHash='f'.repeat(64);
const story:OfflineStory={id:'story-1',tenantId,roleId:'load_test',objective:'synthetic reviewed story for pathway bridge',acceptance:['reviewed result is hash-bound'],dependencies:[],sourceRevision:'a'.repeat(40),masterPlanSha256:'b'.repeat(64),securityClass:'ORDINARY',kind:'PRODUCT_STORY'};
const req=()=>({tenantId,storyId:'story-1',expectedOutputHash:outputHash,pathwayId:'pathway-1',domain:'OPERATIONS' as const,version:1,confidence:0.91,evaluationScore:0.96,evidenceRefs:['run:synthetic-1'],reviewRefs:['review:one','review:two'],rollbackRef:'rollback:pathway-1'});
function fixture(){const dir=mkdtempSync(join(tmpdir(),'xiv-pathway-bridge-'));const q=new OfflineStoryQueue(join(dir,'q.sqlite'));return{q,done:()=>{q.close();rmSync(dir,{recursive:true,force:true});}};}
function moveToDone(q:OfflineStoryQueue){q.enqueue([story]);const lease=q.claimNext(tenantId,'load_test','worker-1',120000);assert.ok(lease);q.settle(lease!,{outcome:'DRAFT',outputHash,providerSettled:true});q.applyReviewDecision({tenantId,storyId:'story-1',reviewerId:'secure_code_reviewer',expectedOutputHash:outputHash,decision:'APPROVED',reviewRef:'review:queue-approved'});}

test('reviewed DONE story becomes a hash-bound candidate but never auto-activates or auto-approves',()=>{const f=fixture();try{moveToDone(f.q);const p=preparePathwayCandidateFromQueue(f.q,req());assert.equal(p.outputHash,outputHash);assert.equal(p.candidate.humanApproved,false);assert.equal(p.activationAttempted,false);assert.equal(p.learningPromoted,false);assert.equal(p.modelWeightMutation,false);assert.equal(p.productionMutation,false);assert.equal(p.humanDecision,'REQUIRED');assert.equal(p.currentEligibility.eligible,false);assert.ok(p.currentEligibility.reasons.includes('human approval required'));assert.ok(p.candidate.evidenceRefs.includes(`queue-story:${tenantId}:story-1`));assert.ok(p.candidate.evidenceRefs.includes(`output-sha256:${outputHash}`));}finally{f.done();}});

test('READY, LEASED, and AWAITING_REVIEW stories are not learning evidence',()=>{const f=fixture();try{f.q.enqueue([story]);assert.throws(()=>preparePathwayCandidateFromQueue(f.q,req()),/DONE/);const lease=f.q.claimNext(tenantId,'load_test','worker-1',120000);assert.ok(lease);assert.throws(()=>preparePathwayCandidateFromQueue(f.q,req()),/DONE/);f.q.settle(lease!,{outcome:'DRAFT',outputHash,providerSettled:true});assert.throws(()=>preparePathwayCandidateFromQueue(f.q,req()),/DONE/);}finally{f.done();}});

test('wrong tenant or stale output hash fails closed',()=>{const f=fixture();try{moveToDone(f.q);assert.throws(()=>preparePathwayCandidateFromQueue(f.q,{...req(),tenantId:'other-tenant'}),/not found/);assert.throws(()=>preparePathwayCandidateFromQueue(f.q,{...req(),expectedOutputHash:'e'.repeat(64)}),/mismatch/);}finally{f.done();}});

test('candidate can become eligible only after a separate human-approved copy satisfies existing pathway policy',()=>{const f=fixture();try{moveToDone(f.q);const p=preparePathwayCandidateFromQueue(f.q,req());const approved={...p.candidate,humanApproved:true as const};const result=evaluatePathwayCandidate(approved);assert.equal(result.eligible,true);}finally{f.done();}});

test('invalid scores, duplicate review refs, and malformed identities are rejected before candidate creation',()=>{const f=fixture();try{moveToDone(f.q);assert.throws(()=>preparePathwayCandidateFromQueue(f.q,{...req(),confidence:NaN}),/finite/);assert.throws(()=>preparePathwayCandidateFromQueue(f.q,{...req(),reviewRefs:['same','same']}),/duplicate/);assert.throws(()=>preparePathwayCandidateFromQueue(f.q,{...req(),pathwayId:'bad id'}),/identities/);}finally{f.done();}});
