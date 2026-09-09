import { useState } from 'react';

import { useSession } from '@/hooks/use-session';
import {
  analyzeBusinessHealth,
  analyzeLiveBusinessHealth,
  analyzeSupplyChain,
  getDefaultAgentRuntime,
  probeLiveCompanySource,
  proposeOperationalChange,
  runGuardianSnapshot,
  summarizeExecutiveBrief,
  summarizeLiveExecutiveBrief,
  summarizeExecutiveHealth,
  type GovernedResult,
  type GuardianHealthReport,
} from '@/lib/ai';
import { loadAuthorizedSessionRecords } from '@/lib/session-records';
import { probeAiService } from '@/lib/xiv-ai-api';

export function useGovernedRuntime() {
  const { session } = useSession();
  const runtime = getDefaultAgentRuntime();
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<GuardianHealthReport | null>(null);
  const [lastResult, setLastResult] = useState<GovernedResult | null>(null);

  const pending = runtime.store.listPending();
  const actions = runtime.store.listActions().slice(0, 8);
  const events = runtime.store.listEvents().slice(0, 8);

  const runAnalyze = () => {
    setLastResult(analyzeBusinessHealth());
  };

  const runSupplyChain = () => {
    setLastResult(analyzeSupplyChain());
  };

  const runExecutiveSummary = () => {
    setLastResult(summarizeExecutiveHealth());
  };

  const runExecutiveBrief = () => {
    setLastResult(summarizeExecutiveBrief());
  };

  const withSessionRecords = async (
    run: (
      sessionRecords: Awaited<ReturnType<typeof loadAuthorizedSessionRecords>> | undefined,
      ownerId: string | null,
    ) => Promise<GovernedResult>,
  ) => {
    if (busy) return;
    setBusy(true);
    try {
      const ownerId = session.userId || null;
      const sessionRecords = ownerId ? await loadAuthorizedSessionRecords(session) : undefined;
      setLastResult(await run(sessionRecords, ownerId));
    } finally {
      setBusy(false);
    }
  };

  const runLiveSource = () => {
    void withSessionRecords((sessionRecords, ownerId) => probeLiveCompanySource({ sessionRecords, ownerId }));
  };

  const runLiveHealth = () => {
    void withSessionRecords((sessionRecords, ownerId) => analyzeLiveBusinessHealth({ sessionRecords, ownerId }));
  };

  const runLiveBrief = () => {
    void withSessionRecords((sessionRecords, ownerId) => summarizeLiveExecutiveBrief({ sessionRecords, ownerId }));
  };

  const runPropose = () => {
    setLastResult(proposeOperationalChange());
  };

  const decide = (actionId: string, decision: 'approved' | 'denied') => {
    const reviewed = runtime.approval.decide({
      actionId,
      decision,
      reviewedBy: session.displayName || 'operator',
    });
    setLastResult(decision === 'approved' ? runtime.approval.attemptExecution(actionId) : reviewed);
  };

  const snapshot = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const next = await runGuardianSnapshot({
        handlers: {
          'ai-service-health': async () => {
            const probe = await probeAiService();
            return probe.reachable
              ? {
                  status: 'healthy',
                  message: 'AI service /health responded. This is a one-time probe, not continuous monitoring.',
                }
              : {
                  status: 'warning',
                  message: 'AI service /health was not reachable. Guardian is not watching in the background.',
                };
          },
        },
      });
      setReport(next);
    } finally {
      setBusy(false);
    }
  };

  return {
    busy,
    report,
    lastResult,
    pending,
    actions,
    events,
    runAnalyze,
    runSupplyChain,
    runExecutiveSummary,
    runExecutiveBrief,
    runLiveSource,
    runLiveHealth,
    runLiveBrief,
    runPropose,
    decide,
    snapshot,
  };
}
