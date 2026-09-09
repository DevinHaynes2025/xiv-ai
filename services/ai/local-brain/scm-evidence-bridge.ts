import { runAllowedLocalCommand } from './local-command-runner';
import { appendEvidenceEvent } from './evidence-ledger';
import { toolchainSlots, type ToolchainSlot } from './toolchain-federation';
import type { EvidenceState } from './evidence-promotion-gate';

export type ScmBridgeResult = {
  github: ToolchainSlot;
  gitlab: ToolchainSlot;
  localGit: {
    attempted: boolean;
    exitCode: number | null;
    state: EvidenceState;
    stdout: string;
  };
  remoteFetch: 'UNAVAILABLE' | 'WAITING_DATA';
  inventedPass: false;
  productionAuthorization: false;
};

export async function bridgeGithubGitlabEvidence(input: {
  tenantId: string;
  universeId: string;
  cwd: string;
  root?: string;
}): Promise<ScmBridgeResult> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const slots = toolchainSlots();
  const github = slots.find((slot) => slot.adapter === 'github')!;
  const gitlab = slots.find((slot) => slot.adapter === 'gitlab')!;
  let localGit: ScmBridgeResult['localGit'] = {
    attempted: false,
    exitCode: null,
    state: 'NOT_TESTED',
    stdout: '',
  };
  try {
    const result = await runAllowedLocalCommand({ id: 'git_status', cwd: input.cwd, timeoutMs: 8_000 });
    localGit = {
      attempted: true,
      exitCode: result.exitCode,
      state: result.exitCode === 0 ? 'PASS' : 'FAIL',
      stdout: result.stdout.slice(0, 2_000),
    };
  } catch (error) {
    localGit = {
      attempted: true,
      exitCode: null,
      state: 'UNAVAILABLE',
      stdout: error instanceof Error ? error.message : String(error),
    };
  }

  await appendEvidenceEvent({
    kind: 'evidence',
    tenantId: input.tenantId,
    universeId: input.universeId,
    summary: `SCM bridge local git_status=${localGit.state}; github=${github.state}; gitlab=${gitlab.state}`,
    payload: {
      github: github.state,
      gitlab: gitlab.state,
      localGit: localGit.state,
      remoteIssueApi: 'UNAVAILABLE',
    },
  }, input.root);

  const remoteFetch: ScmBridgeResult['remoteFetch'] =
    github.state === 'AVAILABLE' || gitlab.state === 'AVAILABLE' ? 'WAITING_DATA' : 'UNAVAILABLE';

  return {
    github,
    gitlab,
    localGit,
    remoteFetch: github.configured || gitlab.configured ? 'WAITING_DATA' : remoteFetch,
    inventedPass: false,
    productionAuthorization: false,
  };
}
