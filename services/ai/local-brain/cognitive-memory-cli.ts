import { buildCognitiveMemoryHealthReport } from './cognitive-memory-runtime';

const report = await buildCognitiveMemoryHealthReport(process.cwd());
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.productionAuthorization ? 1 : 0;
