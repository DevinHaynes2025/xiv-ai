import { buildDistributedAppNetworkHealthReport } from './distributed-app-network-runtime';

const report = await buildDistributedAppNetworkHealthReport(process.cwd());
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.productionAuthorization ? 1 : 0;
