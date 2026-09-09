#!/usr/bin/env tsx
/**
 * 62L-DX Autonomous Supply Chain Operations health CLI
 */
import { autonomousSupplyChainOpsHonesty } from './autonomous-supply-chain-ops';
import { buildAutonomousSupplyChainOpsHealthReport } from './autonomous-supply-chain-ops-runtime';
import type { DxActor } from './autonomous-supply-chain-ops-types';

const actor: DxActor = {
  kind: 'supply_chain_ops_analyst',
  id: 'cli',
  orgId: process.env.XIV_ORG_ID ?? 'org-local',
  tenantId: process.env.XIV_TENANT_ID ?? 'tenant-local',
  universeId: process.env.XIV_UNIVERSE_ID ?? 'universe-local',
};

const report = await buildAutonomousSupplyChainOpsHealthReport({
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
      honesty: autonomousSupplyChainOpsHonesty(process.env.XIV_REPO_ROOT),
    },
    null,
    2,
  ),
);
