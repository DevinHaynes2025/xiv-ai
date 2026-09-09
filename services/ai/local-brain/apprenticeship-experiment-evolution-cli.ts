import { buildApprenticeshipExperimentEvolutionHealthReport } from './apprenticeship-experiment-evolution-runtime';

const report = await buildApprenticeshipExperimentEvolutionHealthReport(process.cwd());
console.log(JSON.stringify(report, null, 2));

process.exitCode =
  report.productionAuthorization ||
  report.l4AutonomyEnabled ||
  report.tipLand ||
  report.megaPrBulkIncluded
    ? 1
    : 0;
