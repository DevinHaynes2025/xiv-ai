import { writeSupplyChainHealth } from './supply-chain-runtime';

const root = process.cwd();
const { path, report } = await writeSupplyChainHealth(root);
console.log(JSON.stringify(report, null, 2));
console.error(`[xiv-local] supply-chain network health written to ${path}`);
process.exitCode =
  report.productionAuthorization ||
  report.inventedPass ||
  report.locks.l4AutonomyEnabled ||
  report.locks.collusionAllowed ||
  report.locks.autoPurchase ||
  report.tipLand
    ? 1
    : 0;
