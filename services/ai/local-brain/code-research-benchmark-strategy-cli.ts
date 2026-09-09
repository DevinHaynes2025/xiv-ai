#!/usr/bin/env tsx
/**
 * 62L-BU health CLI — writes code research / benchmark / strategy health report.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { buildCodeResearchBenchmarkStrategyHealthReport } from './code-research-benchmark-strategy-runtime';

const root = process.cwd();
const report = await buildCodeResearchBenchmarkStrategyHealthReport({ root });
const outDir = join(root, '.xiv-local');
await mkdir(outDir, { recursive: true });
const outPath = join(outDir, '62l-bu-code-research-benchmark-strategy-health.json');
await writeFile(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`62L-BU health report → ${outPath}`);
console.log(`honesty: ${report.honestyBanner}`);
console.log(`L4_AUTONOMY_ENABLED=${report.l4AutonomyEnabled}`);
console.log(`next: ${report.nextPhase}`);
