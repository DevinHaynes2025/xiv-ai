import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildSuperbrainNeuralGrowthHealthReport } from './superbrain-neural-growth-runtime';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const report = await buildSuperbrainNeuralGrowthHealthReport(repoRoot);
console.log(JSON.stringify(report, null, 2));

process.exitCode =
  report.productionAuthorization ||
  report.l4AutonomyEnabled ||
  report.tipLand ||
  report.megaPrBulkIncluded
    ? 1
    : 0;
