import { createHash } from 'node:crypto';
import { appendFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { evaluateAuthenticatedAlignment, type AlignmentTrustContext, type SignedAlignmentReceipt } from './alignment-receipt';
import type { EcosystemTarget } from './ecosystem-alignment';

type EvidenceRecord = {
  sequence: number; tenantId: string; universeId: string; target: EcosystemTarget;
  issuerId: string; keyId: string; sourceRevision: string; humanApprovalRef: string;
  capabilityEvidenceDigest: string; signatureDigest: string; verifiedAt: string;
  state: 'RECORDED_FOR_CURRENT_TRUST_REEVALUATION'; previousHash: string; eventHash: string;
};
const SAFE_ID=/^[A-Za-z0-9_-]{1,80}$/;

function canonical(record: Omit<EvidenceRecord,'eventHash'>) { return JSON.stringify(record); }

export class AlignmentEvidenceLedger {
  private readonly path: string;
  private readonly tenantId: string;
  private readonly universeId: string;
  private readonly records: EvidenceRecord[]=[];
  private readonly now:()=>Date;

  constructor(input:{rootDirectory:string;tenantId:string;universeId:string;now?:()=>Date}) {
    if(!SAFE_ID.test(input.tenantId)||!SAFE_ID.test(input.universeId))throw new Error('invalid_scope');
    const root=resolve(input.rootDirectory);if(root===resolve('/')||root===resolve(process.cwd()))throw new Error('unsafe_storage_root');
    const directory=join(root,input.tenantId,input.universeId);mkdirSync(directory,{recursive:true,mode:0o700});
    this.path=join(directory,'alignment-evidence.jsonl');this.tenantId=input.tenantId;this.universeId=input.universeId;this.now=input.now??(()=>new Date());this.rehydrate();
  }

  recordVerified(context:AlignmentTrustContext,receipt:SignedAlignmentReceipt) {
    if(context.tenantId!==this.tenantId||context.universeId!==this.universeId)throw new Error('ledger_scope_mismatch');
    const decision=evaluateAuthenticatedAlignment(context,receipt);if(!decision.allowed)throw new Error(`alignment_not_verified:${decision.reason}`);
    const previousHash=this.records.at(-1)?.eventHash??'GENESIS';
    const unsigned:Omit<EvidenceRecord,'eventHash'>={sequence:this.records.length+1,tenantId:this.tenantId,universeId:this.universeId,target:receipt.payload.target,issuerId:receipt.payload.issuerId,keyId:receipt.payload.keyId,sourceRevision:receipt.payload.sourceRevision,humanApprovalRef:receipt.payload.humanApprovalRef,capabilityEvidenceDigest:receipt.payload.capabilityEvidenceDigest,signatureDigest:createHash('sha256').update(receipt.signature).digest('hex'),verifiedAt:this.now().toISOString(),state:'RECORDED_FOR_CURRENT_TRUST_REEVALUATION',previousHash};
    const record:EvidenceRecord={...unsigned,eventHash:createHash('sha256').update(canonical(unsigned)).digest('hex')};
    appendFileSync(this.path,`${JSON.stringify(record)}\n`,{encoding:'utf8',mode:0o600});this.records.push(record);
    return this.publicRecord(record);
  }

  list() { return this.records.map((record)=>this.publicRecord(record)); }

  private publicRecord(record:EvidenceRecord){return {...record,activeConfigurationClaimed:false as const,productionLive:false as const,partnershipClaimed:false as const,installedOnDevices:false as const,grantsAuthority:false as const};}
  private rehydrate(){let contents='';try{contents=readFileSync(this.path,'utf8')}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error}let previous='GENESIS';for(const line of contents.split('\n').filter(Boolean)){const record=JSON.parse(line) as EvidenceRecord;const {eventHash,...unsigned}=record;if(record.tenantId!==this.tenantId||record.universeId!==this.universeId||record.previousHash!==previous||createHash('sha256').update(canonical(unsigned)).digest('hex')!==eventHash)throw new Error('alignment_evidence_chain_invalid');this.records.push(record);previous=eventHash}}
}
