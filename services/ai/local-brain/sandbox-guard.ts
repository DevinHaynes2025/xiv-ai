export type SandboxGitAction = 'commit' | 'checkout' | 'push' | 'rebase' | 'merge';
export type SandboxWriteKind = 'file' | 'database';

const PROTECTED_REFS = new Set([
  'main',
  'master',
  'xiv-v2',
  'production',
  'prod',
  'HEAD',
  'refs/heads/main',
  'refs/heads/master',
  'refs/heads/xiv-v2',
  'origin/main',
  'origin/master',
  'origin/xiv-v2',
]);

const CREDENTIAL_BASENAMES = new Set([
  '.env',
  '.env.local',
  '.env.production',
  '.env.staging',
  '.npmrc',
  '.netrc',
  'id_rsa',
  'id_ed25519',
  'id_dsa',
  'credentials.json',
  'google-services.json',
  'serviceaccount.json',
]);

const CREDENTIAL_EXTENSIONS = new Set(['.pem', '.p12', '.pfx', '.key']);

function normalizeRef(ref: string) {
  return ref.trim().replace(/^refs\/heads\//, '');
}

export function isProtectedRef(ref: string) {
  const trimmed = ref.trim();
  if (!trimmed) return true;
  if (PROTECTED_REFS.has(trimmed) || PROTECTED_REFS.has(normalizeRef(trimmed))) return true;
  const base = normalizeRef(trimmed).split('/').pop() ?? trimmed;
  return base === 'main' || base === 'master';
}

export function isCredentialPath(filePath: string) {
  const normalized = filePath.replaceAll('\\', '/');
  const segments = normalized.split('/').filter(Boolean);
  const basename = (segments.at(-1) ?? '').toLowerCase();
  if (CREDENTIAL_BASENAMES.has(basename)) return true;
  if (basename.startsWith('.env.')) return true;
  const dot = basename.lastIndexOf('.');
  if (dot >= 0 && CREDENTIAL_EXTENSIONS.has(basename.slice(dot))) return true;
  return segments.some((segment) => segment === '.git' || segment === 'secrets' || segment === '.ssh');
}

export function evaluateSandboxGitAction(input: {
  currentBranch: string;
  action: SandboxGitAction;
  targetRef?: string;
  remote?: string;
}) {
  if (input.action === 'push' || input.remote) {
    return { allowed: false as const, reason: 'Remote git push is locked. PRODUCTION_GIT_PUSH=false.', productionAuthorization: false as const };
  }
  if (isProtectedRef(input.currentBranch)) {
    return { allowed: false as const, reason: `Protected current ref refused: ${input.currentBranch}`, productionAuthorization: false as const };
  }
  if (input.targetRef && isProtectedRef(input.targetRef)) {
    return { allowed: false as const, reason: `Protected target ref refused: ${input.targetRef}`, productionAuthorization: false as const };
  }
  return { allowed: true as const, reason: 'Sandbox git action is eligible on a non-protected local branch.', productionAuthorization: false as const };
}

export function evaluateSandboxWrite(input: {
  path?: string;
  kind: SandboxWriteKind;
  productionDatabase?: boolean;
}) {
  if (input.kind === 'database' && input.productionDatabase) {
    return { allowed: false as const, reason: 'Production database writes are locked. PRODUCTION_DATABASE_WRITE=false.', productionAuthorization: false as const };
  }
  if (input.kind === 'file') {
    if (!input.path?.trim()) {
      return { allowed: false as const, reason: 'Sandbox file writes require an explicit path.', productionAuthorization: false as const };
    }
    const normalized = input.path.replaceAll('\\', '/');
    if (normalized.startsWith('..') || normalized.includes('/../') || normalized.startsWith('/')) {
      return { allowed: false as const, reason: 'Sandbox file path must stay inside the local repository.', productionAuthorization: false as const };
    }
    if (isCredentialPath(normalized)) {
      return { allowed: false as const, reason: `Credential or protected path refused: ${normalized}`, productionAuthorization: false as const };
    }
  }
  return { allowed: true as const, reason: 'Sandbox write is eligible for local non-production state.', productionAuthorization: false as const };
}

export function evaluateSandboxOperation(input: {
  currentBranch: string;
  action: 'commit' | 'push' | 'checkout' | 'db_write' | 'write_file';
  targetRef?: string;
  remote?: string;
  filePath?: string;
  databaseTarget?: 'local' | 'production';
}) {
  if (input.action === 'push') {
    return evaluateSandboxGitAction({ currentBranch: input.currentBranch, action: 'push', targetRef: input.targetRef, remote: input.remote ?? 'origin' });
  }
  if (input.action === 'commit' || input.action === 'checkout') {
    return evaluateSandboxGitAction({ currentBranch: input.currentBranch, action: input.action, targetRef: input.targetRef });
  }
  if (input.action === 'db_write') {
    return evaluateSandboxWrite({ kind: 'database', productionDatabase: input.databaseTarget === 'production' });
  }
  return evaluateSandboxWrite({ kind: 'file', path: input.filePath });
}
