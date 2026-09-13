import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/xiv/button';
import { Card } from '@/components/xiv/card';
import { EmptyState } from '@/components/xiv/empty-state';
import { ExperienceScreen } from '@/components/xiv/experience-screen';
import { Field } from '@/components/xiv/field';
import { PrototypeNotice } from '@/components/xiv/prototype-notice';
import { SectionHeader } from '@/components/xiv/section-header';
import { XivText } from '@/components/xiv/text';
import { Palette, Spacing } from '@/constants/theme';
import { useSession } from '@/hooks/use-session';
import { requestFeedbackIntakePreview } from '@/lib/xiv-ai-api';

type Audience = 'CUSTOMER' | 'CONSUMER' | 'COMMUNITY';
const audiences: Audience[] = ['CUSTOMER', 'CONSUMER', 'COMMUNITY'];

export function CommunityFeedback() {
  const { authSession } = useSession();
  const [audience, setAudience] = useState<Audience>('COMMUNITY');
  const [feedback, setFeedback] = useState('');
  const [consented, setConsented] = useState(false);
  const [pending, setPending] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const submit = () => {
    const token = authSession?.access_token;
    if (!token) { setNote('Sign in again to prepare a governed feedback review.'); return; }
    setPending(true);
    void requestFeedbackIntakePreview({ accessToken: token, audience, feedback, improvementConsent: consented })
      .then((result) => {
        setNote(`${result.status}: ${result.nextSteps.join(' · ')}. No model weights or neural pathways were changed.`);
        setFeedback(''); setConsented(false);
      })
      .catch(() => setNote('Feedback preview was not accepted. Check the length and consent choice; nothing was stored or learned.'))
      .finally(() => setPending(false));
  };

  return (
    <ExperienceScreen title="Feedback intelligence" subtitle="Your voice can propose improvements—never silently train the system.">
      <PrototypeNotice text="PREVIEW: feedback is validated and summarized into a review candidate. This flow does not persist raw text, change model weights, or activate a neural pathway." />
      <SectionHeader kicker="People first" title="Shape the XIV experience" />
      {note ? <EmptyState title="Governed result" body={note} ios="checkmark.shield" android="verified-user" /> : null}
      <Card variant="elevated" style={styles.card}>
        <XivText variant="label" color={Palette.accent}>WHO IS THIS FOR?</XivText>
        <View style={styles.row}>
          {audiences.map((item) => <Button key={item} label={item.toLowerCase()} variant={audience === item ? 'primary' : 'secondary'} onPress={() => setAudience(item)} style={styles.choice} />)}
        </View>
        <Field label="Feedback (10–2,000 characters)" value={feedback} onChangeText={setFeedback} multiline textAlignVertical="top" style={styles.input} maxLength={2000} placeholder="What should XIV improve for people, organizations, or communities?" />
        <Button label={consented ? '✓ Improvement review consented' : 'Allow improvement review'} variant={consented ? 'success' : 'secondary'} onPress={() => setConsented((value) => !value)} />
        <XivText variant="caption" muted>Consent covers this review candidate only. It does not authorize public sharing, profile inference, model training, account access, or commercial use.</XivText>
        <Button label={pending ? 'Preparing review…' : 'Prepare feedback review'} disabled={pending || feedback.trim().length < 10 || !consented} onPress={submit} />
      </Card>
      <Card style={styles.card}>
        <XivText variant="subtitle">Specialist team status</XivText>
        <XivText variant="body" muted>Feedback Steward · Consumer Insights · AI Economist · Community Event Planner</XivText>
        <XivText variant="caption" color={Palette.textDim}>DEFINED, NOT RUNNING. Hiring, external invitations, financial actions, and pathway promotion still require authorized human workflows.</XivText>
      </Card>
    </ExperienceScreen>
  );
}

const styles = StyleSheet.create({ card:{gap:Spacing.three}, row:{flexDirection:'row',flexWrap:'wrap',gap:Spacing.two}, choice:{flexGrow:1,minHeight:44,paddingHorizontal:Spacing.two}, input:{minHeight:132,paddingTop:Spacing.three} });
