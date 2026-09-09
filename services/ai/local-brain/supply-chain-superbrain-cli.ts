#!/usr/bin/env tsx
/**
 * 62L-DW Supply Chain Superbrain health CLI
 */
import { supplyChainSuperbrainOsHonesty } from './supply-chain-superbrain';
import { buildSupplyChainSuperbrainHealthReport } from './supply-chain-superbrain-runtime';
import type { DwActor } from './supply-chain-superbrain-types';

const actor: DwActor = {
  kind: 'supply_chain_curator',
  id: 'cli',
  orgId: process.env.XIV_ORG_ID ?? 'org-local',
  tenantId: process.env.XIV_TENANT_ID ?? 'tenant-local',
  universeId: process.env.XIV_UNIVERSE_ID ?? 'universe-local',
};

const report = await buildSupplyChainSuperbrainHealthReport({
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
      honesty: supplyChainSuperbrainOsHonesty(process.env.XIV_REPO_ROOT),
    },
    null,
    2,
  ),
);
