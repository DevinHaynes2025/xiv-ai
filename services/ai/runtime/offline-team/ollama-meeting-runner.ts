import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createMeetingMessage, type MeetingMessage, type MeetingRole } from './multi-agent-meeting-bus';
import { buildExecutiveDecisionPacket } from './executive-decision-packet';

const ROLES: readonly MeetingRole[] = ['FOUNDER_TWIN','VIRTUAL_COO','DEVOPS','AI_ENGINEER','SECURITY','CFO','REVIEWER','CHALLENGER'];

function rolePrompt(role: MeetingRole, objective: string): string {
  return `You are the XIV ${role} agent in a private offline council. Objective: ${objective}.\nGive one concise recommendation, one risk, one challenge to another role, and cite only evidence supplied in the prompt. Do not claim tests passed unless executed. Do not deploy, move money, modify production databases, expose secrets, or override human approval.`;
}

async function callOllama(model: string, prompt: string): Promise<string> {
  const response = await fetch('http://127.0.0.1:11434/api/generate', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model, prompt, stream: false }),
  });
  if (!response.ok) throw new Error(`OLLAMA_HTTP_${response.status}`);
  const body = await response.json() as { response?: string };
  if (!body.response?.trim()) throw new Error('OLLAMA_EMPTY_RESPONSE');
  return body.response.trim();
}

export async function runLocalMeeting(input: { tenantId: string; objective: string; model?: string; evidenceRefs?: readonly string[]; rootDir?: string }) {
  const model = input.model ?? 'qwen2.5-coder:7b';
  const meetingId = `xiv-meeting-${Date.now()}`;
  const evidenceRefs = Object.freeze([...(input.evidenceRefs ?? ['LOCAL_OLLAMA_RUNTIME'])]);
  const messages: MeetingMessage[] = [];
  for (const role of ROLES) {
    const content = await callOllama(model, rolePrompt(role, input.objective));
    messages.push(createMeetingMessage({ meetingId, tenantId: input.tenantId, role, content, evidenceRefs, createdAt: new Date().toISOString() }));
  }
  const packet = buildExecutiveDecisionPacket({ messages, recommendation: 'Review council outputs and choose the next bounded action.', supportingRoles: ROLES, dissentingRoles: ['CHALLENGER'], unresolvedRisks: ['Human review required before consequential action.'] });
  const root = input.rootDir ?? resolve(process.cwd(), '..', '..', '..');
  const dir = join(root, '.xiv-runtime', 'meetings');
  await mkdir(dir, { recursive: true });
  const path = join(dir, `${meetingId}.json`);
  await writeFile(path, JSON.stringify({ meetingId, model, objective: input.objective, messages, packet }, null, 2), 'utf8');
  return Object.freeze({ meetingId, model, messages: Object.freeze(messages), packet, path });
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  const objective = process.env.XIV_MEETING_OBJECTIVE ?? 'Review XIV offline architecture and propose the next bounded user story.';
  runLocalMeeting({ tenantId: process.env.XIV_TENANT_ID ?? 'xiv-local', objective })
    .then((result) => console.log(JSON.stringify({ meetingId: result.meetingId, model: result.model, path: result.path, requiresHumanApproval: result.packet.requiresHumanApproval }, null, 2)))
    .catch((error) => { console.error(error instanceof Error ? error.stack ?? error.message : String(error)); process.exitCode = 1; });
}
