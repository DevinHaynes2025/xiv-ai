import { useRouter } from 'expo-router';
import { useState } from 'react';

import { useSession } from '@/context/session';
import { useAgent } from '@/hooks/useAgent';
import { assistantHref, canAskLiveXiv, osEmphasis, osHref, type OsPath } from '@/lib/os-routes';

export function useOsActions() {
  const router = useRouter();
  const { session } = useSession();
  const { proposedAction } = useAgent();
  const [notice, setNotice] = useState<string | null>(null);
  const role = session.experience;
  const emphasis = osEmphasis(role);
  const askLive = canAskLiveXiv(role);

  const go = (path: OsPath) => router.navigate(osHref(role, path));

  const askXiv = () => {
    if (askLive) {
      router.navigate(assistantHref(role));
      return;
    }
    setNotice('Ask XIV opens the existing Gemini Business or Executive agent only. This role has no live agent.');
  };

  const approvePlan = () => {
    if (proposedAction && askLive) {
      router.navigate(assistantHref(role));
      return;
    }
    setNotice(
      'Approve Plan cannot auto-execute. Open the live Business or Executive agent to use the existing governed approval flow.',
    );
  };

  const prototype = (label: string) => {
    setNotice(`${label} is a prototype control. It does not persist a production transaction and does not send messages.`);
  };

  return { role, emphasis, askLive, notice, setNotice, go, askXiv, approvePlan, prototype, proposedAction };
}
