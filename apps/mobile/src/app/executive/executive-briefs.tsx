import { LiveStoryBriefScreen } from '@/screens/executive/live-story-brief';

/**
 * US-EXE-02 - Executive briefs surface uses the same live Story Engine brief path.
 */
export default function ExecutiveExecutiveBriefs() {
  return (
    <LiveStoryBriefScreen
      title="Executive Briefs"
      subtitle="What changed / why - live governed brief. Read-only; actions requireApproval."
    />
  );
}
