import { strict as assert } from 'node:assert';
import { encryptTwinPayload, decryptTwinPayload, encryptedTwinVaultPolicy } from './encrypted-twin-vault';
import { canEmbedLocally, localEmbeddingPolicy } from './local-embedding-adapter';
import { decideMemoryControl } from './twin-memory-controls';
import { validateDocumentationCouncilMeeting } from './documentation-council-meeting-recorder';

const encrypted=encryptTwinPayload({tenantId:'t1',userId:'u1',classification:'TOP_SECRET',payload:{note:'private'},passphrase:'test-passphrase'});
assert.notEqual(encrypted.ciphertext.includes('private'),true);
assert.deepEqual(decryptTwinPayload<{note:string}>(encrypted,'test-passphrase'),{note:'private'});
assert.equal(encryptedTwinVaultPolicy.plaintextAtRestAllowed,false);
assert.equal(localEmbeddingPolicy.externalEmbeddingByDefault,false);
assert.equal(canEmbedLocally({provider:'OLLAMA_LOCAL',model:'local',status:'VERIFIED_LOCAL',endpoint:'http://127.0.0.1:11434',receiptRef:'r1'},'TOP_SECRET'),true);
assert.equal(canEmbedLocally({provider:'LOCAL_MODEL',model:'remote-ish',status:'AVAILABLE_UNVERIFIED',endpoint:'http://127.0.0.1:11434'},'CONFIDENTIAL'),false);
assert.equal(decideMemoryControl({tenantId:'t1',userId:'u1',memoryId:'m1',action:'FORGET',requestedAt:new Date().toISOString(),userAuthorized:true}).requiresTombstone,true);
assert.equal(validateDocumentationCouncilMeeting({meetingId:'m',tenantId:'t1',startedAt:new Date().toISOString(),participants:['writer','security'],topic:'docs',votes:[{role:'writer',recommendation:'revise',confidence:.9,evidenceRefs:['e1']},{role:'security',recommendation:'approve with changes',confidence:.8,evidenceRefs:['e2'],dissent:'retain warning'}],humanApproved:false,classification:'INTERNAL'}).ok,true);
console.log('12D-77 encrypted twin vault/local embedding/memory controls/doc recorder contracts: OK');