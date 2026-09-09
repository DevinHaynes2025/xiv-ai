#!/usr/bin/env node
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { buildNeuralDatabaseHealthReport } from './neural-database-runtime';

const root = await mkdtemp(join(tmpdir(), 'xiv-62lba-cli-'));
const report = await buildNeuralDatabaseHealthReport({
  tenantId: process.env.XIV_TENANT_ID ?? 'cli-tenant',
  universeId: process.env.XIV_UNIVERSE_ID ?? 'cli-universe',
  root,
});
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.productionAuthorization ? 1 : 0;
