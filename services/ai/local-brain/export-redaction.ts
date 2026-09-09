import {
  redactSealedFields,
  redactSealedForRouting,
  SEALED_REDACTION,
} from './ceo-sealed-vault';
import { DEFAULT_REPLICATION_POLICY } from './universe-os-types';
import { classificationGate } from './permission-classification-gate';
import type { PackageClassification, PackageManifest } from './developer-platform-types';

export { SEALED_REDACTION };

export function sealedReplicationPolicy(classification: PackageClassification) {
  return DEFAULT_REPLICATION_POLICY[classification];
}

export type ExportEnvelope = {
  packageId: string;
  name: string;
  version: string;
  kind: PackageManifest['kind'];
  classification: PackageClassification;
  payload: string;
  files: Record<string, string>;
  sealedPayload?: string;
  founderPriority?: string;
  secret?: string;
  replicating: false;
  productionAuthorization: false;
};

export function redactPackageExport(input: {
  manifest: PackageManifest;
  extra?: Record<string, unknown>;
}): {
  envelope: ExportEnvelope;
  leakedSealed: false;
  redacted: true;
  replicating: false;
} {
  const gate = classificationGate(input.manifest.classification);
  const replication = sealedReplicationPolicy(input.manifest.classification);
  const sealed = replication === 'never' || input.manifest.classification === 'sealed_founder_priority' || !gate.exportable;
  const raw = {
    packageId: input.manifest.id,
    name: input.manifest.name,
    version: input.manifest.version,
    kind: input.manifest.kind,
    classification: input.manifest.classification,
    payload: sealed ? input.manifest.payload : input.manifest.payload,
    files: sealed ? {} : { ...input.manifest.files },
    sealedPayload: input.manifest.classification === 'sealed_founder_priority' ? input.manifest.payload : undefined,
    founderPriority: input.manifest.classification === 'sealed_founder_priority' ? input.manifest.payload : undefined,
    secret: undefined as string | undefined,
    replicating: false as const,
    productionAuthorization: false as const,
    ...input.extra,
  };
  const redacted = redactSealedFields(raw);
  return {
    envelope: {
      packageId: raw.packageId,
      name: raw.name,
      version: raw.version,
      kind: raw.kind,
      classification: raw.classification,
      payload: sealed ? SEALED_REDACTION : input.manifest.payload,
      files: sealed ? {} : raw.files,
      sealedPayload: redacted.sealedPayload as string | undefined,
      founderPriority: redacted.founderPriority as string | undefined,
      secret: redacted.secret as string | undefined,
      replicating: false,
      productionAuthorization: false,
    },
    leakedSealed: false,
    redacted: true,
    replicating: false,
  };
}

export async function redactSealedPackageForRoute(input: {
  recordId: string;
  tenantId: string;
  universeId: string;
  destination: 'agent_bus' | 'cloud' | 'peer' | 'provider';
  root?: string;
}) {
  return redactSealedForRouting({
    recordId: input.recordId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    destination: input.destination,
    actor: { kind: 'ordinary_agent', id: 'marketplace-exporter', role: 'researcher' },
    root: input.root,
  });
}
