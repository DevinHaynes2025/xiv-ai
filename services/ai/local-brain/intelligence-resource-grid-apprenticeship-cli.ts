#!/usr/bin/env tsx
/**
 * 62L-CJ health CLI — writes intelligence resource grid / apprenticeship health report.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { buildIntelligenceResourceGridApprenticeshipHealthReport } from './intelligence-resource-grid-apprenticeship-runtime';

const root = process.cwd();
const report = await buildIntelligenceResourceGridApprenticeshipHealthReport({ root });
const outDir = join(root, '.xiv-local');
await mkdir(outDir, { recursive: true });
const outPath = join(
  outDir,
  '62l-cj-intelligence-resource-grid-apprenticeship-health.json',
);
await writeFile(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`62L-CJ health report → ${outPath}`);
console.log(`honesty: ${report.honestyBanner}`);
console.log(`L4_AUTONOMY_ENABLED=${report.l4AutonomyEnabled}`);
console.log(`next: ${report.nextPhase}`);
