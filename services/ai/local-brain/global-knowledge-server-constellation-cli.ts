#!/usr/bin/env tsx
/**
 * 62L-CL health CLI — writes global knowledge server constellation health report.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { buildGlobalKnowledgeServerConstellationHealthReport } from './global-knowledge-server-constellation-runtime';

const root = process.cwd();
const report = await buildGlobalKnowledgeServerConstellationHealthReport({ root });
const outDir = join(root, '.xiv-local');
await mkdir(outDir, { recursive: true });
const outPath = join(outDir, '62l-cl-global-knowledge-server-constellation-health.json');
await writeFile(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`62L-CL health report → ${outPath}`);
console.log(`honesty: ${report.honestyBanner}`);
console.log(`L4_AUTONOMY_ENABLED=${report.l4AutonomyEnabled}`);
console.log(`next: ${report.nextPhase}`);
