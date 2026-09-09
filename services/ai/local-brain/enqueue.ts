import { enqueueLocalTask } from './supervisor';
import type { LocalTask } from './types';

const kind = (process.argv[2] ?? 'analysis') as LocalTask['kind'];
const allowed = new Set<LocalTask['kind']>(['analysis', 'coding', 'testing', 'research']);
if (!allowed.has(kind)) throw new Error('kind must be analysis, coding, testing, or research');

const prompt = process.argv.slice(3).join(' ').trim();
if (!prompt) throw new Error('task prompt is required');

const task = await enqueueLocalTask(kind, prompt);
console.info(JSON.stringify(task, null, 2));
