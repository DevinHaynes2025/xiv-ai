#!/usr/bin/env tsx
/**
 * 62L-CO health CLI — writes global knowledge exchange OS health report.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { buildGlobalKnowledgeExchangeOsHealthReport } from './global-knowledge-exchange-os-runtime';

const root = process.cwd();
const report = await buildGlobalKnowledgeExchangeOsHealthReport({ root });
const outDir = join(root, '.xiv-local');
await mkdir(outDir, { recursive: true });
const outPath = join(outDir, '62l-co-global-knowledge-exchange-os-health.json');
await writeFile(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`62L-CO health report → ${outPath}`);
console.log(`honesty: ${report.honestyBanner}`);
console.log(`L4_AUTONOMY_ENABLED=${report.l4AutonomyEnabled}`);
console.log(`next: ${report.nextPhase}`);
