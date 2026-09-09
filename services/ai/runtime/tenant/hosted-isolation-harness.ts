/**
 * Phase 2H-C hosted two-user isolation proof.
 * Uses normal authenticated Supabase sessions only.
 * Never uses service_role or privileged database credentials.
 * UNIT/SEMANTIC helpers are not hosted RLS proof.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { requireFreshAuthorization } from '../security/freshness';
import {
  clientSelectorIsNotAuthority,
  profileCompanyDoesNotGrantTenantAccess,
  userRolesDoNotGrantTenantAccess,
} from './authorize';
import {
  evaluateTenantActivation,
  resetTenantActivationProofs,
} from './activation-gate';
import { applyHostedIsolationRun } from './hosted-activation';
import { recordHostedApplyEvidence, recordHostedIsolationEvidence } from './hosted-proof';
import { privilegedApplyCredentialNamesPresent } from './hosted-apply-gate';

export type IsolationVerdict = 'PASS' | 'FAIL';

export type IsolationAssertion = {
  testName: string;
  actorUserId: string | null;
  organizationId: string | null;
  universeId: string | null;
  operation: string;
  expected: string;
  actual: string;
  result: IsolationVerdict;
  timestamp: string;
};

export type HostedIsolationRun = {
  isolation: IsolationVerdict;
  tenantPersistence: 'live' | 'blocked';
  businessModulesTenantReady: boolean;
  reason: string;
  identities: {
    userAId: string | null;
    userBId: string | null;
    orgAId: string | null;
    orgBId: string | null;
    universeAId: string | null;
    universeBId: string | null;
  };
  roleVersion: {
    before: number | null;
    after: number | null;
    incremented: boolean;
    staleContextDenied: boolean;
  };
  assertions: IsolationAssertion[];
  privilegedCredentialsUnused: true;
  serviceRoleUnused: true;
  migrationFileUnchanged: true;
  rlsUnchanged: true;
};

const USER_A_EMAIL_KEYS = ['XIV_USER_A_EMAIL', 'XIV_HOSTED_USER_A_EMAIL', 'XIV_TEST_USER_A_EMAIL'] as const;
const USER_A_PASSWORD_KEYS = ['XIV_USER_A_PASSWORD', 'XIV_HOSTED_USER_A_PASSWORD', 'XIV_TEST_USER_A_PASSWORD'] as const;
const USER_B_EMAIL_KEYS = ['XIV_USER_B_EMAIL', 'XIV_HOSTED_USER_B_EMAIL', 'XIV_TEST_USER_B_EMAIL'] as const;
const USER_B_PASSWORD_KEYS = ['XIV_USER_B_PASSWORD', 'XIV_HOSTED_USER_B_PASSWORD', 'XIV_TEST_USER_B_PASSWORD'] as const;

const URL_KEYS = ['SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_URL'] as const;
const ANON_KEYS = [
  'SUPABASE_ANON_KEY',
  'SUPABASE_PUBLISHABLE_KEY',
  'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
] as const;

const FORBIDDEN_KEY_SOURCES = ['SUPABASE_SERVICE_ROLE_KEY'] as const;

type Actor = {
  label: 'A' | 'B';
  client: SupabaseClient;
  userId: string;
};

function nowIso() {
  return new Date().toISOString();
}

function firstEnv(keys: readonly string[]): string | null {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function envPresent(keys: readonly string[]): string[] {
  return keys.filter((key) => Boolean(process.env[key] && String(process.env[key]).trim()));
}

export function redactSecrets(value: string) {
  return value
    .replace(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, '[redacted-jwt]')
    .replace(/sb_secret_[A-Za-z0-9_-]+/g, '[redacted-secret]')
    .replace(/sb_publishable_[A-Za-z0-9_-]+/g, '[redacted-publishable]')
    .replace(/Bearer\s+\S+/gi, 'Bearer [redacted]')
    .replace(/password[=:]\s*\S+/gi, 'password=[redacted]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]');
}

export function decodeJwtRole(token: string): string | null {
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const json = Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    const payload = JSON.parse(json) as { role?: unknown };
    return typeof payload.role === 'string' ? payload.role : null;
  } catch {
    return null;
  }
}

export function assertPublishableClientKey(key: string) {
  if (!key.trim()) {
    return { ok: false as const, reason: 'Publishable/anon key is missing.' };
  }
  if (/service_role/i.test(key) || /supabase_admin/i.test(key)) {
    return { ok: false as const, reason: 'Client key must not be service_role or supabase_admin.' };
  }
  const role = decodeJwtRole(key);
  if (role === 'service_role' || role === 'supabase_admin') {
    return { ok: false as const, reason: 'Client key JWT role is privileged. Refusing to run.' };
  }
  return { ok: true as const, reason: 'Client key is a publishable/anon key.' };
}

export function hostedIsolationCredentialStatus() {
  return {
    supabaseUrl: Boolean(firstEnv(URL_KEYS)),
    publishableKey: Boolean(firstEnv(ANON_KEYS)),
    userAEmail: envPresent(USER_A_EMAIL_KEYS).length > 0,
    userAPassword: envPresent(USER_A_PASSWORD_KEYS).length > 0,
    userBEmail: envPresent(USER_B_EMAIL_KEYS).length > 0,
    userBPassword: envPresent(USER_B_PASSWORD_KEYS).length > 0,
    serviceRoleKeyPresent: envPresent(FORBIDDEN_KEY_SOURCES).length > 0,
    privilegedDbNames: privilegedApplyCredentialNamesPresent(),
  };
}

function errorText(error: { message?: string; code?: string; details?: string; hint?: string } | null | undefined) {
  if (!error) return 'none';
  return redactSecrets([error.code, error.message, error.details, error.hint].filter(Boolean).join(' | '));
}

function mutationDenied(error: { message?: string; code?: string } | null | undefined, count?: number | null) {
  const text = `${error?.code ?? ''} ${error?.message ?? ''}`;
  if (/42501|PGRST301|PGRST116|42501|permission denied|not authorized|row-level security|violates/i.test(text)) {
    return true;
  }
  if (error) return true;
  return count === 0;
}

function emptyRead(data: unknown): boolean {
  if (data == null) return true;
  return Array.isArray(data) && data.length === 0;
}

function unauthorizedReadPassed(
  data: unknown,
  error: { message?: string; code?: string } | null | undefined,
) {
  if (!emptyRead(data)) return false;
  if (!error) return true;
  return !/PGRST205|schema cache|does not exist|Could not find/i.test(errorText(error));
}

function asRow<T>(data: T | T[] | null | undefined): T | null {
  if (data == null) return null;
  return Array.isArray(data) ? (data[0] ?? null) : data;
}

function uniqueSlug(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}`.slice(0, 63);
}

export async function runHostedIsolationProof(): Promise<HostedIsolationRun> {
  const assertions: IsolationAssertion[] = [];
  const identities = {
    userAId: null as string | null,
    userBId: null as string | null,
    orgAId: null as string | null,
    orgBId: null as string | null,
    universeAId: null as string | null,
    universeBId: null as string | null,
  };
  const roleVersion = {
    before: null as number | null,
    after: null as number | null,
    incremented: false,
    staleContextDenied: false,
  };

  const failClosed = (reason: string, extras: IsolationAssertion[] = []): HostedIsolationRun => {
    resetTenantActivationProofs();
    recordHostedIsolationEvidence({
      bootstrapPassed: false,
      isolationPassed: false,
      escalationPassed: false,
      freshnessPassed: false,
      twoUsers: false,
      reason,
    });
    const evaluated = evaluateTenantActivation();
    return {
      isolation: 'FAIL',
      tenantPersistence: evaluated.tenantPersistence,
      businessModulesTenantReady: evaluated.businessModulesTenantReady,
      reason,
      identities,
      roleVersion,
      assertions: [...assertions, ...extras],
      privilegedCredentialsUnused: true,
      serviceRoleUnused: true,
      migrationFileUnchanged: true,
      rlsUnchanged: true,
    };
  };

  const record = (
    input: Omit<IsolationAssertion, 'timestamp' | 'result'> & { result?: IsolationVerdict; pass: boolean },
  ) => {
    assertions.push({
      testName: input.testName,
      actorUserId: input.actorUserId,
      organizationId: input.organizationId,
      universeId: input.universeId,
      operation: input.operation,
      expected: input.expected,
      actual: redactSecrets(input.actual),
      result: input.pass ? 'PASS' : 'FAIL',
      timestamp: nowIso(),
    });
  };

  if (envPresent(FORBIDDEN_KEY_SOURCES).length > 0) {
    return failClosed('Refusing to run: SUPABASE_SERVICE_ROLE_KEY is present. This harness must not use it.');
  }

  const url = firstEnv(URL_KEYS);
  const anonKey = firstEnv(ANON_KEYS);
  const userAEmail = firstEnv(USER_A_EMAIL_KEYS);
  const userAPassword = firstEnv(USER_A_PASSWORD_KEYS);
  const userBEmail = firstEnv(USER_B_EMAIL_KEYS);
  const userBPassword = firstEnv(USER_B_PASSWORD_KEYS);

  if (!url || !anonKey) {
    return failClosed('Publishable/anon Supabase URL or key is missing from local environment variables.');
  }
  const keyCheck = assertPublishableClientKey(anonKey);
  if (!keyCheck.ok) return failClosed(keyCheck.reason);

  const missingUserCreds = [
    !userAEmail ? 'XIV_USER_A_EMAIL' : null,
    !userAPassword ? 'XIV_USER_A_PASSWORD' : null,
    !userBEmail ? 'XIV_USER_B_EMAIL' : null,
    !userBPassword ? 'XIV_USER_B_PASSWORD' : null,
  ].filter(Boolean);
  if (missingUserCreds.length) {
    record({
      testName: 'credentials.present',
      actorUserId: null,
      organizationId: null,
      universeId: null,
      operation: 'read local env names only',
      expected: 'User A and User B email/password env vars present',
      actual: `missing ${missingUserCreds.join(', ')}`,
      pass: false,
    });
    return failClosed(
      `User A/B credentials are missing. Set ${missingUserCreds.join(', ')} in temporary local environment variables. Do not commit them.`,
    );
  }

  const createUserClient = () =>
    createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

  const signIn = async (label: 'A' | 'B', email: string, password: string): Promise<Actor | { error: string }> => {
    const client = createUserClient();
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error || !data.user?.id || !data.session?.access_token) {
      return { error: redactSecrets(error?.message ?? 'sign-in returned no user') };
    }
    const role = decodeJwtRole(data.session.access_token);
    if (role === 'service_role' || role === 'supabase_admin') {
      await client.auth.signOut();
      return { error: `User ${label} session role is privileged. Refusing.` };
    }
    if (role && role !== 'authenticated') {
      await client.auth.signOut();
      return { error: `User ${label} session role is ${role}, expected authenticated.` };
    }
    return { label, client, userId: data.user.id };
  };

  const signedA = await signIn('A', userAEmail!, userAPassword!);
  const signedB = await signIn('B', userBEmail!, userBPassword!);
  if ('error' in signedA) {
    record({
      testName: 'auth.userA',
      actorUserId: null,
      organizationId: null,
      universeId: null,
      operation: 'signInWithPassword User A',
      expected: 'authenticated session with distinct auth.uid',
      actual: signedA.error,
      pass: false,
    });
    return failClosed(`User A authentication failed: ${signedA.error}`);
  }
  if ('error' in signedB) {
    record({
      testName: 'auth.userB',
      actorUserId: null,
      organizationId: null,
      universeId: null,
      operation: 'signInWithPassword User B',
      expected: 'authenticated session with distinct auth.uid',
      actual: signedB.error,
      pass: false,
    });
    return failClosed(`User B authentication failed: ${signedB.error}`);
  }

  const userA = signedA;
  const userB = signedB;
  identities.userAId = userA.userId;
  identities.userBId = userB.userId;

  record({
    testName: 'auth.distinctUids',
    actorUserId: userA.userId,
    organizationId: null,
    universeId: null,
    operation: 'compare auth.uid',
    expected: 'User A and User B have different auth.uid values',
    actual: userA.userId === userB.userId ? 'uids were identical' : 'uids differ',
    pass: userA.userId !== userB.userId,
  });
  record({
    testName: 'auth.normalSessions',
    actorUserId: userA.userId,
    organizationId: null,
    universeId: null,
    operation: 'verify authenticated JWT role and no service_role client',
    expected: 'both sessions authenticated; neither service_role',
    actual: 'both sessions authenticated; publishable client only',
    pass: true,
  });

  if (userA.userId === userB.userId) {
    return failClosed('User A and User B authenticated to the same auth.uid.');
  }

  const bootstrap = async (
    actor: Actor,
    orgName: string,
    uniName: string,
    slugPrefix: string,
  ): Promise<{ orgId: string; universeId: string } | { error: string; orgId?: string }> => {
    const orgSlug = uniqueSlug(`${slugPrefix}-org`);
    const uniSlug = uniqueSlug(`${slugPrefix}-uni`);
    const orgRes = await actor.client.rpc('xiv_create_organization', {
      p_name: orgName,
      p_slug: orgSlug,
      p_industry: 'isolation-proof',
      p_region_preference: 'test',
    });
    const org = asRow(orgRes.data as { id?: string } | { id?: string }[] | null);
    if (orgRes.error || !org?.id) {
      return { error: errorText(orgRes.error) || 'organization rpc returned no id' };
    }
    const uniRes = await actor.client.rpc('xiv_create_universe', {
      p_organization_id: org.id,
      p_name: uniName,
      p_slug: uniSlug,
      p_classification: 'internal',
      p_storage_tier: 'business',
      p_region_preference: 'test',
    });
    const uni = asRow(uniRes.data as { id?: string } | { id?: string }[] | null);
    if (uniRes.error || !uni?.id) {
      return { error: errorText(uniRes.error) || 'universe rpc returned no id', orgId: org.id };
    }
    return { orgId: org.id, universeId: uni.id };
  };

  const bootA = await bootstrap(userA, 'XIV Isolation Org A', 'XIV Isolation Universe A', 'xiv-iso-a');
  const bootB = await bootstrap(userB, 'XIV Isolation Org B', 'XIV Isolation Universe B', 'xiv-iso-b');

  if ('error' in bootA) {
    record({
      testName: 'bootstrap.userA',
      actorUserId: userA.userId,
      organizationId: 'orgId' in bootA ? (bootA.orgId ?? null) : null,
      universeId: null,
      operation: 'xiv_create_organization + xiv_create_universe as User A',
      expected: 'Org A and Universe A ids returned',
      actual: bootA.error ?? 'unknown bootstrap error',
      pass: false,
    });
    return failClosed(`User A bootstrap failed: ${bootA.error ?? 'unknown bootstrap error'}`);
  }
  if ('error' in bootB) {
    record({
      testName: 'bootstrap.userB',
      actorUserId: userB.userId,
      organizationId: 'orgId' in bootB ? (bootB.orgId ?? null) : null,
      universeId: null,
      operation: 'xiv_create_organization + xiv_create_universe as User B',
      expected: 'Org B and Universe B ids returned',
      actual: bootB.error ?? 'unknown bootstrap error',
      pass: false,
    });
    return failClosed(`User B bootstrap failed: ${bootB.error ?? 'unknown bootstrap error'}`);
  }

  identities.orgAId = bootA.orgId;
  identities.universeAId = bootA.universeId;
  identities.orgBId = bootB.orgId;
  identities.universeBId = bootB.universeId;

  record({
    testName: 'bootstrap.userA',
    actorUserId: userA.userId,
    organizationId: bootA.orgId,
    universeId: bootA.universeId,
    operation: 'xiv_create_organization + xiv_create_universe as User A',
    expected: 'Org A and Universe A created by authenticated User A',
    actual: 'created',
    pass: true,
  });
  record({
    testName: 'bootstrap.userB',
    actorUserId: userB.userId,
    organizationId: bootB.orgId,
    universeId: bootB.universeId,
    operation: 'xiv_create_organization + xiv_create_universe as User B',
    expected: 'Org B and Universe B created by authenticated User B',
    actual: 'created',
    pass: true,
  });

  const readOrg = async (actor: Actor, orgId: string) =>
    actor.client.from('xiv_organizations').select('id,name').eq('id', orgId);
  const readUni = async (actor: Actor, universeId: string) =>
    actor.client.from('xiv_universes').select('id,name,organization_id').eq('id', universeId);
  const readOrgMemberships = async (actor: Actor, orgId: string) =>
    actor.client
      .from('xiv_organization_memberships')
      .select('id,organization_id,user_id,role,status,role_version')
      .eq('organization_id', orgId);
  const readUniMemberships = async (actor: Actor, universeId: string) =>
    actor.client
      .from('xiv_universe_memberships')
      .select('id,universe_id,user_id,role,status,role_version')
      .eq('universe_id', universeId);

  const positive = async (actor: Actor, orgId: string, universeId: string, label: string) => {
    const org = await readOrg(actor, orgId);
    const uni = await readUni(actor, universeId);
    const om = await readOrgMemberships(actor, orgId);
    const um = await readUniMemberships(actor, universeId);
    const orgOk = (org.data ?? []).some((row) => row.id === orgId);
    const uniOk = (uni.data ?? []).some((row) => row.id === universeId);
    const omOk = (om.data ?? []).some((row) => row.user_id === actor.userId && row.organization_id === orgId);
    const umOk = (um.data ?? []).some((row) => row.user_id === actor.userId && row.universe_id === universeId);
    record({
      testName: `positive.org.${label}`,
      actorUserId: actor.userId,
      organizationId: orgId,
      universeId: null,
      operation: `select xiv_organizations id=${orgId}`,
      expected: 'one authorized organization row',
      actual: orgOk ? 'row returned' : errorText(org.error) || 'zero rows',
      pass: orgOk,
    });
    record({
      testName: `positive.universe.${label}`,
      actorUserId: actor.userId,
      organizationId: orgId,
      universeId,
      operation: `select xiv_universes id=${universeId}`,
      expected: 'one authorized Universe row',
      actual: uniOk ? 'row returned' : errorText(uni.error) || 'zero rows',
      pass: uniOk,
    });
    record({
      testName: `positive.orgMembership.${label}`,
      actorUserId: actor.userId,
      organizationId: orgId,
      universeId: null,
      operation: 'select authorized organization memberships',
      expected: 'actor sees own membership',
      actual: omOk ? 'membership returned' : errorText(om.error) || 'zero authorized rows',
      pass: omOk,
    });
    record({
      testName: `positive.universeMembership.${label}`,
      actorUserId: actor.userId,
      organizationId: orgId,
      universeId,
      operation: 'select authorized Universe memberships',
      expected: 'actor sees own Universe membership',
      actual: umOk ? 'membership returned' : errorText(um.error) || 'zero authorized rows',
      pass: umOk,
    });
    return { orgMemberships: om.data ?? [], universeMemberships: um.data ?? [] };
  };

  const posA = await positive(userA, bootA.orgId, bootA.universeId, 'A');
  const posB = await positive(userB, bootB.orgId, bootB.universeId, 'B');

  const crossRead = async (
    actor: Actor,
    foreignOrgId: string,
    foreignUniverseId: string,
    label: string,
  ) => {
    const org = await readOrg(actor, foreignOrgId);
    const uni = await readUni(actor, foreignUniverseId);
    const om = await readOrgMemberships(actor, foreignOrgId);
    const um = await readUniMemberships(actor, foreignUniverseId);
    record({
      testName: `cross.org.${label}`,
      actorUserId: actor.userId,
      organizationId: foreignOrgId,
      universeId: null,
      operation: `select foreign xiv_organizations id=${foreignOrgId}`,
      expected: 'zero unauthorized rows',
      actual: unauthorizedReadPassed(org.data, org.error)
        ? emptyRead(org.data)
          ? 'zero rows'
          : errorText(org.error)
        : `leaked or failed (${errorText(org.error) || `${(org.data ?? []).length} rows`})`,
      pass: unauthorizedReadPassed(org.data, org.error),
    });
    record({
      testName: `cross.universe.${label}`,
      actorUserId: actor.userId,
      organizationId: foreignOrgId,
      universeId: foreignUniverseId,
      operation: `select foreign xiv_universes id=${foreignUniverseId}`,
      expected: 'zero unauthorized rows',
      actual: unauthorizedReadPassed(uni.data, uni.error)
        ? 'zero rows'
        : `leaked or failed (${errorText(uni.error) || `${(uni.data ?? []).length} rows`})`,
      pass: unauthorizedReadPassed(uni.data, uni.error),
    });
    record({
      testName: `cross.orgMemberships.${label}`,
      actorUserId: actor.userId,
      organizationId: foreignOrgId,
      universeId: null,
      operation: 'select unauthorized foreign organization memberships',
      expected: 'zero unauthorized rows',
      actual: unauthorizedReadPassed(om.data, om.error)
        ? 'zero rows'
        : `leaked or failed (${errorText(om.error) || `${(om.data ?? []).length} rows`})`,
      pass: unauthorizedReadPassed(om.data, om.error),
    });
    record({
      testName: `cross.universeMemberships.${label}`,
      actorUserId: actor.userId,
      organizationId: foreignOrgId,
      universeId: foreignUniverseId,
      operation: 'select unauthorized foreign Universe memberships',
      expected: 'zero unauthorized rows',
      actual: unauthorizedReadPassed(um.data, um.error)
        ? 'zero rows'
        : `leaked or failed (${errorText(um.error) || `${(um.data ?? []).length} rows`})`,
      pass: unauthorizedReadPassed(um.data, um.error),
    });
  };

  await crossRead(userA, bootB.orgId, bootB.universeId, 'A-reads-B');
  await crossRead(userB, bootA.orgId, bootA.universeId, 'B-reads-A');

  const ownOrgMembershipA = posA.orgMemberships.find((row) => row.user_id === userA.userId);
  const ownOrgMembershipB = posB.orgMemberships.find((row) => row.user_id === userB.userId);
  const ownUniMembershipA = posA.universeMemberships.find((row) => row.user_id === userA.userId);
  const ownUniMembershipB = posB.universeMemberships.find((row) => row.user_id === userB.userId);

  const persistUnchanged = async (
    actor: Actor,
    table: 'xiv_organization_memberships' | 'xiv_universe_memberships' | 'xiv_universes',
    id: string,
    snapshot: Record<string, unknown>,
  ) => {
    const { data } = await actor.client.from(table).select('*').eq('id', id);
    const row = asRow(data as Record<string, unknown>[] | null);
    if (!row) return false;
    return Object.entries(snapshot).every(([key, value]) => row[key] === value);
  };

  const attack = async (input: {
    testName: string;
    actor: Actor;
    organizationId: string | null;
    universeId: string | null;
    operation: string;
    expected: string;
    run: () => Promise<{ error: { message?: string; code?: string } | null; count?: number | null; data?: unknown }>;
    verify?: () => Promise<boolean>;
  }) => {
    const outcome = await input.run();
    const denied = mutationDenied(outcome.error, outcome.count);
    const unchanged = input.verify ? await input.verify() : true;
    record({
      testName: input.testName,
      actorUserId: input.actor.userId,
      organizationId: input.organizationId,
      universeId: input.universeId,
      operation: input.operation,
      expected: input.expected,
      actual: denied && unchanged ? `denied; persisted unchanged (${errorText(outcome.error)})` : `MUTATION RISK ${errorText(outcome.error)} count=${outcome.count ?? 'n/a'}`,
      pass: denied && unchanged,
    });
  };

  await attack({
    testName: 'write.selfPromote.A',
    actor: userA,
    organizationId: bootA.orgId,
    universeId: null,
    operation: 'User A updates own org membership role',
    expected: 'denied; membership unchanged',
    run: async () => {
      const res = await userA.client
        .from('xiv_organization_memberships')
        .update({ role: 'owner' })
        .eq('id', ownOrgMembershipA?.id ?? '00000000-0000-4000-8000-000000000001')
        .select();
      return { error: res.error, count: res.data?.length ?? 0, data: res.data };
    },
    verify: async () =>
      persistUnchanged(userA, 'xiv_organization_memberships', ownOrgMembershipA!.id, {
        role: ownOrgMembershipA!.role,
        user_id: userA.userId,
        organization_id: bootA.orgId,
      }),
  });

  await attack({
    testName: 'write.selfPromote.B',
    actor: userB,
    organizationId: bootB.orgId,
    universeId: null,
    operation: 'User B updates own org membership role',
    expected: 'denied; membership unchanged',
    run: async () => {
      const res = await userB.client
        .from('xiv_organization_memberships')
        .update({ role: 'owner' })
        .eq('id', ownOrgMembershipB?.id ?? '00000000-0000-4000-8000-000000000002')
        .select();
      return { error: res.error, count: res.data?.length ?? 0, data: res.data };
    },
    verify: async () =>
      persistUnchanged(userB, 'xiv_organization_memberships', ownOrgMembershipB!.id, {
        role: ownOrgMembershipB!.role,
        user_id: userB.userId,
        organization_id: bootB.orgId,
      }),
  });

  await attack({
    testName: 'write.joinForeignOrg.A-into-B',
    actor: userA,
    organizationId: bootB.orgId,
    universeId: null,
    operation: 'User A inserts self into Org B',
    expected: 'denied; no membership row for A in Org B',
    run: async () => {
      const res = await userA.client.from('xiv_organization_memberships').insert({
        organization_id: bootB.orgId,
        user_id: userA.userId,
        role: 'member',
        status: 'active',
      }).select();
      return { error: res.error, count: res.data?.length ?? 0, data: res.data };
    },
    verify: async () => {
      const { data } = await userB.client
        .from('xiv_organization_memberships')
        .select('id')
        .eq('organization_id', bootB.orgId)
        .eq('user_id', userA.userId);
      return emptyRead(data);
    },
  });

  await attack({
    testName: 'write.joinForeignOrg.B-into-A',
    actor: userB,
    organizationId: bootA.orgId,
    universeId: null,
    operation: 'User B inserts self into Org A',
    expected: 'denied; no membership row for B in Org A',
    run: async () => {
      const res = await userB.client.from('xiv_organization_memberships').insert({
        organization_id: bootA.orgId,
        user_id: userB.userId,
        role: 'member',
        status: 'active',
      }).select();
      return { error: res.error, count: res.data?.length ?? 0, data: res.data };
    },
    verify: async () => {
      const { data } = await userA.client
        .from('xiv_organization_memberships')
        .select('id')
        .eq('organization_id', bootA.orgId)
        .eq('user_id', userB.userId);
      return emptyRead(data);
    },
  });

  await attack({
    testName: 'write.joinForeignUniverse.A-into-B',
    actor: userA,
    organizationId: bootB.orgId,
    universeId: bootB.universeId,
    operation: 'User A inserts self into Universe B',
    expected: 'denied; no Universe B membership for A',
    run: async () => {
      const res = await userA.client.from('xiv_universe_memberships').insert({
        universe_id: bootB.universeId,
        user_id: userA.userId,
        role: 'member',
        status: 'active',
      }).select();
      return { error: res.error, count: res.data?.length ?? 0, data: res.data };
    },
    verify: async () => {
      const { data } = await userB.client
        .from('xiv_universe_memberships')
        .select('id')
        .eq('universe_id', bootB.universeId)
        .eq('user_id', userA.userId);
      return emptyRead(data);
    },
  });

  await attack({
    testName: 'write.joinForeignUniverse.B-into-A',
    actor: userB,
    organizationId: bootA.orgId,
    universeId: bootA.universeId,
    operation: 'User B inserts self into Universe A',
    expected: 'denied; no Universe A membership for B',
    run: async () => {
      const res = await userB.client.from('xiv_universe_memberships').insert({
        universe_id: bootA.universeId,
        user_id: userB.userId,
        role: 'member',
        status: 'active',
      }).select();
      return { error: res.error, count: res.data?.length ?? 0, data: res.data };
    },
    verify: async () => {
      const { data } = await userA.client
        .from('xiv_universe_memberships')
        .select('id')
        .eq('universe_id', bootA.universeId)
        .eq('user_id', userB.userId);
      return emptyRead(data);
    },
  });

  await attack({
    testName: 'write.retarget.organization_id',
    actor: userA,
    organizationId: bootA.orgId,
    universeId: null,
    operation: 'User A sets own membership organization_id to Org B',
    expected: 'denied; organization_id unchanged',
    run: async () => {
      const res = await userA.client
        .from('xiv_organization_memberships')
        .update({ organization_id: bootB.orgId })
        .eq('id', ownOrgMembershipA!.id)
        .select();
      return { error: res.error, count: res.data?.length ?? 0 };
    },
    verify: async () =>
      persistUnchanged(userA, 'xiv_organization_memberships', ownOrgMembershipA!.id, {
        organization_id: bootA.orgId,
      }),
  });

  await attack({
    testName: 'write.retarget.universe_id',
    actor: userA,
    organizationId: bootA.orgId,
    universeId: bootA.universeId,
    operation: 'User A sets own Universe membership universe_id to Universe B',
    expected: 'denied; universe_id unchanged',
    run: async () => {
      const res = await userA.client
        .from('xiv_universe_memberships')
        .update({ universe_id: bootB.universeId })
        .eq('id', ownUniMembershipA!.id)
        .select();
      return { error: res.error, count: res.data?.length ?? 0 };
    },
    verify: async () =>
      persistUnchanged(userA, 'xiv_universe_memberships', ownUniMembershipA!.id, {
        universe_id: bootA.universeId,
      }),
  });

  await attack({
    testName: 'write.retarget.user_id',
    actor: userA,
    organizationId: bootA.orgId,
    universeId: null,
    operation: 'User A sets own membership user_id to User B',
    expected: 'denied; user_id unchanged',
    run: async () => {
      const res = await userA.client
        .from('xiv_organization_memberships')
        .update({ user_id: userB.userId })
        .eq('id', ownOrgMembershipA!.id)
        .select();
      return { error: res.error, count: res.data?.length ?? 0 };
    },
    verify: async () =>
      persistUnchanged(userA, 'xiv_organization_memberships', ownOrgMembershipA!.id, {
        user_id: userA.userId,
      }),
  });

  await attack({
    testName: 'write.moveUniverse.A-to-OrgB',
    actor: userA,
    organizationId: bootB.orgId,
    universeId: bootA.universeId,
    operation: 'User A updates Universe A organization_id to Org B',
    expected: 'denied; Universe A remains in Org A',
    run: async () => {
      const res = await userA.client
        .from('xiv_universes')
        .update({ organization_id: bootB.orgId })
        .eq('id', bootA.universeId)
        .select();
      return { error: res.error, count: res.data?.length ?? 0 };
    },
    verify: async () =>
      persistUnchanged(userA, 'xiv_universes', bootA.universeId, { organization_id: bootA.orgId }),
  });

  await attack({
    testName: 'write.moveUniverse.B-to-OrgA',
    actor: userB,
    organizationId: bootA.orgId,
    universeId: bootB.universeId,
    operation: 'User B updates Universe B organization_id to Org A',
    expected: 'denied; Universe B remains in Org B',
    run: async () => {
      const res = await userB.client
        .from('xiv_universes')
        .update({ organization_id: bootA.orgId })
        .eq('id', bootB.universeId)
        .select();
      return { error: res.error, count: res.data?.length ?? 0 };
    },
    verify: async () =>
      persistUnchanged(userB, 'xiv_universes', bootB.universeId, { organization_id: bootB.orgId }),
  });

  // Authenticated owner fixture — not service_role, not counted as RLS proof.
  const adminFixture = await userA.client
    .from('xiv_organization_memberships')
    .insert({
      organization_id: bootA.orgId,
      user_id: userB.userId,
      role: 'admin',
      status: 'active',
    })
    .select('id,role,status,role_version,user_id,organization_id')
    .maybeSingle();

  record({
    testName: 'fixture.ownerA.grantsAdminB',
    actorUserId: userA.userId,
    organizationId: bootA.orgId,
    universeId: null,
    operation: 'Owner A inserts User B as admin on Org A (authenticated fixture)',
    expected: 'fixture row created so admin attacks can run as User B',
    actual: adminFixture.error ? errorText(adminFixture.error) : 'admin membership created',
    pass: Boolean(adminFixture.data?.id) && !adminFixture.error,
  });

  const adminMembershipId = adminFixture.data?.id ?? null;
  roleVersion.before = adminFixture.data?.role_version ?? null;

  const fakeUserId = '00000000-0000-4000-8000-000000000099';

  await attack({
    testName: 'authority.adminCannotCreateOwner',
    actor: userB,
    organizationId: bootA.orgId,
    universeId: null,
    operation: 'Admin B inserts owner membership for a third user id',
    expected: 'denied',
    run: async () => {
      const res = await userB.client.from('xiv_organization_memberships').insert({
        organization_id: bootA.orgId,
        user_id: fakeUserId,
        role: 'owner',
        status: 'active',
      }).select();
      return { error: res.error, count: res.data?.length ?? 0 };
    },
    verify: async () => {
      const { data } = await userA.client
        .from('xiv_organization_memberships')
        .select('id')
        .eq('organization_id', bootA.orgId)
        .eq('user_id', fakeUserId);
      return emptyRead(data);
    },
  });

  await attack({
    testName: 'authority.adminCannotDemoteOwner',
    actor: userB,
    organizationId: bootA.orgId,
    universeId: null,
    operation: 'Admin B updates Owner A role to admin',
    expected: 'denied; Owner A remains owner',
    run: async () => {
      const res = await userB.client
        .from('xiv_organization_memberships')
        .update({ role: 'admin' })
        .eq('id', ownOrgMembershipA!.id)
        .select();
      return { error: res.error, count: res.data?.length ?? 0 };
    },
    verify: async () =>
      persistUnchanged(userA, 'xiv_organization_memberships', ownOrgMembershipA!.id, { role: 'owner', status: 'active' }),
  });

  await attack({
    testName: 'authority.adminCannotSuspendOwner',
    actor: userB,
    organizationId: bootA.orgId,
    universeId: null,
    operation: 'Admin B sets Owner A status=suspended',
    expected: 'denied; Owner A remains active',
    run: async () => {
      const res = await userB.client
        .from('xiv_organization_memberships')
        .update({ status: 'suspended' })
        .eq('id', ownOrgMembershipA!.id)
        .select();
      return { error: res.error, count: res.data?.length ?? 0 };
    },
    verify: async () =>
      persistUnchanged(userA, 'xiv_organization_memberships', ownOrgMembershipA!.id, { status: 'active', role: 'owner' }),
  });

  await attack({
    testName: 'authority.adminCannotRevokeOwner',
    actor: userB,
    organizationId: bootA.orgId,
    universeId: null,
    operation: 'Admin B sets Owner A status=revoked',
    expected: 'denied; Owner A remains active',
    run: async () => {
      const res = await userB.client
        .from('xiv_organization_memberships')
        .update({ status: 'revoked' })
        .eq('id', ownOrgMembershipA!.id)
        .select();
      return { error: res.error, count: res.data?.length ?? 0 };
    },
    verify: async () =>
      persistUnchanged(userA, 'xiv_organization_memberships', ownOrgMembershipA!.id, { status: 'active', role: 'owner' }),
  });

  await attack({
    testName: 'authority.adminCannotDeleteOwner',
    actor: userB,
    organizationId: bootA.orgId,
    universeId: null,
    operation: 'Admin B deletes Owner A membership',
    expected: 'denied; Owner A membership remains',
    run: async () => {
      const res = await userB.client
        .from('xiv_organization_memberships')
        .delete()
        .eq('id', ownOrgMembershipA!.id)
        .select();
      return { error: res.error, count: res.data?.length ?? 0 };
    },
    verify: async () =>
      persistUnchanged(userA, 'xiv_organization_memberships', ownOrgMembershipA!.id, { role: 'owner', status: 'active' }),
  });

  if (adminMembershipId) {
    const demoteToExecutive = await userA.client
      .from('xiv_organization_memberships')
      .update({ role: 'executive' })
      .eq('id', adminMembershipId)
      .select('id,role,role_version')
      .maybeSingle();
    roleVersion.after = demoteToExecutive.data?.role_version ?? null;
    roleVersion.incremented =
      roleVersion.before != null && roleVersion.after != null && roleVersion.after === roleVersion.before + 1;
    record({
      testName: 'fixture.ownerA.demoteBToExecutive',
      actorUserId: userA.userId,
      organizationId: bootA.orgId,
      universeId: null,
      operation: 'Owner A updates User B Org A role admin -> executive (authenticated fixture)',
      expected: 'role becomes executive and role_version increments',
      actual: demoteToExecutive.error
        ? errorText(demoteToExecutive.error)
        : `role=${demoteToExecutive.data?.role} role_version ${roleVersion.before} -> ${roleVersion.after}`,
      pass: demoteToExecutive.data?.role === 'executive' && roleVersion.incremented,
    });
  } else {
    record({
      testName: 'fixture.ownerA.demoteBToExecutive',
      actorUserId: userA.userId,
      organizationId: bootA.orgId,
      universeId: null,
      operation: 'Owner A updates User B Org A role admin -> executive',
      expected: 'fixture available',
      actual: 'skipped; admin fixture missing',
      pass: false,
    });
  }

  const execUniverse = await userB.client.rpc('xiv_create_universe', {
    p_organization_id: bootA.orgId,
    p_name: 'XIV Isolation Universe Executive Denied',
    p_slug: uniqueSlug('xiv-iso-exec'),
    p_classification: 'internal',
    p_storage_tier: 'business',
    p_region_preference: 'test',
  });
  record({
    testName: 'authority.executiveCannotCreateUniverse',
    actorUserId: userB.userId,
    organizationId: bootA.orgId,
    universeId: null,
    operation: 'Executive B calls xiv_create_universe on Org A',
    expected: 'denied',
    actual: execUniverse.error ? errorText(execUniverse.error) : 'universe created',
    pass: Boolean(execUniverse.error) && !asRow(execUniverse.data as { id?: string } | { id?: string }[] | null)?.id,
  });

  await attack({
    testName: 'authority.finalOrgOwnerCannotBeRemoved.self',
    actor: userA,
    organizationId: bootA.orgId,
    universeId: null,
    operation: 'Sole Owner A deletes own organization membership',
    expected: 'denied; owner membership remains',
    run: async () => {
      const res = await userA.client
        .from('xiv_organization_memberships')
        .delete()
        .eq('id', ownOrgMembershipA!.id)
        .select();
      return { error: res.error, count: res.data?.length ?? 0 };
    },
    verify: async () =>
      persistUnchanged(userA, 'xiv_organization_memberships', ownOrgMembershipA!.id, { role: 'owner', status: 'active' }),
  });

  await attack({
    testName: 'authority.finalUniverseOwnerCannotBeRemoved.self',
    actor: userA,
    organizationId: bootA.orgId,
    universeId: bootA.universeId,
    operation: 'Sole Universe Owner A deletes own Universe membership',
    expected: 'denied; Universe owner membership remains',
    run: async () => {
      const res = await userA.client
        .from('xiv_universe_memberships')
        .delete()
        .eq('id', ownUniMembershipA!.id)
        .select();
      return { error: res.error, count: res.data?.length ?? 0 };
    },
    verify: async () =>
      persistUnchanged(userA, 'xiv_universe_memberships', ownUniMembershipA!.id, { role: 'owner', status: 'active' }),
  });

  const stale = requireFreshAuthorization(
    {
      roleVersion: roleVersion.before ?? 1,
      membershipUpdatedAt: nowIso(),
      authorizationCheckedAt: nowIso(),
      authorizationExpiresAt: new Date(Date.now() - 60_000).toISOString(),
    },
    true,
  );
  roleVersion.staleContextDenied = stale.allowed === false;
  record({
    testName: 'freshness.staleAuthorizationDenied',
    actorUserId: userB.userId,
    organizationId: bootA.orgId,
    universeId: null,
    operation: 'requireFreshAuthorization with expired context after role_version change',
    expected: 'stale authorization denied',
    actual: stale.reason,
    pass: roleVersion.staleContextDenied && roleVersion.incremented,
  });

  const staleAdminUpdate = await userB.client
    .from('xiv_organizations')
    .update({ name: 'XIV Isolation Org A hijack' })
    .eq('id', bootA.orgId)
    .select();
  const orgAStill = await readOrg(userA, bootA.orgId);
  const orgAName = (orgAStill.data ?? [])[0]?.name;
  record({
    testName: 'freshness.demotedAdminCannotManageOrg',
    actorUserId: userB.userId,
    organizationId: bootA.orgId,
    universeId: null,
    operation: 'User B (now executive) updates Org A name',
    expected: 'denied; Org A name unchanged',
    actual:
      mutationDenied(staleAdminUpdate.error, staleAdminUpdate.data?.length ?? 0) && orgAName === 'XIV Isolation Org A'
        ? `denied; name remains ${orgAName}`
        : `name=${orgAName} ${errorText(staleAdminUpdate.error)}`,
    pass:
      mutationDenied(staleAdminUpdate.error, staleAdminUpdate.data?.length ?? 0) &&
      orgAName === 'XIV Isolation Org A',
  });

  const selectorHelper = clientSelectorIsNotAuthority(bootB.orgId);
  const userRolesHelper = userRolesDoNotGrantTenantAccess();
  const profileHelper = profileCompanyDoesNotGrantTenantAccess();
  await userA.client.from('user_roles').select('role').eq('user_id', userA.userId);
  await userA.client.from('profiles').select('company').eq('id', userA.userId);
  const afterNonAuthority = await readOrg(userA, bootB.orgId);
  record({
    testName: 'authority.clientSelectorNotAuthority',
    actorUserId: userA.userId,
    organizationId: bootB.orgId,
    universeId: null,
    operation: 'User A selects Org B by client-supplied id',
    expected: 'zero rows; client selector grants nothing',
    actual: emptyRead(afterNonAuthority.data)
      ? `zero rows; helper=${selectorHelper.reason}`
      : `leaked rows; helper=${selectorHelper.reason}`,
    pass: emptyRead(afterNonAuthority.data) && selectorHelper.allowed === false,
  });
  record({
    testName: 'authority.userRolesNotAuthority',
    actorUserId: userA.userId,
    organizationId: bootB.orgId,
    universeId: null,
    operation: 'read user_roles then retry Org B select',
    expected: 'user_roles does not grant Org B',
    actual: emptyRead(afterNonAuthority.data)
      ? `Org B still zero rows; helper=${userRolesHelper.reason}`
      : 'Org B leaked after user_roles read',
    pass: emptyRead(afterNonAuthority.data) && userRolesHelper.allowed === false,
  });
  record({
    testName: 'authority.profileCompanyNotAuthority',
    actorUserId: userA.userId,
    organizationId: bootB.orgId,
    universeId: null,
    operation: 'read profiles.company then retry Org B select',
    expected: 'profiles.company does not grant Org B',
    actual: emptyRead(afterNonAuthority.data)
      ? `Org B still zero rows; helper=${profileHelper.reason}`
      : 'Org B leaked after profiles read',
    pass: emptyRead(afterNonAuthority.data) && profileHelper.allowed === false,
  });

  await userA.client.auth.signOut();
  await userB.client.auth.signOut();

  const passed = (name: string) => assertions.find((row) => row.testName === name)?.result === 'PASS';
  const groupPass = (prefix: string) =>
    assertions.filter((row) => row.testName.startsWith(prefix)).every((row) => row.result === 'PASS') &&
    assertions.some((row) => row.testName.startsWith(prefix));

  const bootstrapPassed = passed('bootstrap.userA') && passed('bootstrap.userB');
  const isolationPassed =
    groupPass('cross.org.') &&
    groupPass('cross.universe.') &&
    groupPass('positive.org.') &&
    groupPass('positive.universe.');
  const crossOrg = passed('cross.org.A-reads-B') && passed('cross.org.B-reads-A');
  const crossUniverse = passed('cross.universe.A-reads-B') && passed('cross.universe.B-reads-A');
  const escalationPassed =
    groupPass('write.') &&
    passed('authority.adminCannotCreateOwner') &&
    passed('authority.adminCannotDemoteOwner') &&
    passed('authority.adminCannotSuspendOwner') &&
    passed('authority.adminCannotRevokeOwner') &&
    passed('authority.adminCannotDeleteOwner');
  const freshnessPassed =
    passed('freshness.staleAuthorizationDenied') && passed('freshness.demotedAdminCannotManageOrg');
  const twoUsers = passed('auth.distinctUids') && passed('auth.normalSessions');
  const isolationOk =
    twoUsers &&
    bootstrapPassed &&
    isolationPassed &&
    crossOrg &&
    crossUniverse &&
    escalationPassed &&
    freshnessPassed &&
    passed('authority.executiveCannotCreateUniverse') &&
    passed('authority.finalOrgOwnerCannotBeRemoved.self') &&
    passed('authority.finalUniverseOwnerCannotBeRemoved.self') &&
    passed('authority.clientSelectorNotAuthority') &&
    passed('authority.userRolesNotAuthority') &&
    passed('authority.profileCompanyNotAuthority') &&
    assertions.every((row) => row.result === 'PASS');

  recordHostedApplyEvidence({
    applied: bootstrapPassed,
    tablesVisible: bootstrapPassed,
    rlsVerified: isolationOk,
    reason: isolationOk
      ? 'Authenticated xiv_* RPCs and tables were reachable. FORCE RLS catalog is a separate human-verified evidence kind.'
      : 'Hosted isolation assertions failed or bootstrap did not prove tables.',
  });
  recordHostedIsolationEvidence({
    bootstrapPassed,
    isolationPassed: crossOrg && crossUniverse,
    escalationPassed,
    freshnessPassed,
    twoUsers,
    reason: isolationOk
      ? 'Hosted two-user authenticated isolation assertions passed.'
      : 'One or more hosted isolation assertions failed.',
  });

  applyHostedIsolationRun({
    isolation: isolationOk ? 'PASS' : 'FAIL',
    assertions,
    identities,
    roleVersion,
    reason: isolationOk
      ? 'Hosted authenticated isolation passed. Catalog FORCE RLS is recorded separately as human_verified_hosted_catalog.'
      : 'Hosted isolation incomplete. tenantPersistence = blocked.',
  });

  const evaluated = evaluateTenantActivation();
  return {
    isolation: isolationOk ? 'PASS' : 'FAIL',
    tenantPersistence: evaluated.tenantPersistence,
    businessModulesTenantReady: evaluated.businessModulesTenantReady,
    reason: evaluated.reason,
    identities,
    roleVersion,
    assertions,
    privilegedCredentialsUnused: true,
    serviceRoleUnused: true,
    migrationFileUnchanged: true,
    rlsUnchanged: true,
  };
}
