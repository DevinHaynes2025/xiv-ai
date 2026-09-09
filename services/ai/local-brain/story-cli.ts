import { writeFile } from 'node:fs/promises';
import { generateStories } from './story-factory';

const count = Number(process.argv[2] ?? '100');
const output = process.argv[3];
if (!Number.isSafeInteger(count) || count < 1 || count > 1_000_000) {
  throw new Error('count must be an integer from 1 to 1,000,000');
}

if (!output) {
  const preview = [...generateStories(Math.min(count, 20))];
  console.log(JSON.stringify({ requested: count, preview, note: 'Pass an output path to materialize up to 1,000,000 generated stories.' }, null, 2));
} else {
  const lines: string[] = [];
  for (const story of generateStories(count)) lines.push(JSON.stringify(story));
  await writeFile(output, `${lines.join('\n')}\n`, 'utf8');
  console.log(JSON.stringify({ written: count, output, productionAuthorization: false }));
}
