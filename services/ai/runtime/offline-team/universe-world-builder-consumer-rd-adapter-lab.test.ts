import { strict as assert } from 'node:assert';
import { universePolicy, validateUniverse } from './xiv-universe-world-builder';
import { canLearnFromProfile } from './consumer-entrepreneur-home';
import { validateConsultantMission } from './rd-consultant-team';
import { isVerifiedPartner } from './mobility-streaming-adapter-lab';

assert.equal(universePolicy.privateByDefault, true);
assert.equal(validateUniverse({ universeId:'u1', tenantId:'t1', ownerUserId:'p1', visibility:'PRIVATE', zones:['HOME'], authorizedAgentIds:['a1','a2'], deviceTargets:['PHONE'], productionMutationAllowed:false }).length, 0);
assert.equal(canLearnFromProfile({ tenantId:'t1', userId:'p1', mode:'CONSUMER', twinEnabled:true, consentRefs:['consent-1'], localFirst:true, offlineCapable:true, allowedCapabilities:['LOCAL_MEMORY'] }), true);
assert.equal(validateConsultantMission({ missionId:'m1', tenantId:'t1', roles:['PRODUCT','ENGINEERING'], evidenceRefs:['e1'], requiresHumanApproval:true, simulationOnly:true }).length, 0);
assert.equal(isVerifiedPartner({ adapterId:'x', providerName:'Example', domain:'STREAMING', state:'TARGET', userConsentRequired:true, rawPrivateDataAllowed:false }), false);
console.log('12D-79 universe world builder/consumer/R&D/adapter lab contracts: OK');
