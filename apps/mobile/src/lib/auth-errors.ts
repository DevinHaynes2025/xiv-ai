export function friendlyAuthError(error: { message?: string; code?: string; status?: number } | null | undefined) {
  const message = (error?.message ?? '').toLowerCase();
  const code = (error?.code ?? '').toLowerCase();

  if (message.includes('invalid login') || message.includes('invalid credentials') || code === 'invalid_credentials') {
    return 'Email or password is incorrect.';
  }
  if (
    message.includes('already registered') ||
    message.includes('user already exists') ||
    code === 'user_already_exists'
  ) {
    return 'An account with this email already exists. Sign in instead.';
  }
  if (message.includes('email not confirmed') || code === 'email_not_confirmed') {
    return 'Verify your email before signing in. Check your inbox for the XIV confirmation link.';
  }
  if (message.includes('password') || code === 'weak_password') {
    return 'Use a password with at least 6 characters.';
  }
  if (message.includes('rate limit') || message.includes('too many')) {
    return 'Too many attempts. Wait a moment and try again.';
  }
  if (message.includes('network') || message.includes('fetch') || message.includes('failed to fetch')) {
    return 'Network error. Check your connection and try again.';
  }
  if (message.includes('row-level security') || message.includes('rls') || code === '42501') {
    return 'Your account is signed in, but this record could not be saved. Try again in a moment.';
  }

  return 'Something went wrong. Please try again.';
}
