import { buildSuperbrainNeuralGrowthHealthReport } from './superbrain-neural-growth-runtime';

const report = await buildSuperbrainNeuralGrowthHealthReport(process.cwd());
console.log(JSON.stringify(report, null, 2));

process.exitCode =
  report.productionAuthorization ||
  report.l4AutonomyEnabled ||
  report.tipLand ||
  report.megaPrBulkIncluded
    ? 1
    : 0;
