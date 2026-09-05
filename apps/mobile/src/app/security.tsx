import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/xiv/button';
import { Card } from '@/components/xiv/card';
import { CheckRow } from '@/components/xiv/check-row';
import { Icon } from '@/components/xiv/icon';
import { ProgressDots } from '@/components/xiv/progress-dots';
import { PrototypeNotice } from '@/components/xiv/prototype-notice';
import { Screen } from '@/components/xiv/screen';
import { XivText } from '@/components/xiv/text';
import { useSession } from '@/hooks/use-session';
import { Palette, Spacing } from '@/constants/theme';
import { dataPermissions, privacyControls, securitySteps } from '@/data/mock';

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

  if (!step) return null;

  const toggle = (list: string[], id: string, setter: (next: string[]) => void) => {
    setter(list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);
  };

  return (
    <Screen
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
      <XivText variant="label" color={Palette.accent}>
        Security setup
      </XivText>
      <XivText variant="display">Security is the product perimeter.</XivText>
      <ProgressDots count={securitySteps.length} index={index} />

      <Card accent>
        <View style={styles.iconWrap}>
          <Icon name={{ ios: step.ios, android: step.android, web: step.android }} size={32} />
        </View>
        <XivText variant="caption" color={Palette.accent}>
          Step {index + 1} of {securitySteps.length} · simulated
        </XivText>
        <XivText variant="title">{step.title}</XivText>
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
            <XivText variant="caption" color={i <= index ? Palette.text : Palette.textDim}>
              {item.title}
            </XivText>
          </View>
        ))}
      </View>

      <PrototypeNotice text="These steps are a visual prototype. Identity, passkeys, device verification, and MFA are not implemented." />
      {error ? (
        <XivText variant="body" color={Palette.danger}>
          {error}
        </XivText>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.accentMuted,
    marginBottom: Spacing.three,
  },
  stack: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
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
});
