import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';

export type KnowledgeSecurityClass = 'ORDINARY' | 'TOP_SECRET';

export interface TenantKeyMaterial {
  keyId: string;
  key: Buffer;
}

export interface TenantKeyResolver {
  resolveKey(tenantId: string, keyId?: string): Promise<TenantKeyMaterial> | TenantKeyMaterial;
}

export interface KnowledgeVaultEnvelope {
  version: 1;
  tenantId: string;
  snapshotId: string;
  securityClass: KnowledgeSecurityClass;
  keyId: string;
  algorithm: 'aes-256-gcm';
  iv: string;
  authTag: string;
  ciphertext: string;
  aadHash: string;
  createdAt: string;
}

export interface EncryptedKnowledgeVaultConfig {
  ordinaryRoot: string;
  topSecretRoot: string;
  keyResolver: TenantKeyResolver;
}

function safeSegment(value: string, label: string): string {
  if (!value || value.length > 128 || value.includes('..') || /[\\/\0]/.test(value)) {
    throw new Error(`Invalid ${label}`);
  }
  return value;
}

function aadFor(envelope: Pick<KnowledgeVaultEnvelope, 'version' | 'tenantId' | 'snapshotId' | 'securityClass' | 'keyId'>): Buffer {
  return Buffer.from(JSON.stringify({
    version: envelope.version,
    tenantId: envelope.tenantId,
    snapshotId: envelope.snapshotId,
    securityClass: envelope.securityClass,
    keyId: envelope.keyId,
  }), 'utf8');
}

function assertKey(key: Buffer): void {
  if (!Buffer.isBuffer(key) || key.length !== 32) {
    throw new Error('Tenant knowledge-vault key must be exactly 32 bytes');
  }
}

export function mayEnterOrdinaryRag(securityClass: KnowledgeSecurityClass): boolean {
  return securityClass !== 'TOP_SECRET';
}

export function mayEnterOrdinaryEmbedding(securityClass: KnowledgeSecurityClass): boolean {
  return securityClass !== 'TOP_SECRET';
}

export class EncryptedKnowledgeVault {
  constructor(private readonly config: EncryptedKnowledgeVaultConfig) {}

  private rootFor(securityClass: KnowledgeSecurityClass): string {
    return securityClass === 'TOP_SECRET' ? this.config.topSecretRoot : this.config.ordinaryRoot;
  }

  private filePath(tenantId: string, snapshotId: string, securityClass: KnowledgeSecurityClass): string {
    const tenant = safeSegment(tenantId, 'tenantId');
    const snapshot = safeSegment(snapshotId, 'snapshotId');
    return path.join(this.rootFor(securityClass), tenant, `${snapshot}.xivvault.json`);
  }

  async saveSnapshot(input: {
    tenantId: string;
    snapshotId: string;
    securityClass: KnowledgeSecurityClass;
    payload: unknown;
  }): Promise<{ path: string; envelope: KnowledgeVaultEnvelope }> {
    safeSegment(input.tenantId, 'tenantId');
    safeSegment(input.snapshotId, 'snapshotId');
    const material = await this.config.keyResolver.resolveKey(input.tenantId);
    assertKey(material.key);
    safeSegment(material.keyId, 'keyId');

    const base = {
      version: 1 as const,
      tenantId: input.tenantId,
      snapshotId: input.snapshotId,
      securityClass: input.securityClass,
      keyId: material.keyId,
    };
    const aad = aadFor(base);
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', material.key, iv);
    cipher.setAAD(aad);
    const plaintext = Buffer.from(JSON.stringify(input.payload), 'utf8');
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const authTag = cipher.getAuthTag();
    const envelope: KnowledgeVaultEnvelope = {
      ...base,
      algorithm: 'aes-256-gcm',
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      ciphertext: ciphertext.toString('base64'),
      aadHash: createHash('sha256').update(aad).digest('hex'),
      createdAt: new Date().toISOString(),
    };

    const destination = this.filePath(input.tenantId, input.snapshotId, input.securityClass);
    await fs.mkdir(path.dirname(destination), { recursive: true, mode: 0o700 });
    const temporary = `${destination}.${process.pid}.${randomBytes(6).toString('hex')}.tmp`;
    await fs.writeFile(temporary, JSON.stringify(envelope), { encoding: 'utf8', mode: 0o600 });
    await fs.rename(temporary, destination);
    try { await fs.chmod(destination, 0o600); } catch { /* best effort on platforms without POSIX modes */ }
    return { path: destination, envelope };
  }

  async loadSnapshot<T = unknown>(input: {
    tenantId: string;
    snapshotId: string;
    securityClass: KnowledgeSecurityClass;
  }): Promise<T> {
    const file = this.filePath(input.tenantId, input.snapshotId, input.securityClass);
    const envelope = JSON.parse(await fs.readFile(file, 'utf8')) as KnowledgeVaultEnvelope;
    if (envelope.version !== 1 || envelope.algorithm !== 'aes-256-gcm') throw new Error('Unsupported knowledge-vault envelope');
    if (envelope.tenantId !== input.tenantId || envelope.snapshotId !== input.snapshotId || envelope.securityClass !== input.securityClass) {
      throw new Error('Knowledge-vault scope mismatch');
    }
    const material = await this.config.keyResolver.resolveKey(input.tenantId, envelope.keyId);
    assertKey(material.key);
    if (material.keyId !== envelope.keyId) throw new Error('Knowledge-vault key id mismatch');
    const aad = aadFor(envelope);
    const actualAadHash = createHash('sha256').update(aad).digest('hex');
    if (actualAadHash !== envelope.aadHash) throw new Error('Knowledge-vault AAD integrity failure');
    const decipher = createDecipheriv('aes-256-gcm', material.key, Buffer.from(envelope.iv, 'base64'));
    decipher.setAAD(aad);
    decipher.setAuthTag(Buffer.from(envelope.authTag, 'base64'));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(envelope.ciphertext, 'base64')),
      decipher.final(),
    ]);
    return JSON.parse(plaintext.toString('utf8')) as T;
  }
}
