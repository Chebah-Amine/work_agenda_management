import { formatDayMonth, parseDateKey } from "@/domain/date";
import { MonthSummary } from "@/domain/overtime";
import { formatDuration } from "@/domain/time";
import { colors, font } from "@/ui/theme";
import { StyleSheet, Text, View } from "react-native";

type Props = { summary: MonthSummary; contractMinutes: number };

/** Chiffres clés du mois puis détail semaine par semaine. */
export function MonthSummaryCard({ summary, contractMinutes }: Props) {
  const complementary = summary.complementary10 + summary.complementary25;

  return (
    <View style={s.container}>
      <View style={s.stats}>
        <Stat label="Heures du mois" value={formatDuration(summary.totalMinutes)} />
        <Stat
          label="Complémentaires"
          value={formatDuration(complementary)}
          highlight={complementary > 0}
        />
        {summary.overtime > 0 && (
          <Stat label="Supplémentaires" value={formatDuration(summary.overtime)} highlight />
        )}
      </View>

      {summary.complementary25 > 0 && (
        <Text style={s.detail}>
          Complémentaires : {formatDuration(summary.complementary10)} à +10 % et{" "}
          {formatDuration(summary.complementary25)} à +25 %.
        </Text>
      )}

      <Text style={s.sectionTitle}>
        Semaine par semaine (contrat : {formatDuration(contractMinutes)})
      </Text>
      {summary.weeks.map((week) => {
        const extra = week.complementary10 + week.complementary25;
        return (
          <View key={week.weekStart} style={s.weekRow}>
            <View style={s.weekLine}>
              <Text style={s.weekLabel}>
                Du {formatDayMonth(parseDateKey(week.weekStart))} au{" "}
                {formatDayMonth(parseDateKey(week.weekEnd))}
              </Text>
              <Text style={s.weekValue}>{formatDuration(week.workedMinutes)}</Text>
            </View>
            {extra > 0 && (
              <Text style={s.weekExtra}>
                + {formatDuration(extra)} complémentaires
                {week.overtime > 0 ? ` et ${formatDuration(week.overtime)} supplémentaires` : ""}
                {week.countedInMonth ? "" : " (comptées le mois suivant)"}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

function Stat(props: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={s.stat}>
      <Text style={[s.statValue, props.highlight && s.statHighlight]}>{props.value}</Text>
      <Text style={s.statLabel}>{props.label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { gap: 10 },
  stats: { flexDirection: "row", gap: 8 },
  stat: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
    alignItems: "center",
    gap: 2,
  },
  statValue: { fontSize: font.large, fontWeight: "700", color: colors.text },
  statHighlight: { color: colors.primary },
  statLabel: { fontSize: font.small, color: colors.textMuted, textAlign: "center" },
  detail: { fontSize: font.small, color: colors.textMuted },
  sectionTitle: { fontSize: font.body, fontWeight: "700", color: colors.text, marginTop: 6 },
  weekRow: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 2,
  },
  weekLine: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  weekLabel: { fontSize: font.body, color: colors.text },
  weekValue: { fontSize: font.body, fontWeight: "700", color: colors.text },
  weekExtra: { fontSize: font.small, fontWeight: "600", color: colors.primary },
});
