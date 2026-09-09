#!/usr/bin/env tsx
/**
 * 62L-EI Chip-to-Cloud Cognitive Fabric health CLI
 */
import { chipToCloudCognitiveFabricOsHonesty } from './chip-to-cloud-cognitive-fabric-os';
import { buildChipToCloudCognitiveFabricHealthReport } from './chip-to-cloud-cognitive-fabric-runtime';
import type { EiActor } from './chip-to-cloud-cognitive-fabric-types';

const actor: EiActor = {
  kind: 'chip_cloud_fabric_curator',
  id: 'cli',
  orgId: process.env.XIV_ORG_ID ?? 'org-local',
  tenantId: process.env.XIV_TENANT_ID ?? 'tenant-local',
  universeId: process.env.XIV_UNIVERSE_ID ?? 'universe-local',
};

const report = await buildChipToCloudCognitiveFabricHealthReport({
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
      honesty: chipToCloudCognitiveFabricOsHonesty(process.env.XIV_REPO_ROOT),
    },
    null,
    2,
  ),
);
