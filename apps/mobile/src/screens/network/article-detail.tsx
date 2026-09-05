import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { Avatar } from '@/components/xiv/avatar';
import { Button } from '@/components/xiv/button';
import { Card } from '@/components/xiv/card';
import { EmptyState } from '@/components/xiv/empty-state';
import { ExperienceScreen } from '@/components/xiv/experience-screen';
import { PrototypeNotice } from '@/components/xiv/prototype-notice';
import { SampleMark } from '@/components/xiv/sample-mark';
import { SectionHeader } from '@/components/xiv/section-header';
import { XivText } from '@/components/xiv/text';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { professionalFeed } from '@/data/mock';

const covers = {
  network: require('../../../assets/images/cinematic/network-web.png'),
  earth: require('../../../assets/images/cinematic/earth-night.png'),
};

export function ArticleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const article = professionalFeed.find((item) => item.id === id && item.kind === 'article');

  if (!article) {
    return (
      <ExperienceScreen title="Article" subtitle="Professional reading">
        <EmptyState
          title="Article not in this preview"
          body="Only DEMO article cards from the professional feed open here. No article table is connected."
        />
      </ExperienceScreen>
    );
  }

  return (
    <ExperienceScreen title="Article" subtitle="Readable professional long-form">
      <PrototypeNotice text="This article is DEMO copy. Summarize, Explain, and Key Takeaways are prototype controls — no model is called from this page." />
      {article.preview ? (
        <View style={styles.cover}>
          <Image source={covers[article.preview]} style={styles.coverImage} contentFit="cover" />
          <View style={styles.coverWash} />
          <View style={styles.coverMeta}>
            <SampleMark text="DEMO" />
            <XivText variant="caption" color={Palette.white}>
              {article.readingTime ?? 'Reading time unknown'}
            </XivText>
          </View>
        </View>
      ) : null}

      <XivText variant="title">{article.title}</XivText>
      <View style={styles.byline}>
        <Avatar name={article.author} size={40} />
        <View style={styles.copy}>
          <XivText variant="subtitle">{article.author}</XivText>
          <XivText variant="caption" muted>
            {[article.role, article.company, article.industry].join(' · ')}
          </XivText>
        </View>
      </View>

      {article.summary ? (
        <>
          <SectionHeader kicker="Summary" title="What this desk note is saying" />
          <Card>
            <XivText variant="body" muted>
              {article.summary}
            </XivText>
          </Card>
        </>
      ) : null}

      <SectionHeader kicker="Reading" title="The note" />
      {(article.body ?? [article.description]).map((paragraph) => (
        <XivText key={paragraph} variant="body">
          {paragraph}
        </XivText>
      ))}

      <View style={styles.tags}>
        {article.tags.map((tag) => (
          <View key={tag} style={styles.tag}>
            <XivText variant="caption" color={Palette.accent}>
              {tag}
            </XivText>
          </View>
        ))}
      </View>

      <SectionHeader kicker="Assistant" title="Reading tools" />
      <View style={styles.tools}>
        <Button label="Summarize" variant="subtle" disabled />
        <Button label="Explain" variant="subtle" disabled />
        <Button label="Key Takeaways" variant="subtle" disabled />
      </View>
      <XivText variant="caption" color={Palette.textDim}>
        Prototype only. These actions will stay disabled until a governed reading service exists.
      </XivText>
    </ExperienceScreen>
  );
}

const styles = StyleSheet.create({
  cover: {
    height: 188,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Palette.navyDeep,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverWash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(1, 24, 39, 0.28)',
  },
  coverMeta: {
    position: 'absolute',
    right: Spacing.two,
    bottom: Spacing.two,
    alignItems: 'flex-end',
    gap: 4,
  },
  byline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  tag: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    backgroundColor: Palette.accentMuted,
  },
  tools: {
    gap: Spacing.two,
  },
});
