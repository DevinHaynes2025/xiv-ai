import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

export type VaultClassification = 'PUBLIC'|'INTERNAL'|'CONFIDENTIAL'|'TOP_SECRET';
export interface EncryptedTwinEnvelope { version:1; tenantId:string; userId:string; classification:VaultClassification; iv:string; salt:string; tag:string; ciphertext:string; createdAt:string; }

export function encryptTwinPayload(input:{tenantId:string;userId:string;classification:VaultClassification;payload:unknown;passphrase:string}):EncryptedTwinEnvelope {
  const salt=randomBytes(16); const iv=randomBytes(12); const key=scryptSync(input.passphrase,salt,32);
  const cipher=createCipheriv('aes-256-gcm',key,iv); const body=Buffer.from(JSON.stringify(input.payload),'utf8');
  const ciphertext=Buffer.concat([cipher.update(body),cipher.final()]); const tag=cipher.getAuthTag();
  return {version:1,tenantId:input.tenantId,userId:input.userId,classification:input.classification,iv:iv.toString('base64'),salt:salt.toString('base64'),tag:tag.toString('base64'),ciphertext:ciphertext.toString('base64'),createdAt:new Date().toISOString()};
}

export function decryptTwinPayload<T>(envelope:EncryptedTwinEnvelope, passphrase:string):T {
  const key=scryptSync(passphrase,Buffer.from(envelope.salt,'base64'),32); const decipher=createDecipheriv('aes-256-gcm',key,Buffer.from(envelope.iv,'base64'));
  decipher.setAuthTag(Buffer.from(envelope.tag,'base64')); const clear=Buffer.concat([decipher.update(Buffer.from(envelope.ciphertext,'base64')),decipher.final()]);
  return JSON.parse(clear.toString('utf8')) as T;
}

export const encryptedTwinVaultPolicy={algorithm:'AES-256-GCM',plaintextAtRestAllowed:false,topSecretExternalSyncAllowed:false,keyStorage:'external secret store or user-derived key; never commit keys'};