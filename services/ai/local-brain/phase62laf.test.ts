import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { sealCeoRecord, readCeoSealedRecord, SEALED_REDACTION } from './ceo-sealed-vault';
import { cloudPeerSlots, resetCloudPeerAdapters } from './cloud-peer-adapters';
import { listDeviceNodes } from './device-node-runtime';
import {
  appendMemoryJournal,
  listJournal,
  replicateJournalToNode,
  resolveJournalConflict,
} from './distributed-memory-replication';
import { kernelProfile, servicesForProfile } from './offline-service-fabric';
import { restoreUniverse, snapshotUniverse } from './universe-snapshot-restore';
import {
  UNIVERSE_OS_KERNEL_CYCLE,
  UNIVERSE_OS_LOCKS,
  bootUniverseOs,
  buildUniverseOsHealthReport,
  enterKernelQuarantine,
  resumeKernelFromSafeMode,
  runUniverseOsCycle,
  scoreOfflineContinuity,
} from './universe-os-kernel';
import { isAllowedLocalCommand } from './local-command-runner';

const root = await mkdtemp(join(tmpdir(), 'xiv-62laf-'));
const tenantId = '62laf-tenant';
const universeId = '62laf-universe';
const ceo = { kind: 'ceo_principal' as const, id: 'ceo-principal-sim' };
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

try {
  resetCloudPeerAdapters();

  check(
    'US-AF1',
    UNIVERSE_OS_KERNEL_CYCLE.join(' → ') ===
      'ceo_policy → universe_kernel → service_registry → offline_scheduler → memory_data_router → agent_workcells → local_llm_tools → evidence → checkpoint → distributed_memory_journal → learning → health → next_story',
    'Universe OS kernel cycle is recorded in order.',
  );
  check(
    'US-AF30-locks',
    UNIVERSE_OS_LOCKS.L4_AUTONOMY_ENABLED === false &&
      UNIVERSE_OS_LOCKS.PRODUCTION_AUTHORIZATION === false &&
      UNIVERSE_OS_LOCKS.CLOUD_REQUIRED_FOR_BOOT === false &&
      UNIVERSE_OS_LOCKS.CEO_SEALED_AUTO_REPLICATE === false &&
      UNIVERSE_OS_LOCKS.PHYSICAL_ALTERNATE_UNIVERSE === false &&
      UNIVERSE_OS_LOCKS.FOUNDER_IMPERSONATION === false &&
      UNIVERSE_OS_LOCKS.TIP_LAND === false,
    'L4, production, cloud-boot, sealed auto-replicate, physical-universe, founder impersonation, and tip-land locks are false.',
  );

  const boot = await bootUniverseOs({
    tenantId,
    universeId,
    profile: 'desktop',
    onlineCloud: true,
    root,
  });
  check(
    'US-AF1',
    boot.record.lifecycle === 'running' && boot.record.physicalAlternateUniverse === false,
    'Universe lifecycle manager boots a logical Universe to running.',
  );
  check(
    'US-AF21',
    boot.cloudRequired === false && boot.bootedWithoutCloud === true && boot.peers.every((peer) => peer.state === 'UNAVAILABLE'),
    'Offline boot succeeds without AWS/Azure/Cisco; cloud is not a prerequisite.',
  );
  check(
    'US-AF3',
    boot.services.some((service) => service.name === 'service_registry' && service.registered && service.state === 'running'),
    'Service registry is registered after boot.',
  );
  check(
    'US-AF4',
    boot.services.filter((service) => service.state === 'running' || service.state === 'degraded').length >= 6,
    'Offline supervisor starts eligible kernel services.',
  );
  check(
    'US-AF5',
    boot.hardware.physicalDeviceControl === false && boot.hardware.cpu.availability === 'AVAILABLE',
    'Offline scheduler is hardware-aware and does not claim physical device control.',
  );
  check(
    'US-AF27',
    boot.hardware.selectedAccelerator.kind === 'cpu' || boot.hardware.selectedAccelerator.availability === 'AVAILABLE',
    'Hardware-aware scheduling selected an eligible local accelerator (CPU fallback).',
  );
  check(
    'US-AF17',
    boot.localModel === 'UNAVAILABLE',
    'Local-model service is UNAVAILABLE until XIV_LOCAL_MODEL is configured (correct).',
  );

  const mobileBoot = await bootUniverseOs({
    tenantId,
    universeId: '62laf-mobile',
    profile: 'mobile_microkernel',
    root,
  });
  check(
    'US-AF25',
    mobileBoot.profile.kind === 'mobile_microkernel' &&
      mobileBoot.services.length === servicesForProfile('mobile_microkernel').length &&
      mobileBoot.profile.maxConcurrentServices === 6,
    'Mobile microkernel profile installs a reduced service set.',
  );
  check(
    'US-AF26',
    kernelProfile('desktop').kind === 'desktop' && kernelProfile('desktop').maxConcurrentServices === 11,
    'Desktop profile exposes the full kernel service set.',
  );

  const cycle = await runUniverseOsCycle({
    tenantId,
    universeId,
    storyId: 'af-cycle-1',
    intent: 'boot kernel and replicate ordinary memory only',
    sealedPayload: 'SEALED_FOUNDER_PRIORITY_TOKEN',
    conflict: true,
    snapshot: true,
    root,
  });

  check('US-AF2', cycle.policy.denyByDefault === true && cycle.policy.autoReplicateSealed === false, 'CEO policy hop reuses deny-by-default sealed vault and does not auto-replicate.');
  check('US-AF6', cycle.jobs.status === 'PLANNED' && cycle.jobs.allocated >= 1 && cycle.jobs.canExpandPermissions === false, 'Internal agent job allocation is demand-planned and cannot expand permissions.');
  check('US-AF7', cycle.workcell.consensusForced === false && cycle.workcell.productionAuthorization === false, 'Agent workcells reuse the bounded decision council.');
  check(
    'US-AF8',
    cycle.packages.some((item) => item.id === 'offline_kernel' && item.state === 'AVAILABLE' && item.cloudRequired === false) &&
      cycle.packages.some((item) => item.id === 'local_llm' && item.state === 'UNAVAILABLE'),
    'Offline capability packages install; local LLM package is UNAVAILABLE without a configured model.',
  );
  check('US-AF9', cycle.universes.every((item) => item.physicalAlternateUniverse === false), 'Scoped Universe storage is logical only.');
  check('US-AF10', cycle.router.routed === 'local' && cycle.cloudDb.state === 'UNAVAILABLE', 'Memory/data router uses local DB; cloud DB remains UNAVAILABLE.');
  check('US-AF11', Boolean(cycle.ordinaryReplication), 'Distributed memory journal accepted an ordinary entry.');
  check(
    'US-AF12',
    cycle.ordinaryReplication?.state === 'replicated' || cycle.ordinaryReplication?.state === 'conflict',
    'Node-to-node replication copies ordinary memory to the peer node.',
  );
  check(
    'US-AF13',
    cycle.sealedReplication?.state === 'skipped_sealed' &&
      cycle.sealedJournal?.replicable === false &&
      cycle.sealedJournal?.payload === SEALED_REDACTION,
    'CEO-sealed memory is non-replicating by default and is redacted in the journal.',
  );
  check(
    'US-AF14',
    cycle.conflict?.forgotten === false && (cycle.conflict?.retainedIds.length ?? 0) === 2,
    'Conflict resolution keeps both histories; nothing is forgotten.',
  );
  check('US-AF15', cycle.router.productionWrite === false && cycle.cloudDb.reason.includes('UNAVAILABLE'), 'Local database routing never writes production and does not assume cloud.');
  check(
    'US-AF16',
    cycle.vectors.inventedEmbeddings === false && cycle.vectors.denseEmbeddings === 'UNAVAILABLE' && cycle.vectors.tokens.length > 0,
    'Vector retrieval uses sparse tokens; dense embeddings stay UNAVAILABLE and are not invented.',
  );
  check('US-AF18', cycle.ipc.sealedRedacted === true && cycle.ipc.body === SEALED_REDACTION, 'Secure agent IPC redacts sealed bodies (62L-AE envelopes).');
  check(
    'US-AF19',
    cycle.snapshot?.kind === 'distributable' && cycle.snapshot.includesSealedVault === false,
    'Distributable snapshots exclude the CEO sealed vault.',
  );
  check('US-AF20', cycle.restored?.restored === true && cycle.restored.includesSealedVault === false, 'Restore from a distributable snapshot does not import sealed vault contents.');
  check('US-AF22', cloudPeerSlots().find((slot) => slot.peer === 'aws')?.state === 'UNAVAILABLE', 'Optional AWS extension remains UNAVAILABLE.');
  check('US-AF23', cloudPeerSlots().find((slot) => slot.peer === 'azure')?.state === 'UNAVAILABLE', 'Optional Azure extension remains UNAVAILABLE.');
  check('US-AF24', cloudPeerSlots().find((slot) => slot.peer === 'cisco')?.state === 'UNAVAILABLE', 'Optional Cisco extension remains UNAVAILABLE.');
  check('US-AF29', cycle.hops.length === 13 && Boolean(cycle.evidenceId) && Boolean(cycle.learningId), 'Kernel cycle wrote evidence, checkpoint, and learning.');
  check('US-AF29', cycle.twin.twinIsRealFounder === false, 'Kernel cycle does not impersonate the founder.');
  check('US-AF29', isAllowedLocalCommand('git_status') && cycle.commandAllowlistIntact, 'Command-runner allowlist is intact.');

  const sealed = await sealCeoRecord({
    tenantId,
    universeId,
    label: 'af-sealed-proof',
    payload: 'SEALED_FOUNDER_PRIORITY_TOKEN',
    actor: ceo,
    root,
  });
  const nodes = await listDeviceNodes({ tenantId, universeId, root });
  const laptop = nodes.find((node) => node.deviceClass === 'laptop');
  const mobile = nodes.find((node) => node.deviceClass !== 'laptop');
  check('US-AF13-vault', Boolean(sealed.accepted && sealed.record && laptop && mobile), 'CEO sealed a founder-priority record for replication proof.');

  if (sealed.accepted && sealed.record && laptop && mobile) {
    const sealedEntry = await appendMemoryJournal({
      tenantId,
      universeId,
      sourceNodeId: laptop.id,
      key: 'sealed-proof',
      payload: 'SEALED_FOUNDER_PRIORITY_TOKEN',
      classification: 'sealed_founder_priority',
      root,
    });
    check('US-AF13', sealedEntry.accepted && sealedEntry.accepted && sealedEntry.entry.replicable === false, 'Sealed journal entries are marked non-replicable.');
    if (sealedEntry.accepted) {
      const skipped = await replicateJournalToNode({
        tenantId,
        universeId,
        fromNodeId: laptop.id,
        toNodeId: mobile.id,
        entryId: sealedEntry.entry.id,
        root,
      });
      const dest = await listJournal({ tenantId, universeId, nodeId: mobile.id, root });
      const leaked = dest.some((item) => item.payload.includes('SEALED_FOUNDER_PRIORITY_TOKEN'));
      check(
        'US-AF13',
        skipped.state === 'skipped_sealed' && leaked === false,
        'Sealed payload is not copied to the destination node.',
      );
    }
    const ordinaryRead = await readCeoSealedRecord({
      recordId: sealed.record.id,
      tenantId,
      universeId,
      actor: { kind: 'ordinary_agent', id: 'researcher-1', role: 'researcher' },
      root,
    });
    const peerRead = await readCeoSealedRecord({
      recordId: sealed.record.id,
      tenantId,
      universeId,
      actor: { kind: 'peer', id: 'mesh-peer-1' },
      root,
    });
    check('US-AF13', ordinaryRead.allowed === false && peerRead.allowed === false, 'Ordinary agents and peers cannot read sealed vault content.');
  }

  if (laptop && mobile) {
    const left = await appendMemoryJournal({
      tenantId,
      universeId,
      sourceNodeId: laptop.id,
      key: 'conflict-key',
      payload: 'alpha-memory',
      classification: 'internal',
      root,
    });
    const right = await appendMemoryJournal({
      tenantId,
      universeId,
      sourceNodeId: mobile.id,
      key: 'conflict-key',
      payload: 'beta-memory',
      classification: 'internal',
      root,
    });
    if (left.accepted && right.accepted) {
      const resolved = await resolveJournalConflict({
        tenantId,
        universeId,
        key: 'conflict-key',
        leftId: left.entry.id,
        rightId: right.entry.id,
        root,
      });
      const stillThere = await listJournal({ tenantId, universeId, root });
      check(
        'US-AF14',
        resolved.forgotten === false &&
          resolved.retainedIds.includes(left.entry.id) &&
          resolved.retainedIds.includes(right.entry.id) &&
          stillThere.some((item) => item.id === left.entry.id) &&
          stillThere.some((item) => item.id === right.entry.id),
        'Conflict resolver retains both journal entries.',
      );
    }
  }

  const localSnap = await snapshotUniverse({ tenantId, universeId, kind: 'local_restore', root });
  const distSnap = await snapshotUniverse({ tenantId, universeId, kind: 'distributable', root });
  check('US-AF19', localSnap.includesSealedVault === true && distSnap.includesSealedVault === false, 'Local restore snapshots may include sealed vault; distributable snapshots never do.');
  const restoredLocal = await restoreUniverse({ snapshotId: localSnap.id, tenantId, universeId, root });
  check('US-AF20', restoredLocal.restored === true && restoredLocal.includesSealedVault === true, 'Local restore reloads the same-node sealed vault file.');

  const quarantine = await enterKernelQuarantine({
    reason: 'af-safe-mode-proof',
    tenantId,
    universeId,
    root,
  });
  check(
    'US-AF28',
    quarantine.safeMode === true &&
      quarantine.autoResume === false &&
      quarantine.isolation.active === true &&
      quarantine.peerRoute.routed === false &&
      quarantine.services.some((service) => service.state === 'quarantined'),
    'Quarantine/safe mode isolates non-essential services and blocks cloud/peer routing.',
  );
  const auto = await resumeKernelFromSafeMode({ tenantId, universeId, explicit: false, root });
  check('US-AF28', auto.resumed === false, 'Safe mode does not auto-resume.');
  const explicit = await resumeKernelFromSafeMode({ tenantId, universeId, explicit: true, root });
  check('US-AF28', explicit.resumed === true, 'Safe mode resumes only with an explicit local request.');

  const continuity = scoreOfflineContinuity([
    { name: 'offline_boot_without_cloud', result: boot.bootedWithoutCloud ? 'PASS' : 'FAIL' },
    { name: 'sealed_non_replication', result: cycle.sealedReplication?.state === 'skipped_sealed' ? 'PASS' : 'FAIL' },
    { name: 'conflict_resolution', result: cycle.conflict?.forgotten === false ? 'PASS' : 'FAIL' },
    { name: 'quarantine_safe_mode', result: quarantine.safeMode && auto.resumed === false ? 'PASS' : 'FAIL' },
    { name: 'local_model', result: 'UNAVAILABLE' },
    { name: 'aws', result: 'UNAVAILABLE' },
    { name: 'azure', result: 'UNAVAILABLE' },
    { name: 'cisco', result: 'UNAVAILABLE' },
    { name: 'windows_node_verification', result: 'NOT_TESTED' },
    { name: 'physical_mobile_devices', result: 'NOT_TESTED' },
    { name: 'github_issue_43', result: 'UNAVAILABLE' },
  ]);
  check(
    'US-AF30',
    continuity.inventedPass === false &&
      continuity.windowsNodeVerification === 'NOT_TESTED' &&
      continuity.passed === 4 &&
      continuity.unavailable >= 4 &&
      continuity.notTested >= 2 &&
      continuity.score === 100,
    'Offline Continuity Score is evidence-based: 4 unit PASSES, local model/cloud UNAVAILABLE, Windows NOT_TESTED, no invented PASS.',
  );

  const health = await buildUniverseOsHealthReport(root);
  check('US-AF29', health.productionAuthorization === false && health.inventedPass === false && health.aws === 'UNAVAILABLE', 'Health report does not authorize production or invent PASS.');
  check('US-AF29', health.predecessors['62L-AE'] === 'PRESENT' && health.predecessors['62L-AD'] === 'WAITING_DATA', 'Health map records AE present and AD mesh WAITING_DATA on this parent.');

  if (failures.length) {
    console.error(`62L-AF safety tests FAIL\n${failures.join('\n')}`);
    process.exitCode = 1;
  } else {
    console.log('62L-AF safety tests PASS');
  }
} catch (error) {
  console.error('62L-AF safety tests FAIL');
  console.error(error);
  process.exitCode = 1;
} finally {
  await rm(root, { recursive: true, force: true });
}
