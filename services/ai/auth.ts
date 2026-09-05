import { createClient } from '@supabase/supabase-js';

export type VerifiedUser = {
  id: string;
};

export class ServiceError extends Error {
  code: string;
  status: number;

  constructor(code: string, status: number, message: string) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

function bearerToken(authorization: string | null | undefined) {
  if (!authorization) return '';
  const match = /^Bearer\s+(\S+)/i.exec(authorization.trim());
  return match?.[1] ?? '';
}

export async function verifyAccessToken(authorization: string | null | undefined): Promise<VerifiedUser> {
  const token = bearerToken(authorization);
  if (!token) {
    throw new ServiceError('unauthorized', 401, 'Sign in required.');
  }

  const url = process.env.SUPABASE_URL?.trim();
  const anon = (process.env.SUPABASE_ANON_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY)?.trim();
  if (!url || !anon) {
    throw new ServiceError('not_configured', 503, 'The AI service is not configured.');
  }

  const supabase = createClient(url, anon, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user?.id) {
    throw new ServiceError('unauthorized', 401, 'Sign in required.');
  }

  return { id: data.user.id };
}
