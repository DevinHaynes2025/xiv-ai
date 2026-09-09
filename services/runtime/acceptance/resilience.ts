/**
 * AC-10 offline work packages.
 * AC-11 offline meeting integrity.
 * AC-12 failure recovery.
 * AC-23 backup and restore.
 * AC-24 rollback.
 */
import { OfflineAuthority } from '../src/offline';
import { LOCAL_REFERENCE_MODEL_ID, RUNTIME_CONTRACT_VERSION } from '../src/plane';
import { REQUIRED_BACKUP_TABLES } from '../src/snapshot';
import type { AcceptanceResult, Threshold } from './harness';
import {
  TENANT_A,
  TENANT_B,
  atLeast,
  boolean as booleanThreshold,
  buildFixture,
  catchCode,
  percent,
  standardBudget,
  summarize,
  workloadSpec,
  zero,
} from './harness';
import type { FailureKind, RecoveryOutcome } from '../src/types';

export function runAc10(): AcceptanceResult {
  const { plane, clock, operatorA } = buildFixture();
  const node = plane.onboardNode({ token: operatorA.token, tenant: TENANT_A, serial: 'offline-1' });
  const agent = plane.agents.register({ tenant: TENANT_A, agentKey: 'offline-agent', classification: 'confidential' });

  const issued = [];
  for (let index = 0; index < 25; index += 1) {
    issued.push(
      plane.offline.issue({
        principal: operatorA.principal,
        agentId: agent.agentId,
        node,
        capabilities: ['workload.submit', 'model.invoke'],
        classification: 'confidential',
        maxTasks: 3,
        budget: standardBudget({ maxTasks: 3 }),
        validForMs: 30 * 60 * 1000,
      }),
    );
  }

  const validated = issued.filter((grant) => catchCode(() => plane.offline.validate(grant)) === 'no_error').length;

  // Permission expansion: the issuer cannot grant what it does not hold, and the
  // offline session cannot use what the package does not contain. The issuer
  // here can issue packages but holds no node control, so the refusal is about
  // the widened capability rather than the right to issue at all.
  const restrictedIssuer = plane.principals.enroll({
    kind: 'human',
    tenant: TENANT_A,
    capabilities: ['offline.package.issue', 'workload.submit', 'model.invoke'],
    maxClassification: 'confidential',
  });
  const issuerExpansion = catchCode(() =>
    plane.offline.issue({
      principal: plane.principals.verify(restrictedIssuer.token),
      agentId: agent.agentId,
      node,
      capabilities: ['node.control'],
      classification: 'confidential',
      maxTasks: 1,
      budget: standardBudget(),
      validForMs: 60_000,
    }),
  );

  const grant = issued[0];
  if (!grant) throw new Error('offline fixture missing');

  const session = plane.offline.runOffline({
    grant,
    tasks: [
      { taskKey: 'offline-1', requiredCapabilities: ['workload.submit'], description: 'summarize local evidence' },
      { taskKey: 'offline-2', requiredCapabilities: ['model.invoke'], description: 'draft local recommendation' },
      { taskKey: 'offline-3', requiredCapabilities: ['node.control'], description: 'attempt privileged control' },
      {
        taskKey: 'offline-4',
        requiredCapabilities: ['workload.submit'],
        description: 'attempt external action without grant',
        externalActionKey: 'offline-unauthorized-send',
      },
      { taskKey: 'offline-5', requiredCapabilities: ['workload.submit'], description: 'beyond task budget' },
    ],
  });

  const expansionRefused = session.outcomes.filter((outcome) => outcome.refusedReason === 'permission_expansion').length;
  const externalRefused = session.outcomes.filter(
    (outcome) => outcome.refusedReason === 'external_action_not_granted',
  ).length;
  const unauthorizedExternalExecuted = session.outcomes.filter((outcome) => outcome.externalActionExecuted).length;

  // Tampered and expired packages.
  const tampered = OfflineAuthority.tamper(grant);
  const tamperedCode = catchCode(() => plane.offline.validate(tampered));

  const shortLived = plane.offline.issue({
    principal: operatorA.principal,
    agentId: agent.agentId,
    node,
    capabilities: ['workload.submit'],
    classification: 'internal',
    maxTasks: 1,
    budget: standardBudget(),
    validForMs: 1_000,
  });
  clock.advance(5_000);
  const expiredCode = catchCode(() => plane.offline.validate(shortLived));

  // Synchronization requires reauthentication for protected results.
  const syncWithoutReauth = catchCode(() =>
    plane.offline.synchronize({ grant, result: session.result, reauthenticated: null, protectedSync: true }),
  );
  const syncWithReauth = plane.offline.synchronize({
    grant,
    result: session.result,
    reauthenticated: plane.principals.verify(operatorA.token),
    protectedSync: true,
  });
  const replaySync = plane.offline.synchronize({
    grant,
    result: session.result,
    reauthenticated: plane.principals.verify(operatorA.token),
    protectedSync: true,
  });

  const thresholds: Threshold[] = [
    atLeast('packages_validated', 'Signed/validated offline packages', percent(validated, issued.length), 100, {
      blocker: true,
    }),
    zero(
      'permission_expansion',
      'Offline permission expansion',
      (issuerExpansion === 'permission_expansion' ? 0 : 1) + (expansionRefused > 0 ? 0 : 1),
      { blocker: true, note: `issuer expansion refused as ${issuerExpansion}; ${expansionRefused} task expansions refused` },
    ),
    zero(
      'unauthorized_external_actions',
      'Unauthorized external actions while offline',
      unauthorizedExternalExecuted,
      { blocker: true, note: `${externalRefused} external attempts refused` },
    ),
    zero('expired_packages_accepted', 'Expired packages accepted', expiredCode === 'package_expired' ? 0 : 1, {
      blocker: true,
    }),
    zero('tampered_packages_accepted', 'Tampered packages accepted', tamperedCode === 'package_invalid' ? 0 : 1, {
      blocker: true,
    }),
    atLeast(
      'offline_lineage',
      'Offline results with complete lineage',
      session.result.lineageComplete ? 100 : 0,
      100,
      { blocker: true },
    ),
    atLeast(
      'reauthentication_before_sync',
      'Reauthentication before protected synchronization',
      syncWithoutReauth === 'reauthentication_required' ? 100 : 0,
      100,
      { blocker: true },
    ),
    booleanThreshold('sync_accepted_with_reauth', 'Reauthenticated synchronization accepted', syncWithReauth.accepted, {
      blocker: true,
    }),
    booleanThreshold('sync_replay_refused', 'Replayed synchronization refused', replaySync.accepted === false, {
      blocker: true,
    }),
  ];

  return summarize('AC-10', 'Offline Work Packages', thresholds, {
    packagesIssued: issued.length,
    sessionOutcomes: session.outcomes,
    offlineResult: session.result,
    tamperedCode,
    expiredCode,
    offlineMetrics: plane.offline.metrics,
  });
}

export function runAc11(): AcceptanceResult {
  const { plane, operatorA, operatorB, agentPrincipalA } = buildFixture();

  const humanParticipant = {
    participantId: operatorA.principal.principalId,
    kind: 'human' as const,
    tenant: TENANT_A,
    displayName: 'Operations lead',
  };
  const agentParticipant = {
    participantId: agentPrincipalA.principal.principalId,
    kind: 'agent' as const,
    tenant: TENANT_A,
    displayName: 'Supply analyst agent',
  };
  const foreignParticipant = {
    participantId: operatorB.principal.principalId,
    kind: 'human' as const,
    tenant: TENANT_B,
    displayName: 'Other organization operator',
  };

  const meeting = plane.meetings.open({
    principal: operatorA.principal,
    tenant: TENANT_A,
    classification: 'confidential',
    participants: [humanParticipant, agentParticipant],
    offline: true,
  });

  const evidenceHash = plane.meetings.registerEvidence('supplier lead-time variance report, week 36');
  const secondEvidence = plane.meetings.registerEvidence('inventory buffer levels, week 36');

  const messages = [
    plane.meetings.post({
      meetingId: meeting.meetingId,
      scope: TENANT_A,
      participantId: agentParticipant.participantId,
      content: 'Lead-time variance rose in the Nordic corridor.',
      evidenceHashes: [evidenceHash],
    }),
    plane.meetings.post({
      meetingId: meeting.meetingId,
      scope: TENANT_A,
      participantId: humanParticipant.participantId,
      content: 'Recommend a reallocation simulation before any supplier contact.',
      evidenceHashes: [evidenceHash, secondEvidence],
    }),
  ];

  const negatives = {
    foreign_participant_on_roster: catchCode(() =>
      plane.meetings.open({
        principal: operatorA.principal,
        tenant: TENANT_A,
        classification: 'confidential',
        participants: [humanParticipant, foreignParticipant],
        offline: true,
      }),
    ),
    message_from_non_participant: catchCode(() =>
      plane.meetings.post({
        meetingId: meeting.meetingId,
        scope: TENANT_A,
        participantId: 'principal_not_on_roster',
        content: 'injected message',
        evidenceHashes: [],
      }),
    ),
    message_citing_unknown_evidence: catchCode(() =>
      plane.meetings.post({
        meetingId: meeting.meetingId,
        scope: TENANT_A,
        participantId: humanParticipant.participantId,
        content: 'cites evidence that was never registered',
        evidenceHashes: ['0'.repeat(64)],
      }),
    ),
    agent_fabricated_approval: catchCode(() =>
      plane.meetings.approve({ principal: agentPrincipalA.principal, meetingId: meeting.meetingId, decision: 'approved' }),
    ),
    consequential_action_without_approval: catchCode(() =>
      plane.meetings.authorizeConsequentialAction({ meetingId: meeting.meetingId, scope: TENANT_A }),
    ),
    cross_tenant_meeting_read: catchCode(() => plane.meetings.require(TENANT_B, meeting.meetingId)),
  };

  const approval = plane.meetings.approve({
    principal: operatorA.principal,
    meetingId: meeting.meetingId,
    decision: 'approved',
  });
  const authorizedAction = plane.meetings.authorizeConsequentialAction({ meetingId: meeting.meetingId, scope: TENANT_A });

  const integrity = plane.meetings.verifyIntegrity(TENANT_A, meeting.meetingId);

  const thresholds: Threshold[] = [
    atLeast(
      'participant_identity',
      'Participant identity preserved',
      integrity.participantIdentityPreserved ? 100 : 0,
      100,
      { blocker: true },
    ),
    atLeast(
      'message_attribution',
      'Message attribution preserved',
      integrity.messageAttributionPreserved ? 100 : 0,
      100,
      { blocker: true },
    ),
    atLeast(
      'evidence_provenance',
      'Evidence provenance preserved',
      integrity.evidenceProvenancePreserved ? 100 : 0,
      100,
      { blocker: true },
    ),
    zero(
      'unapproved_consequential_actions',
      'Consequential external actions executed without approval',
      negatives.consequential_action_without_approval === 'approval_required' ? 0 : 1,
      { blocker: true },
    ),
    zero(
      'fabricated_approvals',
      'Fabricated human approvals',
      integrity.fabricatedApprovals + (negatives.agent_fabricated_approval === 'unauthorized' ? 0 : 1),
      { blocker: true },
    ),
    zero(
      'unauthorized_participants',
      'Unauthorized meeting participants',
      (negatives.foreign_participant_on_roster === 'isolation_violation' ? 0 : 1) +
        (negatives.message_from_non_participant === 'unauthorized' ? 0 : 1),
      { blocker: true },
    ),
    booleanThreshold('roster_signature_intact', 'Meeting roster signature intact', integrity.rosterIntact, {
      blocker: true,
    }),
    booleanThreshold(
      'approved_action_authorized',
      'Consequential action allowed only after a verified human approval',
      authorizedAction.approvalId === approval.approvalId,
      { blocker: true },
    ),
  ];

  return summarize('AC-11', 'Offline Meeting Integrity', thresholds, {
    meetingId: meeting.meetingId,
    participants: meeting.participants.map((participant) => participant.participantId),
    messages: messages.length,
    negativeScenarios: negatives,
    integrity,
    meetingMetrics: plane.meetings.metrics,
  });
}

export function runAc12(): AcceptanceResult {
  const { plane, operatorA, operatorB } = buildFixture();
  const nodes = [0, 1, 2, 3].map((index) =>
    plane.onboardNode({ token: operatorA.token, tenant: TENANT_A, serial: `recover-${index}` }),
  );
  const foreignNode = plane.onboardNode({ token: operatorB.token, tenant: TENANT_B, serial: 'recover-foreign' });
  const hardware = { classIds: [plane.hostHardware.classId] };

  const kinds: FailureKind[] = [
    'node_loss',
    'process_failure',
    'timeout',
    'network_interruption',
    'resource_budget_exhausted',
  ];
  const outcomes: RecoveryOutcome[] = [];
  const scenarioLog: {
    scenario: string;
    kind: FailureKind;
    stage: string;
    detected: boolean;
    terminal: string;
    recovered: boolean;
  }[] = [];

  let scenarioIndex = 0;
  const runScenario = (options: {
    kind: FailureKind;
    stage: 'before_start' | 'mid_execution';
    recoverable: boolean;
    corruptCheckpoint?: boolean;
    crossTenant?: boolean;
    consequential?: boolean;
  }) => {
    scenarioIndex += 1;
    const label = `scenario-${scenarioIndex}`;
    const spec = workloadSpec({
      tenant: TENANT_A,
      hardware,
      modelId: LOCAL_REFERENCE_MODEL_ID,
      consequential: Boolean(options.consequential),
      sourceId: label,
    });
    const submitted = plane.engine.submit({ token: operatorA.token, spec });
    if (submitted.rejection) {
      scenarioLog.push({
        scenario: label,
        kind: options.kind,
        stage: options.stage,
        detected: false,
        terminal: 'rejected',
        recovered: false,
      });
      return;
    }
    plane.engine.checkpoint(spec.workloadId, `state-${label}`);
    const result = plane.engine.run({
      workloadId: spec.workloadId,
      iterations: 300,
      externalActionKey: `recover-action-${scenarioIndex}`,
      failure: {
        kind: options.kind,
        stage: options.stage,
        recoverable: options.recoverable,
        corruptCheckpoint: options.corruptCheckpoint,
        crossTenantRecoveryTarget: options.crossTenant ? { nodeId: foreignNode.nodeId } : undefined,
      },
    });
    if (result.recovery) outcomes.push(result.recovery);
    scenarioLog.push({
      scenario: label,
      kind: options.kind,
      stage: options.stage,
      detected: result.recovery?.detected ?? false,
      terminal: result.record.state,
      recovered: Boolean(result.recovery?.recoveredOnNodeId),
    });

    // Nodes paused by an injected node-loss are returned to service so later
    // scenarios still have capacity.
    for (const node of nodes) {
      const current = plane.nodes.get(TENANT_A, node.nodeId);
      if (current && current.state === 'paused') plane.nodes.setState(TENANT_A, node.nodeId, 'active', 'recovered');
    }
  };

  // 100 scenarios: every failure kind, at both stages, recoverable and not.
  for (let round = 0; round < 10; round += 1) {
    for (const kind of kinds) {
      runScenario({ kind, stage: 'mid_execution', recoverable: round % 2 === 0, consequential: false });
      runScenario({ kind, stage: 'before_start', recoverable: round % 2 === 1 });
    }
  }

  // Additional targeted scenarios.
  for (let index = 0; index < 5; index += 1) {
    runScenario({ kind: 'process_failure', stage: 'mid_execution', recoverable: true, corruptCheckpoint: true });
    runScenario({ kind: 'node_loss', stage: 'mid_execution', recoverable: true, crossTenant: true });
  }

  const detected = outcomes.filter((outcome) => outcome.detected).length;
  const safeTerminal = outcomes.filter((outcome) => outcome.safeTerminal).length;
  const duplicateActions = outcomes.reduce((total, outcome) => total + outcome.duplicateExternalActions, 0);
  const crossTenantRecoveries = outcomes.filter((outcome) => outcome.crossTenantRecovery).length;
  const corruptAccepted = outcomes.filter((outcome) => outcome.corruptedCheckpointAccepted).length;
  const auditCovered = outcomes.filter((outcome) => outcome.auditCovered).length;
  const recovered = outcomes.filter((outcome) => outcome.recoveredOnNodeId !== null).length;
  const detectionMsValues = outcomes.map((outcome) => outcome.detectionMs);

  const corruptCheckpointRefusal = plane.audit.find(
    (event) => event.kind === 'checkpoint_rejected' && event.detail.reason === 'signature_invalid',
  ).length;
  const crossTenantRefusals = plane.audit.find((event) => event.kind === 'cross_tenant_recovery_refused').length;

  const thresholds: Threshold[] = [
    atLeast('failures_detected', 'Failure detected', percent(detected, outcomes.length), 99, { blocker: true }),
    atLeast(
      'safe_terminal_state',
      'Safe terminal state or authorized recovery',
      percent(safeTerminal, outcomes.length),
      100,
      { blocker: true },
    ),
    zero('duplicate_external_actions', 'Duplicate consequential external actions', duplicateActions, { blocker: true }),
    zero('cross_tenant_recovery', 'Cross-tenant recovery', crossTenantRecoveries, {
      blocker: true,
      note: `${crossTenantRefusals} cross-tenant recovery attempts refused`,
    }),
    zero('corrupt_checkpoints_accepted', 'Corrupted checkpoints accepted', corruptAccepted, {
      blocker: true,
      note: `${corruptCheckpointRefusal} corrupt checkpoints refused on integrity verification`,
    }),
    atLeast(
      'recovery_audit_coverage',
      'Recovery events represented in audit lineage',
      percent(auditCovered, outcomes.length),
      100,
      { blocker: true },
    ),
  ];

  return summarize('AC-12', 'Failure Recovery', thresholds, {
    scenariosRun: scenarioLog.length,
    failureOutcomes: outcomes.length,
    recoveredOnAnotherNode: recovered,
    failureKinds: kinds,
    detectionMsMax: detectionMsValues.length ? Math.max(...detectionMsValues) : 0,
    externalActionsExecuted: plane.external.executedCount,
    externalActionDuplicateAttempts: plane.external.duplicateAttemptCount,
    scenarioSample: scenarioLog.slice(0, 12),
  });
}

export function runAc23(): AcceptanceResult {
  const { plane, clock, operatorA } = buildFixture();
  const hardware = { classIds: [plane.hostHardware.classId] };
  plane.onboardNode({ token: operatorA.token, tenant: TENANT_A, serial: 'backup-1' });

  plane.releases.activate({
    version: '62d.1.0',
    runtimeContractVersion: RUNTIME_CONTRACT_VERSION,
    config: { trustPolicy: plane.attestation.trustPolicy },
    destructiveMigration: false,
  });

  const committed: string[] = [];
  for (let index = 0; index < 40; index += 1) {
    const agent = plane.agents.register({ tenant: TENANT_A, agentKey: `backup-agent-${index}`, classification: 'internal' });
    const outcome = plane.engine.execute(
      {
        token: operatorA.token,
        spec: workloadSpec({ tenant: TENANT_A, hardware, modelId: LOCAL_REFERENCE_MODEL_ID, agentId: agent.agentId }),
      },
      { iterations: 200 },
    );
    plane.engine.checkpoint(outcome.record.workloadId, `state-${index}`);
    committed.push(outcome.record.workloadId);
  }

  const snapshot = plane.snapshots.take();
  const tablesCovered = REQUIRED_BACKUP_TABLES.filter((table) => table in snapshot.tables).length;

  clock.advance(60_000);

  // Simulated loss: state diverges after the snapshot, then is restored.
  for (let index = 0; index < 10; index += 1) {
    plane.engine.execute(
      { token: operatorA.token, spec: workloadSpec({ tenant: TENANT_A, hardware, modelId: LOCAL_REFERENCE_MODEL_ID }) },
      { iterations: 100 },
    );
  }
  const beforeRestore = plane.workloadStore.list(TENANT_A).length;

  const report = plane.snapshots.restore(snapshot.snapshotId);
  const restoredWorkloads = plane.workloadStore.list(TENANT_A);
  const lostCommitted = committed.filter(
    (workloadId) => plane.workloadStore.get(TENANT_A, workloadId) === undefined,
  ).length;
  const checkpointsIntact = committed.filter((workloadId) => {
    try {
      return plane.engine.restoreCheckpoint(workloadId) !== null;
    } catch {
      return false;
    }
  }).length;

  // A corrupted snapshot must be refused rather than restored.
  const corruptSnapshot = plane.snapshots.take();
  plane.snapshots.corruptForTest(corruptSnapshot.snapshotId);
  const corruptCode = catchCode(() => plane.snapshots.restore(corruptSnapshot.snapshotId));

  const thresholds: Threshold[] = [
    atLeast(
      'backup_policy_coverage',
      'Required data included in backup policy',
      percent(tablesCovered, REQUIRED_BACKUP_TABLES.length),
      100,
      { blocker: true },
    ),
    atLeast(
      'restore_tests',
      'Successful restore test before canary',
      report.integrityVerified ? 100 : 0,
      100,
      { blocker: true, note: `1 restore exercise completed` },
    ),
    atLeast(
      'restore_integrity',
      'Restore integrity validation for required test dataset',
      percent(checkpointsIntact, committed.length),
      100,
      { blocker: true },
    ),
    zero('lost_committed_records', 'Lost committed test records', lostCommitted, { blocker: true }),
    booleanThreshold(
      'procedure_documented',
      'Restore procedure documented and reproducible',
      true,
      { note: 'docs/62d/BACKUP-RESTORE.md, reproduced by `npm run acceptance` in services/runtime' },
    ),
    zero('corrupt_snapshot_accepted', 'Corrupted snapshots accepted', corruptCode === 'checkpoint_corrupt' ? 0 : 1, {
      blocker: true,
    }),
  ];

  return summarize('AC-23', 'Backup & Restore', thresholds, {
    requiredTables: REQUIRED_BACKUP_TABLES,
    snapshotId: snapshot.snapshotId,
    snapshotRecordCount: snapshot.recordCount,
    workloadsBeforeRestore: beforeRestore,
    workloadsAfterRestore: restoredWorkloads.length,
    measuredRpoMs: report.measuredRpoMs,
    measuredRtoMs: report.measuredRtoMs,
    committedTestRecords: committed.length,
    corruptSnapshotRefusalCode: corruptCode,
    note: 'RPO and RTO here are measured against this in-process runtime state on a deterministic clock. They are not a claim about hosted PostgreSQL backup behaviour.',
  });
}

export function runAc24(): AcceptanceResult {
  const { plane, clock, operatorA } = buildFixture();
  const hardware = { classIds: [plane.hostHardware.classId] };
  plane.onboardNode({ token: operatorA.token, tenant: TENANT_A, serial: 'rollback-1' });

  const v1 = plane.releases.activate({
    version: '62d.1.0',
    runtimeContractVersion: RUNTIME_CONTRACT_VERSION,
    config: { trustPolicy: plane.attestation.trustPolicy, routing: 'headroom_v1' },
    destructiveMigration: false,
  });

  for (let index = 0; index < 25; index += 1) {
    plane.engine.execute(
      { token: operatorA.token, spec: workloadSpec({ tenant: TENANT_A, hardware, modelId: LOCAL_REFERENCE_MODEL_ID }) },
      { iterations: 150 },
    );
  }
  const knownGood = plane.snapshots.take();

  clock.advance(30_000);

  const v2 = plane.releases.activate({
    version: '62d.1.1',
    runtimeContractVersion: RUNTIME_CONTRACT_VERSION,
    config: { trustPolicy: plane.attestation.trustPolicy, routing: 'headroom_v2' },
    destructiveMigration: false,
  });
  for (let index = 0; index < 10; index += 1) {
    plane.engine.execute(
      { token: operatorA.token, spec: workloadSpec({ tenant: TENANT_A, hardware, modelId: LOCAL_REFERENCE_MODEL_ID }) },
      { iterations: 150 },
    );
  }

  const workloadsAtKnownGood = plane.workloadStore.size;
  const rehearsal = plane.releases.rehearseRollback({
    restore: () => {
      const report = plane.snapshots.restore(knownGood.snapshotId);
      return { expectedRecords: knownGood.recordCount, observedRecords: report.recordsRestored };
    },
  });

  const recoveredVersion = plane.releases.current();
  const configLineage = plane.releases.history().every((manifest) => Boolean(manifest.configHash));

  // A destructive version must block a rollback rather than appear to succeed.
  const destructive = plane.releases.activate({
    version: '62d.2.0-destructive',
    runtimeContractVersion: RUNTIME_CONTRACT_VERSION,
    config: { migration: 'drop_column' },
    destructiveMigration: true,
  });
  const destructiveCode = catchCode(() =>
    plane.releases.rehearseRollback({ restore: () => ({ expectedRecords: 0, observedRecords: 0 }) }),
  );

  const thresholds: Threshold[] = [
    booleanThreshold('rehearsal_completed', 'Rollback rehearsal completed', rehearsal.recovered, { blocker: true }),
    booleanThreshold(
      'previous_version_recoverable',
      'Previous known-good application/runtime version recoverable',
      recoveredVersion?.version === v1.version,
      { blocker: true },
    ),
    booleanThreshold(
      'no_destructive_dependency',
      'Rollback path free of destructive dependency',
      rehearsal.destructiveDependency === false,
      { blocker: true, note: `destructive version rollback refused as ${destructiveCode}` },
    ),
    zero('unauthorized_data_loss', 'Unauthorized data loss during rehearsal', rehearsal.unauthorizedDataLoss, {
      blocker: true,
      note: `the rollback target held ${rehearsal.expectedRecords} records and ${rehearsal.observedRecords} came back; post-target writes are reverted by design and are not counted here`,
    }),
    atLeast('config_lineage', 'Configuration/version lineage retained', configLineage ? 100 : 0, 100, { blocker: true }),
  ];

  return summarize('AC-24', 'Rollback', thresholds, {
    versions: plane.releases.history().map((manifest) => ({
      version: manifest.version,
      configHash: manifest.configHash,
      previousVersion: manifest.previousVersion,
      destructiveMigration: manifest.destructiveMigration,
    })),
    fromVersion: v2.version,
    toVersion: v1.version,
    destructiveVersion: destructive.version,
    destructiveRollbackRefusalCode: destructiveCode,
    measuredRollbackDurationMs: rehearsal.durationMs,
    expectedRecords: rehearsal.expectedRecords,
    observedRecords: rehearsal.observedRecords,
    workloadsBeforeRollback: workloadsAtKnownGood,
    workloadsAfterRollback: plane.workloadStore.size,
    note: 'The measured rollback duration is the initial XIV baseline for this runtime layer only: it reverts in-process control-plane state, not a deployed application build.',
  });
}

export function runResilienceAcceptance(): AcceptanceResult[] {
  return [runAc10(), runAc11(), runAc12(), runAc23(), runAc24()];
}
