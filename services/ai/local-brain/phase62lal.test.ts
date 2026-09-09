import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { consumeNetworkBudget } from './bandwidth-resource-governor';
import {
  authorizeAppNetworkNode,
  configureAppNetworkNode,
  isPeerEligible,
  registerAppNetworkNode,
} from './compromised-node-quarantine';
import { scanXivLocalForToken } from './content-addressed-store';
import { CEO_SEALED_VAULT_FILE, SEALED_REDACTION } from './ceo-sealed-vault';
import { resetCloudPeerAdapters } from './cloud-peer-adapters';
import { resetCloudRelays } from './cloud-relay-adapters';
import {
  DISTRIBUTED_APP_NETWORK_ARCHITECTURE,
  DISTRIBUTED_APP_NETWORK_LOCKS,
} from './distributed-app-network-types';
import {
  buildDistributedAppNetworkHealthReport,
  runDistributedAppNetworkCycle,
} from './distributed-app-network-runtime';
import { listEdgeCache } from './edge-package-cache';
import { listTransferEnvelopes } from './resumable-package-transfer';
import { listUniverseSync } from './peer-universe-sync';

const root = await mkdtemp(join(tmpdir(), 'xiv-62lal-'));
const tenantId = '62lal-tenant';
const universeId = '62lal-universe';
const secret = 'SEALED_FOUNDER_PRIORITY_TOKEN';
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

try {
  resetCloudRelays();
  resetCloudPeerAdapters();

  check(
    'US-AL1',
    DISTRIBUTED_APP_NETWORK_ARCHITECTURE.join(' → ') ===
      'xiv_universe → local_brain → agent_workcells → packages_knowledge → secure_transfer → authorized_peer_node → integrity_verification → local_activation → evidence → synchronization → learning',
    'Distributed App Network architecture cycle is recorded in order.',
  );
  check(
    'US-AL28',
    DISTRIBUTED_APP_NETWORK_LOCKS.L4_AUTONOMY_ENABLED === false &&
      DISTRIBUTED_APP_NETWORK_LOCKS.INSTALLATION_GRANTS_AUTHORITY === false &&
      DISTRIBUTED_APP_NETWORK_LOCKS.SYNC_GRANTS_AUTHORITY === false &&
      DISTRIBUTED_APP_NETWORK_LOCKS.CEO_SEALED_VAULT_IN_ORDINARY_SYNC === false &&
      DISTRIBUTED_APP_NETWORK_LOCKS.FOUNDER_IMPERSONATION === false &&
      DISTRIBUTED_APP_NETWORK_LOCKS.TIP_LAND === false,
    'Installation/sync never grant authority; L4, founder impersonation, tip-land, and sealed-in-sync are false.',
  );

  const untrusted = await registerAppNetworkNode({ tenantId, universeId, profile: 'desktop', root });
  check('US-AL28', untrusted.trustedForRouting === false && untrusted.lifecycle === 'registered', 'Registered node is not trusted. Distributed ≠ uncontrolled.');
  await configureAppNetworkNode({
    nodeId: untrusted.id,
    tenantId,
    universeId,
    note: 'configured only',
    root,
  });
  const noExplicit = await authorizeAppNetworkNode({
    nodeId: untrusted.id,
    tenantId,
    universeId,
    explicit: false,
    root,
  });
  check('US-AL28', noExplicit.authorized === false, 'Authorization requires an explicit grant; install/sync cannot substitute.');

  const cycle = await runDistributedAppNetworkCycle({
    tenantId,
    universeId,
    storyId: 'al-main',
    intent: 'deliver packages offline-first',
    packageBytes: 'xiv-app-package-bytes-for-resume-and-cas-dedup-0123456789',
    sealedPayload: secret,
    destinationOffline: true,
    federateClone: true,
    root,
  });

  check('US-AL1', cycle.hops.length === 11 && cycle.hops[0] === 'xiv_universe' && cycle.hops.at(-1) === 'learning', 'Cycle walked Universe → … → Learning.');
  check('US-AL8', cycle.nodes.mobile.profile === 'mobile' && cycle.nodes.mobile.physicalControl === false, 'Mobile node profile is logical only.');
  check('US-AL9', cycle.nodes.desktop.profile === 'desktop' && cycle.nodes.desktop.osClass === 'linux', 'Desktop node profile registered on this Linux host.');
  check(
    'US-AL2',
    (cycle.resumed?.received ?? 0) >= 2 && cycle.transfer?.receivedIndexes.length === cycle.transfer?.totalChunks,
    'Resumable transfer continued from partial chunks to completion.',
  );
  check('US-AL3', cycle.transfer?.integrity === 'PASS' && cycle.activated?.activated === true, 'Integrity verification passed before local activation.');
  check('US-AL4', cycle.duplicate === true, 'Second put of the same bytes was content-addressed deduplicated.');
  check(
    'US-AL5',
    cycle.forwarded.state === 'held_offline' && cycle.flushed.flushed >= 1,
    'Offline store-and-forward held while the peer was offline, then flushed.',
  );
  check('US-AL6', cycle.knowledge.delivered === true && cycle.knowledge.authorityGranted === false, 'Knowledge-pack delivery reused Lake sync without granting authority.');
  check('US-AL7', cycle.skill.delivered === true && cycle.skill.authorityGranted === false, 'Agent-skill delivery activated locally without authority.');
  check('US-AL10', (await listEdgeCache(root)).some((entry) => entry.address === cycle.transfer?.address && entry.sealed === false), 'Edge cache stored the verified content address.');
  check('US-AL11', cycle.syncA?.synced === true && cycle.syncConflict?.synced === true, 'Peer Universe synchronization recorded package manifests.');
  check(
    'US-AL12',
    cycle.syncConflict?.conflict?.rule === 'higher_version' && cycle.syncConflict.record?.version === 2,
    'Conflict resolution kept the higher version.',
  );
  check(
    'US-AL13',
    cycle.envelope?.mac.length === 64 && cycle.envelope.sealedRedacted === true && !cycle.envelope.bodyPreview.includes(secret),
    'Encrypted-transport requirement: HMAC envelope with sealed fields redacted.',
  );
  check('US-AL15', cycle.profiles.mobile.bandwidthBytes < cycle.profiles.desktop.bandwidthBytes, 'Mobile bandwidth governor is stricter than desktop.');
  check('US-AL16', cycle.profiles.desktop.nodeCannotSelfExpand === true, 'Nodes cannot expand their own resource limits.');
  check(
    'US-AL17',
    cycle.relays.find((item) => item.relay === 'aws')?.route.state === 'UNAVAILABLE' && cycle.relays[0].fallback.continueLocal === true,
    'Unconfigured AWS relay is UNAVAILABLE; local work continues.',
  );
  check(
    'US-AL18',
    cycle.relays.find((item) => item.relay === 'azure')?.route.state === 'UNAVAILABLE',
    'Unconfigured Azure relay is UNAVAILABLE.',
  );
  check(
    'US-AL19',
    cycle.relays.find((item) => item.relay === 'gcp')?.route.state === 'UNAVAILABLE' && cycle.relayHonesty.gcp === 'UNAVAILABLE',
    'Unconfigured GCP relay is UNAVAILABLE.',
  );
  check(
    'US-AL20',
    cycle.relays.find((item) => item.relay === 'cisco')?.route.state === 'UNAVAILABLE',
    'Unconfigured Cisco relay is UNAVAILABLE.',
  );
  check(
    'US-AL21',
    cycle.relayHonesty.aws === 'UNAVAILABLE' &&
      cycle.relayHonesty.azure === 'UNAVAILABLE' &&
      cycle.relayHonesty.gcp === 'UNAVAILABLE' &&
      cycle.relayHonesty.cisco === 'UNAVAILABLE' &&
      cycle.relayHonesty.cloudRequired === false,
    'Unconfigured providers remain UNAVAILABLE. Cloud is optional.',
  );
  check(
    'US-AL22',
    cycle.offline.allowed === true &&
      cycle.offline.state === 'LOCAL_EXECUTABLE' &&
      cycle.workcell.productionAuthorization === false &&
      cycle.relays.every((item) => item.fallback.continueLocal),
    'Offline-first cycle proceeds without AWS/Azure/GCP/Cisco connectivity.',
  );
  check('US-AL23', cycle.sealedAccepted === true && cycle.sealedSyncDenied === true, 'CEO Sealed Vault accepted locally and stayed outside ordinary sync.');
  check('US-AL23', cycle.sealedAttemptDenied && cycle.sealedSkillDenied && cycle.sealedPackDenied, 'Sealed bytes cannot enter transfers, skills, or knowledge packs.');

  const envelopes = await listTransferEnvelopes(root);
  const envelopeLeak = envelopes.some((item) => JSON.stringify(item).includes(secret));
  check('US-AL24', !envelopeLeak && cycle.envelope?.bodyPreview !== secret, 'Sealed information did not leak into transfer envelopes.');

  const cacheLeak = (await listEdgeCache(root)).some((item) => JSON.stringify(item).includes(secret));
  check('US-AL25', !cacheLeak, 'Sealed information did not leak into the edge cache.');

  const leak = await scanXivLocalForToken({ root, token: secret, allowFiles: [CEO_SEALED_VAULT_FILE] });
  check(
    'US-AL26',
    leak.leaked === false && !leak.leaks.some((item) => item.file === 'app-network-logs.json'),
    'Sealed information did not leak into logs (vault file excluded).',
  );
  check(
    'US-AL27',
    leak.leaked === false && !leak.leaks.some((item) => item.file === 'app-network-telemetry.json'),
    'Sealed information did not leak into telemetry.',
  );
  check('US-AL24-27', cycle.leakScan.leaked === false, `Runtime leak scan found ${cycle.leakScan.leaks.length} ordinary-file hit(s).`);

  check('US-AL29', cycle.activated?.authorityGranted === false && cycle.installLock.authorityGranted === false, 'Local activation does not grant authority.');
  check(
    'US-AL30',
    Boolean(cycle.evidenceId) && Boolean(cycle.learningId) && cycle.founderImpersonation === false && cycle.l4AutonomyEnabled === false,
    'Evidence and learning recorded. No founder impersonation. L4 remains false.',
  );

  const tamper = await runDistributedAppNetworkCycle({
    tenantId: `${tenantId}-tamper`,
    universeId: `${universeId}-tamper`,
    storyId: 'al-tamper',
    intent: 'prove failed integrity blocks activation',
    packageBytes: 'integrity-bytes-must-match-cas-address-xx',
    tamperResume: true,
    root,
  });
  check(
    'US-AL3',
    tamper.transfer?.integrity === 'FAIL' && tamper.activated == null,
    'Tampered resume fails integrity and does not activate.',
  );

  const quarantined = await runDistributedAppNetworkCycle({
    tenantId: `${tenantId}-q`,
    universeId: `${universeId}-q`,
    storyId: 'al-quarantine',
    intent: 'quarantine a compromised peer',
    isolatePeer: true,
    root,
  });
  check(
    'US-AL14',
    quarantined.quarantine?.node.lifecycle === 'quarantined' &&
      quarantined.quarantine.routingTrusted === false &&
      quarantined.postQuarantineDenied === true &&
      !isPeerEligible(quarantined.quarantine.node),
    'Compromised-node quarantine drops routing trust and denies further transfers.',
  );

  const over = await consumeNetworkBudget({
    nodeId: cycle.nodes.mobile.id,
    tenantId,
    universeId,
    bytes: 10_000_000,
    root,
  });
  check('US-AL15', over.allowed === false && over.state === 'DENIED', 'Bandwidth governor denies over-budget transfers.');

  const health = await buildDistributedAppNetworkHealthReport(root);
  check(
    'US-AL21',
    health.aws === 'UNAVAILABLE' &&
      health.azure === 'UNAVAILABLE' &&
      health.gcp === 'UNAVAILABLE' &&
      health.cisco === 'UNAVAILABLE' &&
      health.productionAuthorization === false &&
      health.inventedPass === false &&
      health.tipLand === false &&
      health.githubIssue50 === 'UNAVAILABLE',
    'Health report keeps unconfigured relays UNAVAILABLE and does not invent PASS.',
  );
  check('US-AL30', health.next.startsWith('62L-AM'), 'Next queue title is 62L-AM only.');

  const syncStore = await listUniverseSync(root);
  check('US-AL23', syncStore.records.every((item) => item.sealed === false), 'Universe sync records are never sealed.');

  if (failures.length) {
    console.error(`62L-AL safety tests FAIL\n${failures.join('\n')}`);
    process.exitCode = 1;
  } else {
    console.log('62L-AL safety tests PASS');
  }
} catch (error) {
  console.error('62L-AL safety tests FAIL');
  console.error(error);
  process.exitCode = 1;
} finally {
  await rm(root, { recursive: true, force: true });
}
