#!/usr/bin/env tsx
/**
 * 62L-DZ Supply Chain Intelligence Fabric health CLI
 */
import { supplyChainIntelligenceFabricSystemHonesty } from './supply-chain-intelligence-fabric-system';
import { buildSupplyChainIntelligenceFabricHealthReport } from './supply-chain-intelligence-fabric-runtime';
import type { DzActor } from './supply-chain-intelligence-fabric-types';

const actor: DzActor = {
  kind: 'supply_chain_intelligence_curator',
  id: 'cli',
  orgId: process.env.XIV_ORG_ID ?? 'org-local',
  tenantId: process.env.XIV_TENANT_ID ?? 'tenant-local',
  universeId: process.env.XIV_UNIVERSE_ID ?? 'universe-local',
};

const report = await buildSupplyChainIntelligenceFabricHealthReport({
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
      honesty: supplyChainIntelligenceFabricSystemHonesty(
        process.env.XIV_REPO_ROOT,
      ),
    },
    null,
    2,
  ),
);
