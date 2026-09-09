#!/usr/bin/env tsx
/**
 * 62L-CI health CLI — writes persistent intelligence economy health report.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { buildPersistentIntelligenceEconomyHealthReport } from './persistent-intelligence-economy-runtime';

const root = process.cwd();
const report = await buildPersistentIntelligenceEconomyHealthReport({ root });
const outDir = join(root, '.xiv-local');
await mkdir(outDir, { recursive: true });
const outPath = join(outDir, '62l-ci-persistent-intelligence-economy-health.json');
await writeFile(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`62L-CI health report → ${outPath}`);
console.log(`honesty: ${report.honestyBanner}`);
console.log(`L4_AUTONOMY_ENABLED=${report.l4AutonomyEnabled}`);
console.log(`next: ${report.nextPhase}`);
