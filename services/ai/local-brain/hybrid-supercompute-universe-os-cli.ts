#!/usr/bin/env tsx
/**
 * 62L-CR health CLI — writes hybrid supercompute universe OS health report.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { buildHybridSupercomputeUniverseOsHealthReport } from './hybrid-supercompute-universe-os-runtime';

const root = process.cwd();
const report = await buildHybridSupercomputeUniverseOsHealthReport({ root });
const outDir = join(root, '.xiv-local');
await mkdir(outDir, { recursive: true });
const outPath = join(outDir, '62l-cr-hybrid-supercompute-universe-os-health.json');
await writeFile(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`62L-CR health report → ${outPath}`);
console.log(`honesty: ${report.honestyBanner}`);
console.log(`L4_AUTONOMY_ENABLED=${report.l4AutonomyEnabled}`);
console.log(`next: ${report.nextPhase}`);
