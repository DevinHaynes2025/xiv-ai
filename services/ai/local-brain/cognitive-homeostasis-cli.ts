import { buildCognitiveHomeostasisHealthReport } from './cognitive-homeostasis-runtime';

const report = await buildCognitiveHomeostasisHealthReport(process.cwd());
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.productionAuthorization ? 1 : 0;
