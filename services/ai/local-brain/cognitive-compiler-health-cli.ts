import { buildCognitiveCompilerHealthReport } from './cognitive-compiler-runtime';

const report = await buildCognitiveCompilerHealthReport(process.cwd());
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.productionAuthorization ? 1 : 0;
