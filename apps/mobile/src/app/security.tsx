import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/xiv/button';
import { Card } from '@/components/xiv/card';
import { CheckRow } from '@/components/xiv/check-row';
import { Icon } from '@/components/xiv/icon';
import { OnboardingHero } from '@/components/xiv/onboarding-hero';
import { ProgressDots } from '@/components/xiv/progress-dots';
import { PrototypeNotice } from '@/components/xiv/prototype-notice';
import { Screen } from '@/components/xiv/screen';
import { XivText } from '@/components/xiv/text';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { dataPermissions, privacyControls, securitySteps } from '@/data/mock';
import { useSession } from '@/hooks/use-session';

const TRUST_LAYERS = [
  'Identity',
  'Access',
  'Isolation',
  'Encryption',
  'Agent Authority',
  'Auditability',
  'Recovery',
] as const;

function stepStatus(id: string) {
  if (id === 'privacy' || id === 'permissions') return 'Configurable';
  if (id === 'complete') return 'Preview';
  return 'Designed';
}

export default function Security() {
  const router = useRouter();
  const { completeSecurityIntro } = useSession();
  const [index, setIndex] = useState(0);
  const [privacy, setPrivacy] = useState<string[]>(['discovery', 'location']);
  const [permissions, setPermissions] = useState<string[]>(['products', 'surveys']);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const step = securitySteps[index];
  const last = index === securitySteps.length - 1;
  const total = securitySteps.length;

  if (!step) return null;

  const toggle = (list: string[], id: string, setter: (next: string[]) => void) => {
    setter(list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);
  };

  return (
    <Screen
      atmosphere="restrained"
      onBack={() => (index === 0 ? router.back() : setIndex((value) => value - 1))}
      footer={
        <Button
          label={busy ? 'Saving…' : last ? 'Continue to interests' : step.action}
          disabled={busy}
          onPress={() => {
            void (async () => {
              if (!last) {
                setIndex((value) => value + 1);
                return;
              }
              setError(null);
              setBusy(true);
              try {
                const result = await completeSecurityIntro();
                if (result) {
                  setError(result);
                  return;
                }
                router.push('/interests');
              } finally {
                setBusy(false);
              }
            })();
          }}
        />
      }>
      <OnboardingHero
        markSize={40}
        kicker="XIV Security"
        title="Your environment starts with trust."
        support="Review how XIV protects access, privacy, permissions, and organizational intelligence."
      />

      <XivText variant="label" color={Palette.accent}>
        Step {index + 1} of {total}
      </XivText>

      <View style={styles.progress}>
        <ProgressDots count={total} index={index} />
        <XivText variant="caption" muted>
          {index + 1} / {total} · {step.title}
        </XivText>
      </View>

      <Card variant="accent" style={styles.panel}>
        <View style={styles.panelHead}>
          <View style={styles.iconWrap}>
            <Icon name={{ ios: step.ios, android: step.android, web: step.android }} size={28} />
          </View>
          <View style={styles.panelMeta}>
            <View style={styles.panelTop}>
              <XivText variant="label" color={Palette.accent}>
                Step {String(index + 1).padStart(2, '0')}
              </XivText>
              <View style={styles.status}>
                <XivText variant="label" color={Palette.intelligence}>
                  {stepStatus(step.id)}
                </XivText>
              </View>
            </View>
            <XivText variant="title">{step.title}</XivText>
          </View>
        </View>
        <XivText variant="body" muted>
          {step.detail}
        </XivText>
      </Card>

      {step.id === 'privacy'
        ? privacyControls.map((item) => (
            <CheckRow
              key={item.id}
              label={item.label}
              selected={privacy.includes(item.id)}
              onPress={() => toggle(privacy, item.id, setPrivacy)}
            />
          ))
        : null}

      {step.id === 'permissions'
        ? dataPermissions.map((item) => (
            <CheckRow
              key={item.id}
              label={item.label}
              selected={permissions.includes(item.id)}
              onPress={() => toggle(permissions, item.id, setPermissions)}
            />
          ))
        : null}

      <View style={styles.stack}>
        {securitySteps.map((item, i) => (
          <View key={item.id} style={styles.row}>
            <View style={[styles.pip, i < index && styles.pipDone, i === index && styles.pipOn]} />
            <XivText variant="caption" color={i === index ? Palette.text : i < index ? Palette.textMuted : Palette.textDim}>
              {item.title}
            </XivText>
          </View>
        ))}
      </View>

      <Card style={styles.layers}>
        <XivText variant="label" color={Palette.accent}>
          XIV Trust Architecture
        </XivText>
        <XivText variant="caption" muted>
          Designed security layers — not fully deployed in this preview.
        </XivText>
        <View style={styles.layerWrap}>
          {TRUST_LAYERS.map((layer) => (
            <View key={layer} style={styles.layer}>
              <XivText variant="caption" color={Palette.textMuted}>
                {layer}
              </XivText>
            </View>
          ))}
        </View>
      </Card>

      <PrototypeNotice text="These steps are a visual prototype. Identity, passkeys, device verification, and MFA are not implemented." />
      {error ? (
        <Card variant="risk" accessibilityRole="alert">
          <XivText variant="label" color={Palette.danger}>
            Unable to continue
          </XivText>
          <XivText variant="body" style={styles.errorBody}>
            {error}
          </XivText>
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  progress: {
    gap: Spacing.two,
  },
  panel: {
    gap: Spacing.three,
  },
  panelHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.accentMuted,
  },
  panelMeta: {
    flex: 1,
    gap: 6,
  },
  panelTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  status: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: Palette.intelligenceSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.lineStrong,
  },
  stack: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 28,
  },
  pip: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Palette.navySoft,
  },
  pipOn: {
    backgroundColor: Palette.accent,
  },
  pipDone: {
    backgroundColor: Palette.success,
  },
  layers: {
    gap: Spacing.two,
  },
  layerWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  layer: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.line,
    backgroundColor: Palette.surfaceSoft,
  },
  errorBody: {
    marginTop: Spacing.one,
  },
});
