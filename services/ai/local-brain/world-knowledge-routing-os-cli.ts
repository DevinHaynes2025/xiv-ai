#!/usr/bin/env tsx
/**
 * 62L-CN World Knowledge Routing OS health CLI.
 */
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { buildWorldKnowledgeRoutingOsHealthReport } from './world-knowledge-routing-os-runtime';

const root = process.cwd();
const report = await buildWorldKnowledgeRoutingOsHealthReport({ root });
const out = join(root, '.xiv-local', '62l-cn-world-knowledge-routing-os-health.json');
await writeFile(out, `${JSON.stringify(report, null, 2)}\n`, 'utf8').catch(async () => {
  const { mkdir } = await import('node:fs/promises');
  await mkdir(join(root, '.xiv-local'), { recursive: true });
  await writeFile(out, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
});
console.log(JSON.stringify(report, null, 2));
console.log(`wrote ${out}`);
