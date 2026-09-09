#!/usr/bin/env tsx
/**
 * 62L-CU health CLI — writes cognitive research cloud health report.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { buildCognitiveResearchCloudHealthReport } from './cognitive-research-cloud-runtime';

const root = process.cwd();
const report = await buildCognitiveResearchCloudHealthReport({ root });
const outDir = join(root, '.xiv-local');
await mkdir(outDir, { recursive: true });
const outPath = join(outDir, '62l-cu-cognitive-research-cloud-health.json');
await writeFile(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`62L-CU health report → ${outPath}`);
console.log(`honesty: ${report.honestyBanner}`);
console.log(`L4_AUTONOMY_ENABLED=${report.l4AutonomyEnabled}`);
console.log(`next: ${report.nextPhase}`);
