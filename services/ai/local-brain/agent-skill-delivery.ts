import { SEALED_REDACTION } from './ceo-sealed-vault';
import {
  activateVerifiedTransfer,
  resumeTransfer,
  startResumableTransfer,
} from './resumable-package-transfer';
import { markInstallOrSync } from './compromised-node-quarantine';

export async function deliverAgentSkill(input: {
  tenantId: string;
  universeId: string;
  fromNodeId: string;
  toNodeId: string;
  skillName: string;
  source: string;
  sealed?: boolean;
  destinationOnline?: boolean;
  root?: string;
}) {
  const started = await startResumableTransfer({
    ...input,
    kind: 'agent_skill',
    bytes: input.sealed ? 'SEALED_FOUNDER_PRIORITY_TOKEN' : `skill:${input.skillName}\n${input.source}`,
    classification: input.sealed ? 'sealed_founder_priority' : 'internal',
    sealed: input.sealed,
    chunkChars: 32,
    root: input.root,
  });
  if (!started.accepted) {
    return { delivered: false as const, activated: false as const, authorityGranted: false as const, reason: started.reason, redacted: SEALED_REDACTION };
  }
  if (started.transfer.state === 'held_offline') {
    return { delivered: false as const, heldOffline: true as const, transfer: started.transfer, reason: started.transfer.reason };
  }
  const resumed = await resumeTransfer({
    transferId: started.transfer.id,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root: input.root,
  });
  if (!resumed.ok || resumed.transfer.integrity !== 'PASS') {
    return { delivered: false as const, transfer: resumed.transfer, reason: resumed.transfer?.reason ?? resumed.reason };
  }
  const activated = await activateVerifiedTransfer({
    transferId: started.transfer.id,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root: input.root,
  });
  const install = await markInstallOrSync({
    nodeId: input.toNodeId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: 'install',
    root: input.root,
  });
  return {
    delivered: true as const,
    activated: activated.activated,
    authorityGranted: install.authorityGranted,
    l4AutonomyEnabled: false as const,
    transfer: activated.transfer,
    reason: install.reason,
  };
}
