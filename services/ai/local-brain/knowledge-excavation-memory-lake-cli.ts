#!/usr/bin/env tsx
/**
 * 62L-CE health CLI — writes knowledge excavation / memory lake health report.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { buildKnowledgeExcavationMemoryLakeHealthReport } from './knowledge-excavation-memory-lake-runtime';

const root = process.cwd();
const report = await buildKnowledgeExcavationMemoryLakeHealthReport({ root });
const outDir = join(root, '.xiv-local');
await mkdir(outDir, { recursive: true });
const outPath = join(outDir, '62l-ce-knowledge-excavation-memory-lake-health.json');
await writeFile(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`62L-CE health report → ${outPath}`);
console.log(`honesty: ${report.honestyBanner}`);
console.log(`L4_AUTONOMY_ENABLED=${report.l4AutonomyEnabled}`);
console.log(`next: ${report.nextPhase}`);
