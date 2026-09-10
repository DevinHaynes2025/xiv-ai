import assert from 'node:assert/strict';
import { buildFounderTwin } from './founder-twin';
import { prioritizeCooPackets } from './virtual-coo';
import { validateSealedSecret } from './confidential-vault';
import { compileLeadershipGenome } from './leadership-genome';
import { organizeDocuments } from './document-governance-catalog';

const twin = buildFounderTwin({ principles:[{ key:'lean', statement:'Use lean iteration and evidence gates.', evidenceRefs:['FOUNDER:LEAN'] }] });
assert.equal(twin.identity, 'Devin Xavier Haynes');
assert.equal(twin.literalMindClone, false);
assert.equal(twin.authority, 'ADVISORY_ONLY');

const packets = prioritizeCooPackets([{ packetId:'ops-1', domain:'OPERATIONS', objective:'Coordinate offline agents', evidenceRefs:['TEST:OPS'], requiresHumanApproval:true }]);
assert.equal(packets.length, 1);

assert.equal(validateSealedSecret({ secretId:'finance-key', classification:'TOP_SECRET', locatorRef:'vault:xiv/finance/key' }), true);
assert.equal(validateSealedSecret({ secretId:'bad', classification:'TOP_SECRET', locatorRef:'plaintext-value' }), false);

const genome = compileLeadershipGenome([{ geneId:'g1', trait:'evidence-first', weight:0.95, evidenceRefs:['FOUNDER:DECISION'] }], ['OLLAMA_BUILDER','REVIEWER']);
assert.equal(genome.genes.length, 1);
assert.equal(genome.inheritedByAgents.length, 2);

const docs = organizeDocuments([{ path:'docs/secret.md', classification:'TOP_SECRET', ownerRole:'CEO', evidenceRefs:['DOC:1'], indexed:true }]);
assert.equal(docs[0].indexed, false);

console.log('12D-32 founder twin/COO/confidential vault contracts: OK');
