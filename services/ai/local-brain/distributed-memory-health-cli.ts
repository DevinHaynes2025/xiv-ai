import { buildDistributedMemoryHealthReport } from './distributed-memory-runtime';

const report = await buildDistributedMemoryHealthReport(process.cwd());
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.productionAuthorization ? 1 : 0;
