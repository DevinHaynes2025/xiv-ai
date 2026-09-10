const prefixes = ['Signal', 'Keel', 'North', 'Harbor', 'Atlas'];

/** Deterministic on-device alias — must match services/ai anonymousEmployeeAlias. */
export function anonymousAlias(userId: string) {
  if (!userId) return 'Signal-00';

  let hash = 0;
  for (let index = 0; index < userId.length; index += 1) {
    hash = (hash * 31 + userId.charCodeAt(index)) >>> 0;
  }

  const prefix = prefixes[hash % prefixes.length];
  const letter = String.fromCharCode(65 + (hash % 26));
  const code = String((hash % 90) + 10).padStart(2, '0');
  return `${prefix}-${letter}${code}`;
}
