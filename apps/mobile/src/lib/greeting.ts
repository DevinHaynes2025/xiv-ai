export function firstName(fullName: string) {
  return fullName.trim().split(/\s+/).filter(Boolean)[0] ?? '';
}

export function dayGreeting(fullName: string) {
  const hour = new Date().getHours();
  const hello = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const first = firstName(fullName);
  return first ? `${hello}, ${first}` : hello;
}
