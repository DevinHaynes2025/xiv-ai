import { buildOrgNeuralFederationHealthReport } from './org-neural-federation-runtime';

const report = await buildOrgNeuralFederationHealthReport(process.cwd());
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.productionAuthorization ? 1 : 0;
