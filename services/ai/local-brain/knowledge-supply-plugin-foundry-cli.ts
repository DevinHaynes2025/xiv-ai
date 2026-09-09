#!/usr/bin/env tsx
/**
 * 62L-CP health CLI — writes knowledge supply / plugin foundry health report.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { buildKnowledgeSupplyPluginFoundryHealthReport } from './knowledge-supply-plugin-foundry-runtime';

const root = process.cwd();
const report = await buildKnowledgeSupplyPluginFoundryHealthReport({ root });
const outDir = join(root, '.xiv-local');
await mkdir(outDir, { recursive: true });
const outPath = join(outDir, '62l-cp-knowledge-supply-plugin-foundry-health.json');
await writeFile(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`62L-CP health report → ${outPath}`);
console.log(`honesty: ${report.honestyBanner}`);
console.log(`L4_AUTONOMY_ENABLED=${report.l4AutonomyEnabled}`);
console.log(`next: ${report.nextPhase}`);
