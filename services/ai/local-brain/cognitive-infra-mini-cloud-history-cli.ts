#!/usr/bin/env tsx
/**
 * 62L-CK health CLI — writes Cognitive Infra / Mini Cloud / History health report.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { buildCognitiveInfraMiniCloudHistoryHealthReport } from './cognitive-infra-mini-cloud-history-runtime';

const root = process.cwd();
const report = await buildCognitiveInfraMiniCloudHistoryHealthReport({ root });
const outDir = join(root, '.xiv-local');
await mkdir(outDir, { recursive: true });
const outPath = join(outDir, '62l-ck-cognitive-infra-mini-cloud-history-health.json');
await writeFile(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`62L-CK health report → ${outPath}`);
console.log(`honesty: ${report.honestyBanner}`);
console.log(`L4_AUTONOMY_ENABLED=${report.l4AutonomyEnabled}`);
console.log(`next: ${report.nextPhase}`);
