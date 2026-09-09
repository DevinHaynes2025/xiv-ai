import { writeCausalWorldHealth } from './causal-world-runtime';

const root = process.cwd();
const { path, report } = await writeCausalWorldHealth(root);
console.log(JSON.stringify(report, null, 2));
console.error(`[xiv-local] causal world model health written to ${path}`);
process.exitCode =
  report.productionAuthorization ||
  report.inventedPass ||
  report.locks.l4AutonomyEnabled ||
  report.locks.simulationIsReality ||
  report.locks.correlationEqualsCausation
    ? 1
    : 0;
