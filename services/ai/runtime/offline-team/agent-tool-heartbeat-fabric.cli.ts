import { readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { runApprovedMasterPlanMeeting } from './approved-master-plan-meeting';

// Explicitly invoked only: no daemon, downloads, Git writes, or provider credentials.
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.length !== 4 || args[0] !== '--tenant' || args[2] !== '--master-plan') {
    throw new Error('Usage: npm run brain:meeting -- --tenant <tenant-id> --master-plan <local-docx-path>');
  }
  const info = statSync(args[3]);
  if (!info.isFile() || info.size > 32 * 1024 * 1024) throw new Error('master plan must be a file no larger than 32 MiB');
  // Only a document digest enters the meeting. No uploaded/private plan bytes go to a model.
  const masterPlanSha256 = createHash('sha256').update(readFileSync(args[3])).digest('hex');
  const packet = await runApprovedMasterPlanMeeting({ tenantId: args[1], masterPlanSha256 });
  console.log(JSON.stringify(packet, null, 2));
  process.exitCode = packet.status === 'AWAITING_REVIEW' ? 0 : 2;
}
main().catch(() => { console.error('XIV meeting not completed: check arguments, the approved master-plan revision, and Ollama availability.'); process.exitCode = 2; });
