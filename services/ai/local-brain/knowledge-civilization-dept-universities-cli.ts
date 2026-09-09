#!/usr/bin/env tsx
/**
 * 62L-CH health CLI — writes knowledge civilization / dept universities health report.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { buildKnowledgeCivilizationDeptUniversitiesHealthReport } from './knowledge-civilization-dept-universities-runtime';

const root = process.cwd();
const report = await buildKnowledgeCivilizationDeptUniversitiesHealthReport({ root });
const outDir = join(root, '.xiv-local');
await mkdir(outDir, { recursive: true });
const outPath = join(outDir, '62l-ch-knowledge-civilization-dept-universities-health.json');
await writeFile(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`62L-CH health report → ${outPath}`);
console.log(`honesty: ${report.honestyBanner}`);
console.log(`L4_AUTONOMY_ENABLED=${report.l4AutonomyEnabled}`);
console.log(`next: ${report.nextPhase}`);
