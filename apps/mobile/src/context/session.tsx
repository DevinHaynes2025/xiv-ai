import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session as AuthSession } from '@supabase/supabase-js';

import { diagnoseAuthStage } from '@/lib/diagnostics';
import { friendlyAuthError } from '@/lib/auth-errors';
import {
  ensureUserProvisioned,
  experienceRoute,
  isRoleId,
  loadInterests,
  loadOnboarding,
  loadProfile,
  loadRoles,
  nextRoute,
  repairAccountPersistence,
  saveExperience as persistExperience,
  saveInterests as persistInterests,
  saveSecurityIntroComplete as persistSecurityIntro,
  type OnboardingProgress,
  type Profile,
} from '@/lib/onboarding';
import { resolveAvatarUrl, saveProfileIdentity as persistIdentity, type ProfileIdentityPatch } from '@/lib/profile-identity';
import { supabase } from '@/lib/supabase';
import type { RoleId, SessionSnapshot, SignUpResult } from '@/types/session';

const emptySnapshot: SessionSnapshot = {
  userId: '',
  displayName: '',
  email: '',
  country: '',
  avatarPath: '',
  avatarUrl: '',
  professionalTitle: '',
  company: '',
  industry: '',
  location: '',
  expertise: '',
  identitySchemaReady: false,
  interests: [],
  experience: null,
  accountCreated: false,
  securityIntroComplete: false,
  interestsComplete: false,
  experienceSelected: false,
  onboardingComplete: false,
};

type SessionContextValue = {
  session: SessionSnapshot;
  authSession: AuthSession | null;
  ready: boolean;
  destination: ReturnType<typeof nextRoute>;
  signUp: (input: {
    fullName: string;
    email: string;
    password: string;
    country: string;
  }) => Promise<SignUpResult>;
  signIn: (input: { email: string; password: string }) => Promise<string | null>;
  signOut: () => Promise<void>;
  saveInterests: (interests: string[]) => Promise<string | null>;
  saveIdentity: (patch: ProfileIdentityPatch) => Promise<string | null>;
  completeSecurityIntro: () => Promise<string | null>;
  selectExperience: (experience: RoleId) => Promise<string | null>;
  refresh: () => Promise<void>;
  clearExperience: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

function snapshotFrom(
  authSession: AuthSession | null,
  profile: Profile | null,
  progress: OnboardingProgress | null,
  interests: string[],
  roles: RoleId[],
  avatarUrl: string,
): SessionSnapshot {
  if (!authSession?.user) return emptySnapshot;

  const experience = isRoleId(progress?.selected_experience)
    ? progress.selected_experience
    : (roles.find((role) => isRoleId(role)) ?? null);

  return {
    userId: authSession.user.id,
    displayName: profile?.full_name ?? '',
    email: profile?.email ?? authSession.user.email ?? '',
    country: profile?.country ?? '',
    avatarPath: profile?.avatar_path ?? '',
    avatarUrl,
    professionalTitle: profile?.professional_title ?? '',
    company: profile?.company ?? '',
    industry: profile?.industry ?? '',
    location: profile?.location ?? '',
    expertise: profile?.expertise ?? '',
    identitySchemaReady: Boolean(profile?.identitySchemaReady),
    interests,
    experience,
    accountCreated: Boolean(progress?.account_created),
    securityIntroComplete: Boolean(progress?.security_intro_complete),
    interestsComplete: Boolean(progress?.interests_complete),
    experienceSelected: Boolean(progress?.experience_selected || experience),
    onboardingComplete: Boolean(progress?.onboarding_complete),
  };
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [roles, setRoles] = useState<RoleId[]>([]);
  const [ready, setReady] = useState(false);

  const hydrate = useCallback(async (nextAuth: AuthSession | null, shouldProvision = false) => {
    setAuthSession(nextAuth);
    if (!nextAuth?.user) {
      setProfile(null);
      setProgress(null);
      setInterests([]);
      setRoles([]);
      setAvatarUrl('');
      return;
    }

    diagnoseAuthStage('hydrate:start');
    try {
      if (shouldProvision) {
        await ensureUserProvisioned(nextAuth.user);
        await repairAccountPersistence();
      }
      const [nextProfile, nextProgress, nextInterests, nextRoles] = await Promise.all([
        loadProfile(),
        loadOnboarding(),
        loadInterests(),
        loadRoles(),
      ]);
      setProfile(nextProfile);
      setProgress(nextProgress);
      setInterests(nextInterests);
      setRoles(nextRoles);
      try {
        setAvatarUrl((await resolveAvatarUrl(nextProfile?.avatar_path)) ?? '');
      } catch (avatarCaught) {
        diagnoseAuthStage(
          'profile:avatar_sign_failed',
          avatarCaught as { code?: string; message?: string; details?: string; hint?: string },
        );
        setAvatarUrl('');
      }
      diagnoseAuthStage('hydrate:complete');
    } catch (caught) {
      // Each loader logs its own stage first (profile:base_load_failed,
      // onboarding:load_failed, interests:load_failed, roles:load_failed), so the
      // preceding line names the failing table and column. Anything reaching here is
      // a real db/auth/RLS/network failure and must surface as an error.
      const error = caught as { code?: string; message?: string; details?: string; hint?: string };
      diagnoseAuthStage('hydrate:failed', error);
      setProfile(null);
      setProgress(null);
      setInterests([]);
      setRoles([]);
      setAvatarUrl('');
    }
  }, []);

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    await hydrate(data.session, true);
  }, [hydrate]);

  useEffect(() => {
    let alive = true;

    const start = async () => {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;
      try {
        await hydrate(data.session, true);
      } finally {
        if (alive) setReady(true);
      }
    };

    void start();

    const { data: listener } = supabase.auth.onAuthStateChange((event, next) => {
      const shouldProvision = event === 'SIGNED_IN' || event === 'INITIAL_SESSION';
      setTimeout(() => {
        void hydrate(next, shouldProvision);
      }, 0);
    });

    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, [hydrate]);

  const signUp = useCallback(
    async (input: { fullName: string; email: string; password: string; country: string }): Promise<SignUpResult> => {
      diagnoseAuthStage('signup:start');
      const { data, error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: {
            full_name: input.fullName,
            country: input.country,
          },
        },
      });

      if (error) {
        diagnoseAuthStage('signup:auth_failed', error.code);
        return { status: 'error', message: friendlyAuthError(error) };
      }

      if (!data.session) {
        diagnoseAuthStage('signup:email_confirmation_required');
        return { status: 'confirm_email', email: input.email };
      }

      diagnoseAuthStage('signup:session_present');
      try {
        await ensureUserProvisioned(data.session.user);
        await refresh();
        diagnoseAuthStage('signup:provisioned');
        return { status: 'authenticated' };
      } catch (caught) {
        diagnoseAuthStage('signup:provision_failed', caught as { code?: string; message?: string; details?: string; hint?: string });
        return { status: 'error', message: friendlyAuthError(caught as { message?: string }) };
      }
    },
    [refresh],
  );

  const signIn = useCallback(
    async (input: { email: string; password: string }) => {
      diagnoseAuthStage('signin:start');
      const { data, error } = await supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });
      if (error) {
        diagnoseAuthStage('signin:auth_failed', error.code);
        return friendlyAuthError(error);
      }

      if (!data.session?.user) {
        diagnoseAuthStage('signin:no_session');
        return 'Sign in did not create a session. Verify your email, then try again.';
      }

      try {
        await ensureUserProvisioned(data.session.user);
        await refresh();
        diagnoseAuthStage('signin:provisioned');
        return null;
      } catch (caught) {
        diagnoseAuthStage('signin:provision_failed', caught as { code?: string; message?: string; details?: string; hint?: string });
        return friendlyAuthError(caught as { message?: string });
      }
    },
    [refresh],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setAuthSession(null);
    setProfile(null);
    setProgress(null);
    setInterests([]);
    setRoles([]);
    setAvatarUrl('');
  }, []);

  const saveInterests = useCallback(
    async (nextInterests: string[]) => {
      try {
        await persistInterests(nextInterests);
        await refresh();
        return null;
      } catch (caught) {
        return friendlyAuthError(caught as { message?: string });
      }
    },
    [refresh],
  );

  const saveIdentity = useCallback(
    async (patch: ProfileIdentityPatch) => {
      try {
        await persistIdentity(patch);
        await refresh();
        return null;
      } catch (caught) {
        const media = caught as { message?: string };
        return media.message ?? 'Could not save professional identity.';
      }
    },
    [refresh],
  );

  const completeSecurityIntro = useCallback(async () => {
    try {
      await persistSecurityIntro();
      await refresh();
      return null;
    } catch (caught) {
      return friendlyAuthError(caught as { message?: string });
    }
  }, [refresh]);

  const selectExperience = useCallback(
    async (experience: RoleId) => {
      try {
        await persistExperience(experience);
        await refresh();
        return null;
      } catch (caught) {
        return friendlyAuthError(caught as { message?: string });
      }
    },
    [refresh],
  );

  const session = useMemo(
    () => snapshotFrom(authSession, profile, progress, interests, roles, avatarUrl),
    [authSession, avatarUrl, profile, progress, interests, roles],
  );

  const destination = useMemo(
    () => nextRoute({ session: authSession, progress, roles }),
    [authSession, progress, roles],
  );

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      authSession,
      ready,
      destination,
      signUp,
      signIn,
      signOut,
      saveInterests,
      saveIdentity,
      completeSecurityIntro,
      selectExperience,
      refresh,
      clearExperience: () => undefined,
    }),
    [
      session,
      authSession,
      ready,
      destination,
      signUp,
      signIn,
      signOut,
      saveInterests,
      saveIdentity,
      completeSecurityIntro,
      selectExperience,
      refresh,
    ],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return context;
}

export function homeForExperience(experience: RoleId) {
  return experienceRoute(experience);
}
