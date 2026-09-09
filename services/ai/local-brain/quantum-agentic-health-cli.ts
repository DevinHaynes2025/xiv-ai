import { buildQuantumAgenticHealthReport } from './quantum-agentic-runtime';

const report = await buildQuantumAgenticHealthReport(process.cwd());
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.productionAuthorization ? 1 : 0;
