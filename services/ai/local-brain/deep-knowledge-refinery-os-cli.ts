#!/usr/bin/env tsx
/**
 * 62L-CG health CLI — writes Deep Knowledge Refinery OS health report.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { buildDeepKnowledgeRefineryOsHealthReport } from './deep-knowledge-refinery-os-runtime';

const root = process.cwd();
const report = await buildDeepKnowledgeRefineryOsHealthReport({ root });
const outDir = join(root, '.xiv-local');
await mkdir(outDir, { recursive: true });
const outPath = join(outDir, '62l-cg-deep-knowledge-refinery-os-health.json');
await writeFile(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`62L-CG health report → ${outPath}`);
console.log(`honesty: ${report.honestyBanner}`);
console.log(`L4_AUTONOMY_ENABLED=${report.l4AutonomyEnabled}`);
console.log(`next: ${report.nextPhase}`);
