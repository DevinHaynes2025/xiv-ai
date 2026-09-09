#!/usr/bin/env tsx
/**
 * 62L-BZ health CLI — writes global compute nervous / routing health report.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { buildGlobalComputeNervousRoutingHealthReport } from './global-compute-nervous-routing-runtime';

const root = process.cwd();
const report = await buildGlobalComputeNervousRoutingHealthReport({ root });
const outDir = join(root, '.xiv-local');
await mkdir(outDir, { recursive: true });
const outPath = join(outDir, '62l-bz-global-compute-nervous-routing-health.json');
await writeFile(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`62L-BZ health report → ${outPath}`);
console.log(`honesty: ${report.honestyBanner}`);
console.log(`L4_AUTONOMY_ENABLED=${report.l4AutonomyEnabled}`);
console.log(`next: ${report.nextPhase}`);
