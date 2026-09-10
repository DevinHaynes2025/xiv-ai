import { createHash } from 'node:crypto';

export interface CloudDnaPackage { tenantId:string; genomeVersion:string; capabilities:string[]; policyRefs:string[]; modelRefs:string[]; secretRefs:string[]; target:'LOCAL'|'GOOGLE_CLOUD'|'AZURE'|'AWS'|'OTHER'; payloadHash:string; }

export function buildCloudDnaPackage(input: Omit<CloudDnaPackage,'payloadHash'>): CloudDnaPackage {
  if (input.secretRefs.some(x => !/^(vault|kms|env|secret-manager):\/\//.test(x))) throw new Error('Secrets must be sealed references');
  const canonical = JSON.stringify({...input, capabilities:[...input.capabilities].sort(), policyRefs:[...input.policyRefs].sort(), modelRefs:[...input.modelRefs].sort(), secretRefs:[...input.secretRefs].sort()});
  return {...input, payloadHash:createHash('sha256').update(canonical).digest('hex')};
}

export const CLOUD_DNA_GUARDRAILS = Object.freeze({ containsRawSecrets:false, productionAutoDeploy:false, tenantBoundaryRequired:true, verificationRequiredBeforeCloudUse:true });
