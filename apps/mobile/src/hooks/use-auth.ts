import { useSession } from '@/hooks/use-session';

export function useAuth() {
  const { signIn, signUp, signOut, ready, authSession, destination } = useSession();
  return { signIn, signUp, signOut, ready, authSession, destination };
}
