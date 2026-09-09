import { buildFounderReport } from './founder-report';

const report = await buildFounderReport(process.cwd());
console.log(JSON.stringify(report, null, 2));
