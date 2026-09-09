import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { Button } from '@/components/xiv/button';
import { Card } from '@/components/xiv/card';
import { Chip } from '@/components/xiv/chip';
import { XivText } from '@/components/xiv/text';
import { Palette, Spacing } from '@/constants/theme';
import { mediaStatusLabel, selectLocalMedia } from '@/lib/media-draft';
import type { MediaDraft } from '../../../../../services/ai/runtime/media';
import type { UniverseVisibility } from '../../../../../services/ai/runtime/universe';

const VISIBILITY: readonly UniverseVisibility[] = ['private', 'universe', 'employees', 'organization', 'public'];

export function MediaDraftCard({
  ownerId,
  source,
  draft,
  onChange,
  visibility,
  onVisibility,
  organizationId,
  universeId,
  universeName,
  universeStatus,
}: {
  ownerId: string;
  source: 'client' | 'company';
  draft: MediaDraft | null;
  onChange: (draft: MediaDraft | null, reason?: string) => void;
  visibility?: UniverseVisibility;
  onVisibility?: (value: UniverseVisibility) => void;
  organizationId?: string;
  universeId?: string;
  universeName?: string;
  universeStatus?: string;
}) {
  const [reason, setReason] = useState<string | undefined>();
  const selectedVisibility = visibility ?? (source === 'company' ? 'organization' : 'private');
  const persistedUniverse = Boolean(organizationId && universeId && universeName);

  const pick = (kind: 'image' | 'video') => {
    void selectLocalMedia(kind, ownerId, source, {
      visibility: selectedVisibility,
      universeId: persistedUniverse ? universeId : '',
      organizationId: persistedUniverse ? organizationId : '',
    }).then((next) => {
      setReason(next.reason);
      onChange(next.draft, next.reason);
    });
  };

  return (
    <Card style={styles.card}>
      <XivText variant="label" color={Palette.accent}>
        {source === 'company' ? 'Company media draft · local only' : 'Media draft · local only'}
      </XivText>
      {source === 'company' ? (
        <XivText variant="caption" dim>
          {persistedUniverse
            ? `${universeName} · ${universeStatus}. Cloud upload is still not configured. Scan remains unavailable.`
            : 'Universe not provisioned. Private company media stays denied until a persisted Universe exists. Production publishing writes remain disabled.'}
        </XivText>
      ) : null}
      <View style={styles.row}>
        <Button label="Select photo" variant="subtle" onPress={() => pick('image')} />
        <Button label="Select video" variant="subtle" onPress={() => pick('video')} />
      </View>
      {source === 'company' && onVisibility ? (
        <View style={styles.row}>
          {VISIBILITY.map((item) => (
            <Chip
              key={item}
              label={item}
              compact
              selected={selectedVisibility === item}
              onPress={() => onVisibility(item)}
            />
          ))}
        </View>
      ) : null}
      {draft ? (
        <View style={styles.preview}>
          {draft.mediaType === 'image' && draft.localUri ? (
            <Image source={{ uri: draft.localUri }} style={styles.image} />
          ) : (
            <XivText variant="caption" muted>
              Video selected · {draft.mimeType} · {draft.sizeBytes} bytes
            </XivText>
          )}
          <XivText variant="label" color={Palette.warning}>
            {mediaStatusLabel(draft)}
          </XivText>
          <XivText variant="caption" dim>
            Upload not configured. Media stays quarantined. Scan unavailable. No cloud upload was performed.
          </XivText>
        </View>
      ) : (
        <XivText variant="caption" dim>
          No media selected. Production upload is not wired.
        </XivText>
      )}
      {reason ? (
        <XivText variant="caption" color={Palette.warning}>
          {reason}
        </XivText>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  preview: {
    gap: Spacing.two,
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: Palette.navyCard,
  },
});
