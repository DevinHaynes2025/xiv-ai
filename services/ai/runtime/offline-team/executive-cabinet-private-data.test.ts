import { XIV_EXECUTIVE_CABINET, EXECUTIVE_GUARDRAILS } from './executive-cabinet';
import { buildCloudDnaPackage } from './cloud-dna-package';
import { canIndex, assertTenant } from './private-data-brain';

if (!XIV_EXECUTIVE_CABINET.some(x=>x.role==='CTO')) throw new Error('CTO missing');
if (!XIV_EXECUTIVE_CABINET.some(x=>x.role==='CHIEF_DATA')) throw new Error('Chief Data missing');
if (EXECUTIVE_GUARDRAILS.autonomousMoneyMovement) throw new Error('money movement must remain blocked');
const dna=buildCloudDnaPackage({tenantId:'xiv',genomeVersion:'1',capabilities:['offline-ollama'],policyRefs:['policy://xiv'],modelRefs:['ollama://qwen2.5-coder:7b'],secretRefs:['vault://xiv/prod'],target:'LOCAL'});
if (dna.payloadHash.length!==64) throw new Error('dna hash invalid');
if (canIndex({id:'s',tenantId:'xiv',classification:'TOP_SECRET',sourceRef:'vault://x',contentHash:'abc',indexed:false,derived:false})) throw new Error('top secret indexed');
let blocked=false; try { assertTenant({id:'x',tenantId:'a',classification:'INTERNAL',sourceRef:'src',contentHash:'h',indexed:false,derived:false},'b'); } catch { blocked=true; }
if(!blocked) throw new Error('cross tenant not blocked');
console.log('12D-35 executive cabinet/private data/cloud DNA contracts: OK');
