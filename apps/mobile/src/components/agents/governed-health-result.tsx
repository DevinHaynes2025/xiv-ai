import { StyleSheet, View } from 'react-native';

import { DataStatusMark, statusFromReport } from '@/components/agents/data-status';
import { StructuredResultCard } from '@/components/agents/structured-result';
import { XivText } from '@/components/xiv/text';
import { Palette, Spacing } from '@/constants/theme';
import { toStructuredHealthResult, type BusinessHealthReport } from '@/lib/ai';

export function GovernedHealthResult({ report }: { report: BusinessHealthReport }) {
  const status = statusFromReport(report);
  return (
    <View style={styles.wrap}>
      <XivText variant="label" color={Palette.accent}>
        Governed health · not Gemini
      </XivText>
      <DataStatusMark
        status={status}
        source={report.provenance?.sourceSystem}
        freshness={report.provenance?.freshness}
        retrievedAt={report.provenance?.retrievedAt}
      />
      <StructuredResultCard output={{ ...toStructuredHealthResult(report) }} healthScore={report.overallScore} />
      <XivText variant="caption" dim>
        {report.findings.length} domain findings · sources {report.sourceSummary.join(', ') || 'none'}
      </XivText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.two,
  },
});
