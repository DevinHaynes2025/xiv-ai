#!/usr/bin/env tsx
/**
 * 62L-CF health CLI — writes data refinery / compression / replication health report.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { buildDataRefineryCompressionReplicationHealthReport } from './data-refinery-compression-replication-runtime';

const root = process.cwd();
const report = await buildDataRefineryCompressionReplicationHealthReport({ root });
const outDir = join(root, '.xiv-local');
await mkdir(outDir, { recursive: true });
const outPath = join(outDir, '62l-cf-data-refinery-compression-replication-health.json');
await writeFile(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`62L-CF health report → ${outPath}`);
console.log(`honesty: ${report.honestyBanner}`);
console.log(`L4_AUTONOMY_ENABLED=${report.l4AutonomyEnabled}`);
console.log(`next: ${report.nextPhase}`);
