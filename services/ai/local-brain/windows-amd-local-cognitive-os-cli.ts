#!/usr/bin/env tsx
/**
 * 62L-EK Windows/AMD Local Cognitive OS health CLI
 */
import { windowsAmdLocalCognitiveOsHonesty } from './windows-amd-local-cognitive-os';
import { buildWindowsAmdLocalCognitiveOsHealthReport } from './windows-amd-local-cognitive-os-runtime';
import type { EkActor } from './windows-amd-local-cognitive-os-types';

const actor: EkActor = {
  kind: 'windows_runtime_probe_operator',
  id: 'cli',
  orgId: process.env.XIV_ORG_ID ?? 'org-local',
  tenantId: process.env.XIV_TENANT_ID ?? 'tenant-local',
  universeId: process.env.XIV_UNIVERSE_ID ?? 'universe-local',
};

const report = await buildWindowsAmdLocalCognitiveOsHealthReport({
  orgId: actor.orgId,
  tenantId: actor.tenantId,
  universeId: actor.universeId,
  actor,
  root: process.env.XIV_ROOT ?? process.cwd(),
  repoRoot: process.env.XIV_REPO_ROOT,
});

console.log(
  JSON.stringify(
    {
      report,
      honesty: windowsAmdLocalCognitiveOsHonesty(process.env.XIV_REPO_ROOT),
    },
    null,
    2,
  ),
);
