import { buildGlobalOperationsBrainHealthReport } from './global-operations-brain-runtime';

const report = await buildGlobalOperationsBrainHealthReport(process.cwd());
console.log(JSON.stringify(report, null, 2));

process.exitCode =
  report.productionAuthorization ||
  report.l4AutonomyEnabled ||
  report.tipLand ||
  report.megaPrBulkIncluded
    ? 1
    : 0;
