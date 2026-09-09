import { buildStructuredCodeMemoryHealthReport } from './structured-code-memory-runtime';

const report = await buildStructuredCodeMemoryHealthReport(process.cwd());
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.productionAuthorization ? 1 : 0;
