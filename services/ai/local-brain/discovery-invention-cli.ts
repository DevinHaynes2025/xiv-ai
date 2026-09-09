import { writeDiscoveryHealth } from './discovery-invention-health';

const root = process.cwd();
const { path, report } = await writeDiscoveryHealth(root);
console.log(JSON.stringify(report, null, 2));
console.error(`[xiv-local] knowledge discovery / invention lab health written to ${path}`);
process.exitCode =
  report.productionAuthorization ||
  report.inventedPass ||
  report.locks.l4AutonomyEnabled ||
  report.locks.patternEqualsCausation ||
  report.locks.hypothesisEqualsFact ||
  report.locks.prototypeEqualsValidatedInvention ||
  report.tipLand
    ? 1
    : 0;
