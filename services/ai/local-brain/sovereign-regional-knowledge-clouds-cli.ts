#!/usr/bin/env tsx
/**
 * 62L-CM health CLI — writes sovereign regional knowledge clouds health report.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { buildSovereignRegionalKnowledgeCloudsHealthReport } from './sovereign-regional-knowledge-clouds-runtime';

const root = process.cwd();
const report = await buildSovereignRegionalKnowledgeCloudsHealthReport({ root });
const outDir = join(root, '.xiv-local');
await mkdir(outDir, { recursive: true });
const outPath = join(
  outDir,
  '62l-cm-sovereign-regional-knowledge-clouds-health.json',
);
await writeFile(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`62L-CM health report → ${outPath}`);
console.log(`honesty: ${report.honestyBanner}`);
console.log(`L4_AUTONOMY_ENABLED=${report.l4AutonomyEnabled}`);
console.log(`next: ${report.nextPhase}`);
