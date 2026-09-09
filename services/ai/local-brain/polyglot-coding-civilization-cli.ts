#!/usr/bin/env tsx
/**
 * 62L-BQ health CLI — polyglot coding civilization / tool foundry / puzzle / federation / architecture expansion.
 */

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildPolyglotCodingCivilizationHealthReport } from './polyglot-coding-civilization-runtime';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const report = buildPolyglotCodingCivilizationHealthReport(root);

console.log(JSON.stringify(report, null, 2));

if (report.productionAuthorization !== false || report.l4AutonomyEnabled !== false) {
  process.exitCode = 1;
}
