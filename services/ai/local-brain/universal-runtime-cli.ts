import { buildAvHealthReport } from './universal-runtime';

const tenantId = process.env.XIV_TENANT_ID ?? 'local-tenant';
const universeId = process.env.XIV_UNIVERSE_ID ?? 'local-universe';
const report = await buildAvHealthReport({ tenantId, universeId, root: process.cwd() });
console.log(JSON.stringify(report, null, 2));
process.exitCode =
  report.honesty.l4AutonomyEnabled
  || report.honesty.cfoMayChargeCustomers
  || report.honesty.vehicleControlAuthorized
  || report.charged > 0
  || report.billingMutated > 0
  || report.vehicleControlAuthorized > 0
    ? 1
    : 0;
