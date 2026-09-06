import { StyleSheet, View } from 'react-native';

import { StructuredResultCard } from '@/components/agents/structured-result';
import { XivText } from '@/components/xiv/text';
import { Palette, Spacing } from '@/constants/theme';
import { toStructuredHealthResult, type BusinessHealthReport } from '@/lib/ai';

export function GovernedHealthResult({ report }: { report: BusinessHealthReport }) {
  return (
    <View style={styles.wrap}>
      <XivText variant="label" color={Palette.accent}>
        Governed health · prototype · not Gemini
      </XivText>
      <StructuredResultCard output={{ ...toStructuredHealthResult(report) }} healthScore={report.overallScore} />
      <XivText variant="caption" dim>
        {report.findings.length} domain findings · sources {report.sourceSummary.join(', ')}
      </XivText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.two,
  },
});
