import { createHostExecutor } from './host';
import { runGuardianValidationSuite } from './trusted';

async function main() {
  const report = await runGuardianValidationSuite({ host: createHostExecutor() });
  console.log(report.summary);
  for (const check of report.checks) {
    console.log(`${check.id}\t${check.status}\t${check.executionMode}\t${check.message}`);
  }
}

void main();
