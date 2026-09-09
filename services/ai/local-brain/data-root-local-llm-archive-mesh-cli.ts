#!/usr/bin/env tsx
/**
 * 62L-CD health CLI — writes data-root / local-llm / archive / mesh health report.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { buildDataRootLocalLlmArchiveMeshHealthReport } from './data-root-local-llm-archive-mesh-runtime';

const root = process.cwd();
const report = await buildDataRootLocalLlmArchiveMeshHealthReport({ root });
const outDir = join(root, '.xiv-local');
await mkdir(outDir, { recursive: true });
const outPath = join(outDir, '62l-cd-data-root-local-llm-archive-mesh-health.json');
await writeFile(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`62L-CD health report → ${outPath}`);
console.log(`honesty: ${report.honestyBanner}`);
console.log(`L4_AUTONOMY_ENABLED=${report.l4AutonomyEnabled}`);
console.log(`next: ${report.nextPhase}`);
