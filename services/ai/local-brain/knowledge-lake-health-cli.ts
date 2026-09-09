import { buildKnowledgeLakeHealthReport } from './knowledge-lake-runtime';

const report = await buildKnowledgeLakeHealthReport(process.cwd());
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.productionAuthorization ? 1 : 0;
