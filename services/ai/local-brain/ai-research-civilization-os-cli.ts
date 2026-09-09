#!/usr/bin/env tsx
/**
 * 62L-CT health CLI — writes AI research civilization OS health report.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { buildAiResearchCivilizationOsHealthReport } from './ai-research-civilization-os-runtime';

const root = process.cwd();
const report = await buildAiResearchCivilizationOsHealthReport({ root });
const outDir = join(root, '.xiv-local');
await mkdir(outDir, { recursive: true });
const outPath = join(outDir, '62l-ct-ai-research-civilization-os-health.json');
await writeFile(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`62L-CT health report → ${outPath}`);
console.log(`honesty: ${report.honestyBanner}`);
console.log(`L4_AUTONOMY_ENABLED=${report.l4AutonomyEnabled}`);
console.log(`next: ${report.nextPhase}`);
