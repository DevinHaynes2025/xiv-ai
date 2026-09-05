import type { Session, User } from '@supabase/supabase-js';

import { diagnoseAuthStage, isMissingColumnError, missingColumnName } from '@/lib/diagnostics';
import { supabase } from '@/lib/supabase';
import type { HomeExperience, RoleId } from '@/types/session';

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  country: string | null;
  avatar_path: string | null;
  professional_title: string | null;
  company: string | null;
  industry: string | null;
  location: string | null;
  expertise: string | null;
  identitySchemaReady: boolean;
};

const PROFILE_BASE_COLUMNS = 'id, full_name, email, country';
const PROFILE_IDENTITY_COLUMNS =
  'id, full_name, email, country, avatar_path, professional_title, company, industry, location, expertise';

function isMissingColumn(error: { code?: string; message?: string } | null) {
  return isMissingColumnError(error);
}

function asNullableString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : null;
}

function normalizeProfile(
  row: Record<string, unknown> | null,
  identitySchemaReady: boolean,
): Profile | null {
  if (!row || typeof row.id !== 'string') return null;
  return {
    id: row.id,
    full_name: asNullableString(row.full_name),
    email: asNullableString(row.email),
    country: asNullableString(row.country),
    avatar_path: identitySchemaReady ? asNullableString(row.avatar_path) : null,
    professional_title: identitySchemaReady ? asNullableString(row.professional_title) : null,
    company: identitySchemaReady ? asNullableString(row.company) : null,
    industry: identitySchemaReady ? asNullableString(row.industry) : null,
    location: identitySchemaReady ? asNullableString(row.location) : null,
    expertise: identitySchemaReady ? asNullableString(row.expertise) : null,
    identitySchemaReady,
  };
}

export type OnboardingProgress = {
  user_id: string;
  account_created: boolean | null;
  security_intro_complete: boolean | null;
  interests_complete: boolean | null;
  selected_experience: string | null;
  experience_selected: boolean | null;
  onboarding_complete: boolean | null;
};

// experience_selected is derivable from selected_experience, so it is the only
// onboarding_progress column this client treats as optional. Every other column
// below is load-bearing and a failure on it must surface, not degrade.
const ONBOARDING_CORE_COLUMNS =
  'user_id, account_created, security_intro_complete, interests_complete, selected_experience, onboarding_complete';
const ONBOARDING_COLUMNS = `${ONBOARDING_CORE_COLUMNS}, experience_selected`;

export type ExperienceRoute = '/consumer' | '/employee' | '/business' | '/executive';

const ROLES: RoleId[] = ['consumer', 'employee', 'business_owner', 'executive', 'entrepreneur'];

export function isRoleId(value: string | null | undefined): value is RoleId {
  return Boolean(value && ROLES.includes(value as RoleId));
}

export function experienceRoute(role: RoleId): ExperienceRoute {
  if (role === 'employee') return '/employee';
  if (role === 'business_owner') return '/business';
  if (role === 'executive') return '/executive';
  return '/consumer';
}

export function homeExperience(role: RoleId): HomeExperience {
  if (role === 'employee') return 'employee';
  if (role === 'business_owner') return 'business';
  if (role === 'executive') return 'executive';
  return 'consumer';
}

export async function currentUser(): Promise<User> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    diagnoseAuthStage('currentUser:missing', error ?? undefined);
    throw new Error('You need to be signed in to continue.');
  }
  return data.user;
}

function metadataString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

export async function ensureUserProvisioned(user: User) {
  diagnoseAuthStage('provision:start');

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  const authed = sessionData.session?.user;

  if (sessionError || !authed) {
    diagnoseAuthStage('provision:no_session', sessionError?.code);
    throw new Error('You need to be signed in to continue.');
  }

  if (authed.id !== user.id) {
    diagnoseAuthStage('provision:user_mismatch');
  }

  const fullName = metadataString(authed.user_metadata?.full_name);
  const country = metadataString(authed.user_metadata?.country);
  const email = authed.email ?? '';

  diagnoseAuthStage('provision:profile_upsert');
  const profileResult = await supabase
    .from('profiles')
    .upsert(
      {
        id: authed.id,
        full_name: fullName,
        email,
        country,
      },
      { onConflict: 'id' },
    )
    .select('id')
    .maybeSingle();

  if (profileResult.error) {
    diagnoseAuthStage('provision:profile_failed', profileResult.error);
    throw profileResult.error;
  }

  diagnoseAuthStage('provision:progress_upsert');
  const progressResult = await supabase
    .from('onboarding_progress')
    .upsert(
      {
        user_id: authed.id,
        account_created: true,
      },
      { onConflict: 'user_id' },
    )
    .select('user_id')
    .maybeSingle();

  if (progressResult.error) {
    diagnoseAuthStage('provision:progress_failed', progressResult.error);
    throw progressResult.error;
  }

  diagnoseAuthStage('provision:ok');
}

export async function loadProfile() {
  const user = await currentUser();

  // Core hydrate: original profiles columns only (hosted DB today).
  const base = await supabase
    .from('profiles')
    .select(PROFILE_BASE_COLUMNS)
    .eq('id', user.id)
    .maybeSingle();
  if (base.error) {
    diagnoseAuthStage('profile:base_load_failed', base.error);
    throw base.error;
  }

  const core = normalizeProfile((base.data ?? null) as Record<string, unknown> | null, false);

  // Identity extras from 20260904200000 — optional; must not fail auth hydrate.
  const identity = await supabase
    .from('profiles')
    .select(PROFILE_IDENTITY_COLUMNS)
    .eq('id', user.id)
    .maybeSingle();

  if (!identity.error) {
    return normalizeProfile((identity.data ?? null) as Record<string, unknown> | null, true);
  }

  if (isMissingColumn(identity.error)) {
    diagnoseAuthStage('profile:identity_columns_missing', identity.error);
    return core;
  }

  diagnoseAuthStage('profile:identity_load_optional_failed', identity.error);
  return core;
}

export async function loadOnboarding() {
  const user = await currentUser();
  const full = await supabase
    .from('onboarding_progress')
    .select(ONBOARDING_COLUMNS)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!full.error) return full.data as OnboardingProgress | null;

  const column = missingColumnName(full.error);
  if (isMissingColumn(full.error) && column === 'experience_selected') {
    // Named, not masked: the hosted onboarding_progress predates experience_selected.
    diagnoseAuthStage('onboarding:optional_column_missing', {
      code: full.error.code,
      message: full.error.message,
      details: `onboarding_progress.${column} is absent; deriving it from selected_experience. ${full.error.details ?? ''}`.trim(),
      hint: full.error.hint,
    });
    const core = await supabase
      .from('onboarding_progress')
      .select(ONBOARDING_CORE_COLUMNS)
      .eq('user_id', user.id)
      .maybeSingle();
    if (core.error) {
      diagnoseAuthStage('onboarding:load_failed', core.error);
      throw core.error;
    }
    const row = core.data as Omit<OnboardingProgress, 'experience_selected'> | null;
    if (!row) return null;
    return { ...row, experience_selected: isRoleId(row.selected_experience) } satisfies OnboardingProgress;
  }

  diagnoseAuthStage('onboarding:load_failed', full.error);
  throw full.error;
}

export async function loadRoles() {
  const user = await currentUser();
  const { data, error } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
  if (error) {
    diagnoseAuthStage('roles:load_failed', error);
    throw error;
  }
  return (data ?? [])
    .map((row) => row.role as string)
    .filter((role): role is RoleId => isRoleId(role));
}

/** Returns true only when a missing role row had to be written. */
export async function ensureSelectedRole(role: RoleId) {
  const user = await currentUser();
  diagnoseAuthStage('roles:ensure');

  const existing = await supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', role).maybeSingle();
  if (existing.error) {
    diagnoseAuthStage('roles:lookup_failed', existing.error);
    throw existing.error;
  }
  if (existing.data) return false;

  const inserted = await supabase.from('user_roles').upsert(
    { user_id: user.id, role },
    { onConflict: 'user_id,role', ignoreDuplicates: true },
  );
  if (inserted.error) {
    diagnoseAuthStage('roles:upsert_failed', inserted.error);
    const fallback = await supabase.from('user_roles').insert({ user_id: user.id, role });
    if (fallback.error) {
      diagnoseAuthStage('roles:insert_failed', fallback.error);
      throw fallback.error;
    }
  }
  return true;
}

export async function loadInterests() {
  const user = await currentUser();
  const { data, error } = await supabase.from('user_interests').select('interest').eq('user_id', user.id);
  if (error) {
    diagnoseAuthStage('interests:load_failed', error);
    throw error;
  }
  return (data ?? []).map((row) => row.interest as string);
}

async function updateProgress(patch: Record<string, string | boolean>) {
  const user = await currentUser();
  const { error } = await supabase.from('onboarding_progress').update(patch).eq('user_id', user.id);
  if (error) {
    diagnoseAuthStage('onboarding:update_failed', {
      code: error.code,
      message: error.message,
      details: `columns=${Object.keys(patch).join(',')} ${error.details ?? ''}`.trim(),
      hint: error.hint,
    });
    throw error;
  }
}

/** Returns true only when onboarding_complete had to be written. */
async function completeOnboardingIfReady() {
  const progress = await loadOnboarding();
  const ready =
    Boolean(progress?.account_created) &&
    Boolean(progress?.security_intro_complete) &&
    Boolean(progress?.interests_complete) &&
    Boolean(progress?.experience_selected);

  if (ready && !progress?.onboarding_complete) {
    await updateProgress({ onboarding_complete: true });
    return true;
  }
  return false;
}

export async function saveInterests(interests: string[]) {
  const user = await currentUser();
  const unique = [...new Set(interests.filter(Boolean))];
  diagnoseAuthStage('interests:save');

  const { error: deleteError } = await supabase.from('user_interests').delete().eq('user_id', user.id);
  if (deleteError) {
    diagnoseAuthStage('interests:delete_failed', deleteError);
    throw deleteError;
  }

  if (unique.length > 0) {
    const payload = unique.map((interest) => ({
      user_id: user.id,
      interest,
    }));
    const upserted = await supabase.from('user_interests').upsert(payload, {
      onConflict: 'user_id,interest',
      ignoreDuplicates: true,
    });
    if (upserted.error) {
      diagnoseAuthStage('interests:upsert_failed', upserted.error);
      const inserted = await supabase.from('user_interests').insert(payload);
      if (inserted.error) {
        diagnoseAuthStage('interests:insert_failed', inserted.error);
        throw inserted.error;
      }
    }
  }

  await updateProgress({ interests_complete: true });
  await completeOnboardingIfReady();
}

export async function saveSecurityIntroComplete() {
  await updateProgress({ security_intro_complete: true });
  await completeOnboardingIfReady();
}

export async function saveExperience(role: RoleId) {
  await ensureSelectedRole(role);
  await updateProgress({
    selected_experience: role,
    experience_selected: true,
  });
  await completeOnboardingIfReady();
}

export async function repairAccountPersistence() {
  const [progress, roles, interests] = await Promise.all([loadOnboarding(), loadRoles(), loadInterests()]);
  const selected = isRoleId(progress?.selected_experience) ? progress.selected_experience : (roles[0] ?? null);
  const repaired: string[] = [];

  if (selected) {
    if (await ensureSelectedRole(selected)) {
      repaired.push('user_roles.role');
    }
    if (progress?.selected_experience !== selected || !progress.experience_selected) {
      await updateProgress({
        selected_experience: selected,
        experience_selected: true,
      });
      repaired.push('onboarding_progress.selected_experience');
    }
  }

  if (interests.length > 0 && !progress?.interests_complete) {
    await updateProgress({ interests_complete: true });
    repaired.push('onboarding_progress.interests_complete');
  }

  if (await completeOnboardingIfReady()) {
    repaired.push('onboarding_progress.onboarding_complete');
  }

  if (repaired.length === 0) {
    diagnoseAuthStage('persist:repair_noop');
    return;
  }
  diagnoseAuthStage('persist:repair', 'repaired', repaired.join(','));
}

export async function resolveDestination() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return '/welcome' as const;
  const [progress, roles] = await Promise.all([loadOnboarding(), loadRoles()]);
  return nextRoute({ session: data.session, progress, roles });
}

export function nextRoute(input: {
  session: Session | null;
  progress: OnboardingProgress | null;
  roles?: RoleId[];
}): '/welcome' | '/auth' | '/security' | '/interests' | '/experience' | ExperienceRoute {
  if (!input.session) return '/welcome';

  const role = isRoleId(input.progress?.selected_experience)
    ? input.progress.selected_experience
    : input.roles?.find((item) => isRoleId(item)) ?? null;

  if (input.progress?.onboarding_complete && role) {
    return experienceRoute(role);
  }

  if (!input.progress?.account_created) {
    return '/auth';
  }

  if (!input.progress.security_intro_complete) {
    return '/security';
  }

  if (!input.progress.interests_complete) {
    return '/interests';
  }

  if (!input.progress.experience_selected || !role) {
    return '/experience';
  }

  return experienceRoute(role);
}
