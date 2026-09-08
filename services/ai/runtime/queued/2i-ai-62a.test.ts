import assert from 'node:assert/strict';
import {
  ACCEPTANCE_CRITERIA_DEMONSTRATED,
  AGENT_IDENTITY_FIELDS,
  AGENT_SCHEDULING_PIPELINE,
  AUTO_FLAGS,
  CAPABILITY_FLAGS,
  COMPUTE_TIERS,
  DEPLOYMENT_GATE_BLOCKED,
  DEPLOYMENT_STATE,
  HISTORICAL_RECORD_FIELDS,
  IMPLEMENTATION_STARTED,
  INFORMATION_LINEAGE_STAGES,
  INVARIANTS,
  KNOWLEDGE_CLASSES,
  L4_AUTONOMY_ENABLED,
  NAMESPACE_HIERARCHY,
  OPEN_SCHEMA_DEFECTS,
  PREEXISTING_TABLES,
  PROHIBITED_AGENT_ACTIONS,
  QUEUE_SEQUENCE,
  SLICE_1_TABLE_DISPOSITION,
  SPACE_PROVIDER_STATE,
  STORAGE_TIERS,
  STORY_ID,
  STORY_SERIES,
  UNIVERSE_LIFECYCLE_STATES,
  XACP_RECORD_FIELDS,
  XACP_STAGES,
  allAutoFlagsFalse,
  allCapabilityFlagsFalse,
  dispositionIsSafe,
  noAcceptanceCriteriaDemonstrated,
  storyIsImplemented,
} from './2i-ai-62a';

assert.equal(STORY_ID, '2I-AI-62A');
assert.equal(STORY_SERIES, '2I-AI-62');
assert.equal(DEPLOYMENT_STATE, 'QUEUED');
assert.equal(IMPLEMENTATION_STARTED, false);
assert.equal(L4_AUTONOMY_ENABLED, false);
assert.equal(storyIsImplemented(), false);
assert.equal(allCapabilityFlagsFalse(), true);
assert.equal(allAutoFlagsFalse(), true);

// The deployment gate is owned by other work; 62A must not lift it.
assert.equal(DEPLOYMENT_GATE_BLOCKED, true);

for (const [flag, value] of Object.entries(CAPABILITY_FLAGS)) {
  assert.equal(value, false, `${flag} must remain false while queued`);
}

for (const [flag, value] of Object.entries(AUTO_FLAGS)) {
  assert.equal(value, false, `${flag} must remain false`);
}

// §1 — an identity missing any field is not instantiable.
assert.equal(AGENT_IDENTITY_FIELDS.length, 18);
for (const field of ['guardian_policy', 'human_supervisor', 'resource_budget', 'provenance']) {
  assert.ok(
    (AGENT_IDENTITY_FIELDS as readonly string[]).includes(field),
    `agent identity must carry ${field}`,
  );
}

// §2 — XACP is a closed, ordered pipeline ending in an archived record.
assert.deepEqual(XACP_STAGES, [
  'discover',
  'request',
  'negotiate',
  'reason',
  'delegate',
  'collaborate',
  'verify',
  'report',
  'archive',
]);
assert.ok(XACP_STAGES.indexOf('verify') < XACP_STAGES.indexOf('report'));
assert.equal(XACP_STAGES[XACP_STAGES.length - 1], 'archive');
for (const field of ['evidence', 'reasoning_artifact', 'confidence', 'approval']) {
  assert.ok(
    (XACP_RECORD_FIELDS as readonly string[]).includes(field),
    `XACP record must carry ${field}`,
  );
}

// §4 — knowledge classes stay distinct, and UNKNOWN is representable.
assert.ok(KNOWLEDGE_CLASSES.includes('UNKNOWN'));
assert.ok(KNOWLEDGE_CLASSES.includes('HUMAN_OPINION'));
assert.ok(KNOWLEDGE_CLASSES.includes('AGENT_INFERENCE'));
assert.notEqual(
  KNOWLEDGE_CLASSES.indexOf('HUMAN_FACT'),
  KNOWLEDGE_CLASSES.indexOf('AGENT_INFERENCE'),
);
assert.equal(new Set(KNOWLEDGE_CLASSES).size, KNOWLEDGE_CLASSES.length);

// §5 — contradictions are preserved, not resolved away.
assert.ok(HISTORICAL_RECORD_FIELDS.includes('contradictions'));
assert.ok(HISTORICAL_RECORD_FIELDS.includes('translation'));
assert.ok(HISTORICAL_RECORD_FIELDS.includes('interpretation'));

// §7 — lifecycle runs Created through Archive.
assert.equal(UNIVERSE_LIFECYCLE_STATES[0], 'CREATED');
assert.equal(UNIVERSE_LIFECYCLE_STATES[UNIVERSE_LIFECYCLE_STATES.length - 1], 'ARCHIVE');
assert.ok(
  UNIVERSE_LIFECYCLE_STATES.indexOf('OPERATIONAL') <
    UNIVERSE_LIFECYCLE_STATES.indexOf('MATURE'),
);

// §11 — activation is bounded by a resource governor before any runtime.
assert.ok(
  AGENT_SCHEDULING_PIPELINE.indexOf('RESOURCE_GOVERNOR') <
    AGENT_SCHEDULING_PIPELINE.indexOf('ACTIVE_AGENTS'),
);
assert.ok(
  AGENT_SCHEDULING_PIPELINE.indexOf('ACTIVE_AGENTS') <
    AGENT_SCHEDULING_PIPELINE.indexOf('RUNTIME'),
);
assert.equal(AGENT_SCHEDULING_PIPELINE[AGENT_SCHEDULING_PIPELINE.length - 1], 'SLEEP_ARCHIVE');

// §12 — lineage answers where information came from and what decided on it.
assert.equal(INFORMATION_LINEAGE_STAGES[0], 'ORIGIN');
assert.ok(INFORMATION_LINEAGE_STAGES.includes('DECISION'));
assert.ok(INFORMATION_LINEAGE_STAGES.includes('RETENTION_DELETION'));

// §13 — space stays an unconfigured external provider.
assert.equal(SPACE_PROVIDER_STATE, 'UNCONFIGURED');
assert.equal(COMPUTE_TIERS[0], 'EARTH_CLOUD');
assert.ok(COMPUTE_TIERS.includes('DEEP_SPACE'));
assert.ok(!(COMPUTE_TIERS as readonly string[]).includes('AUTHORIZED'));

// §14 — namespace is a hierarchy, Galaxy is the outermost abstraction.
assert.deepEqual(NAMESPACE_HIERARCHY, ['AGENT', 'TEAM', 'UNIVERSE', 'CONSTELLATION', 'GALAXY']);

// §15 — tiering exists and provenance survives compression.
assert.equal(STORAGE_TIERS[0], 'HOT');
assert.ok(STORAGE_TIERS.includes('PROVENANCE_STORE'));

// Security boundary — closed list of twelve prohibitions.
assert.equal(PROHIBITED_AGENT_ACTIONS.length, 12);
for (const action of [
  'DISABLE_RLS',
  'INCREASE_OWN_PERMISSIONS',
  'SELF_DEPLOY_TO_PRODUCTION',
  'MODIFY_GUARDIAN',
  'COMMAND_SATELLITES',
  'CREATE_RECURSIVE_AGENT_POPULATIONS',
]) {
  assert.ok(
    (PROHIBITED_AGENT_ACTIONS as readonly string[]).includes(action),
    `${action} must stay prohibited`,
  );
}

// Schema reconciliation — a table that already exists must never be CREATEd.
assert.equal(SLICE_1_TABLE_DISPOSITION.agent_meetings, 'EXTEND');
assert.equal(SLICE_1_TABLE_DISPOSITION.agent_task_forces, 'EXTEND');
assert.equal(SLICE_1_TABLE_DISPOSITION.agent_messages, 'RENAME');
assert.equal(SLICE_1_TABLE_DISPOSITION.universe_lifecycle, 'RECONCILE');
assert.equal(Object.keys(SLICE_1_TABLE_DISPOSITION).length, 15);

for (const table of Object.keys(SLICE_1_TABLE_DISPOSITION) as Array<
  keyof typeof SLICE_1_TABLE_DISPOSITION
>) {
  assert.ok(dispositionIsSafe(table), `${table} disposition would fork the existing schema`);
}

assert.ok(PREEXISTING_TABLES.includes('agent_meetings'));
assert.ok(PREEXISTING_TABLES.includes('agent_task_forces'));

// Both reconciliation defects stay open until Slice 1.0 closes them.
assert.equal(OPEN_SCHEMA_DEFECTS.universeBlindRls, true);
assert.equal(OPEN_SCHEMA_DEFECTS.tenantIdTypeInconsistent, true);

// Nothing is demonstrated yet; never infer PASS.
assert.equal(noAcceptanceCriteriaDemonstrated(), true);
for (const [criterion, value] of Object.entries(ACCEPTANCE_CRITERIA_DEMONSTRATED)) {
  assert.equal(value, false, `${criterion} must not be claimed while queued`);
}

for (const [name, value] of Object.entries(INVARIANTS)) {
  assert.equal(value, false, `invariant ${name} must stay denied`);
}

assert.equal(QUEUE_SEQUENCE[0], '2I-AI-62A');
assert.equal(QUEUE_SEQUENCE.length, 8);

console.log('2I-AI-62A queued architecture contracts hold (NOT IMPLEMENTED).');
