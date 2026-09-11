import { strict as assert } from 'node:assert';
import { canBuild } from './global-developer-mesh';
import { chooseRoute } from './offline-online-tool-router';
import { archiveEligible } from './historical-archive-ingestion';
import { partnerState } from './partner-adapter-atlas';
import { evaluateBrainGrowth } from './local-brain-growth-controller';

assert.equal(canBuild({ developerId:'d1', region:'US', jurisdictionPolicyRef:'jp1', contractReceiptRef:'c1', securityReviewRef:'s1', status:'APPROVED', allowedScopes:['sandbox'], offlineBuildAllowed:true, productionMutationAllowed:false }), true);
assert.equal(chooseRoute({ dataClass:'TOP_SECRET', internetAvailable:true, localCapabilityAvailable:true, allowRemote:true }), 'OFFLINE');
assert.equal(archiveEligible({ recordId:'r1', title:'Historical record', claimKind:'FACT', sourceRefs:['src1'], confidence:'HIGH', contentHash:'abc', approvedForSharedBrain:true }), true);
assert.equal(partnerState({ name:'Example', domain:'OTHER', state:'TARGET', apiReceiptRef:'api', contractReceiptRef:'contract' }), 'VERIFIED_PARTNER');
assert.equal(evaluateBrainGrowth({ candidateId:'g1', capability:'private-rag', sourceRefs:['e1'], evalScore:0.93, securityPassed:true, privacyPassed:true, humanApproved:true, modelWeightMutationRequested:false }), 'APPROVE_SHARED_MEMORY');
assert.equal(evaluateBrainGrowth({ candidateId:'g2', capability:'self-rewrite', sourceRefs:['e1'], evalScore:1, securityPassed:true, privacyPassed:true, humanApproved:true, modelWeightMutationRequested:true }), 'REJECT');

console.log('12D-83 global developer/archive/partner atlas/local brain contracts: OK');
