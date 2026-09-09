import { evaluateSandboxWrite } from './sandbox-guard';

export type PatchFileChange = {
  path: string;
  action: 'create' | 'modify' | 'delete';
  unifiedDiff: string;
};

export type StructuredPatchProposal = {
  id: string;
  storyId?: string;
  tenantId: string;
  universeId: string;
  summary: string;
  files: PatchFileChange[];
  testsExpected: string[];
  rollback: string;
  shellCommands: [];
  productionAuthorized: false;
  createdAt: string;
};

function looksLikeUnifiedDiff(diff: string, path: string) {
  const trimmed = diff.trim();
  if (!trimmed) return false;
  if (trimmed.includes('\0')) return false;
  if (trimmed.includes('/../') || trimmed.includes('\n../')) return false;
  return trimmed.includes(path) || trimmed.startsWith('--- ') || trimmed.startsWith('diff --git');
}

export function proposeStructuredPatch(input: {
  storyId?: string;
  tenantId: string;
  universeId: string;
  summary: string;
  files: PatchFileChange[];
  testsExpected?: string[];
  rollback?: string;
  requestedShell?: string[];
}) {
  if (!input.tenantId || !input.universeId || !input.summary.trim()) {
    return { accepted: false as const, reason: 'Patch proposals require tenant, Universe, and summary.' };
  }
  if (input.requestedShell && input.requestedShell.length > 0) {
    return { accepted: false as const, reason: 'CODING_AGENT_NO_SHELL: coding agents emit structured patches only.' };
  }
  if (!Array.isArray(input.files) || input.files.length === 0) {
    return { accepted: false as const, reason: 'Patch proposal must include at least one file change.' };
  }

  for (const file of input.files) {
    const write = evaluateSandboxWrite({ kind: 'file', path: file.path });
    if (!write.allowed) return { accepted: false as const, reason: write.reason };
    if (file.action !== 'delete' && !looksLikeUnifiedDiff(file.unifiedDiff, file.path)) {
      return { accepted: false as const, reason: `Diff integrity failed for ${file.path}` };
    }
  }

  const proposal: StructuredPatchProposal = {
    id: `patch_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    storyId: input.storyId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    summary: input.summary.trim(),
    files: input.files.map((file) => ({ ...file })),
    testsExpected: [...(input.testsExpected ?? [])],
    rollback: input.rollback ?? 'Discard the candidate patch; do not merge or deploy.',
    shellCommands: [],
    productionAuthorized: false,
    createdAt: new Date().toISOString(),
  };
  return { accepted: true as const, proposal, reason: 'Structured patch proposal recorded without shell execution.' };
}
