import { buildDeveloperPlatformHealthReport } from './developer-platform-runtime';

const report = await buildDeveloperPlatformHealthReport({ root: process.cwd() });
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.productionAuthorization ? 1 : 0;
