#!/usr/bin/env tsx
/**
 * 62L-BY health CLI — writes hardware cortex / synapse compiler health report.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { buildHardwareCortexSynapseCompilerHealthReport } from './hardware-cortex-synapse-compiler-runtime';

const root = process.cwd();
const report = await buildHardwareCortexSynapseCompilerHealthReport({ root });
const outDir = join(root, '.xiv-local');
await mkdir(outDir, { recursive: true });
const outPath = join(outDir, '62l-by-hardware-cortex-synapse-compiler-health.json');
await writeFile(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`62L-BY health report → ${outPath}`);
console.log(`honesty: ${report.honestyBanner}`);
console.log(`L4_AUTONOMY_ENABLED=${report.l4AutonomyEnabled}`);
console.log(`next: ${report.nextPhase}`);
