import { formatDayMonth, parseDateKey } from "@/domain/date";
import { MonthSummary } from "@/domain/overtime";
import { formatDuration } from "@/domain/time";
import { Card, CardHeader } from "@/ui/Card";
import { colors, font, radius, shadow } from "@/ui/theme";
import { StyleSheet, Text, View } from "react-native";

type Props = { summary: MonthSummary; contractMinutes: number };

/** Chiffres clés du mois puis détail semaine par semaine. */
export function MonthSummaryCard({ summary, contractMinutes }: Props) {
  const complementary = summary.complementary10 + summary.complementary25;

  return (
    <>
      <View style={s.hero}>
        <View style={s.heroMain}>
          <Text style={s.heroLabel}>Heures du mois</Text>
          <Text style={s.heroValue}>{formatDuration(summary.totalMinutes)}</Text>
          <Text style={s.heroDetail}>
            {summary.workedDays} jour{summary.workedDays > 1 ? "s" : ""} travaillé
            {summary.workedDays > 1 ? "s" : ""}
          </Text>
        </View>
        <View style={s.heroSide}>
          <HeroStat label="Complémentaires" value={formatDuration(complementary)} />
          {summary.overtime > 0 && (
            <HeroStat label="Supplémentaires" value={formatDuration(summary.overtime)} />
          )}
        </View>
      </View>

      {summary.complementary25 > 0 && (
        <Text style={s.detail}>
          Complémentaires : {formatDuration(summary.complementary10)} à +10 % et{" "}
          {formatDuration(summary.complementary25)} à +25 %.
        </Text>
      )}

      <Card>
        <CardHeader
          icon="stats-chart"
          title="Semaine par semaine"
          subtitle={`Contrat : ${formatDuration(contractMinutes)} par semaine`}
        />
        <View>
          {summary.weeks.map((week, index) => {
            const extra = week.complementary10 + week.complementary25;
            const progress = contractMinutes > 0 ? week.workedMinutes / contractMinutes : 0;
            return (
              <View key={week.weekStart} style={[s.weekRow, index > 0 && s.weekSeparator]}>
                <View style={s.weekLine}>
                  <Text style={s.weekLabel}>
                    Du {formatDayMonth(parseDateKey(week.weekStart))} au{" "}
                    {formatDayMonth(parseDateKey(week.weekEnd))}
                  </Text>
                  <Text style={s.weekValue}>{formatDuration(week.workedMinutes)}</Text>
                </View>
                <View style={s.track}>
                  <View
                    style={[
                      s.bar,
                      { width: `${Math.min(progress, 1) * 100}%` },
                      extra > 0 && s.barOver,
                    ]}
                  />
                </View>
                {extra > 0 && (
                  <Text style={s.weekExtra}>
                    + {formatDuration(extra)} complémentaires
                    {week.overtime > 0
                      ? ` et ${formatDuration(week.overtime)} supplémentaires`
                      : ""}
                    {week.countedInMonth ? "" : " (comptées le mois suivant)"}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      </Card>
    </>
  );
}

function HeroStat(props: { label: string; value: string }) {
  return (
    <View style={s.heroStat}>
      <Text style={s.heroStatValue}>{props.value}</Text>
      <Text style={s.heroStatLabel}>{props.label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  hero: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 12,
    padding: 18,
    borderRadius: radius.large,
    backgroundColor: colors.primary,
    boxShadow: shadow.raised,
  },
  heroMain: { flex: 1, justifyContent: "center", gap: 2 },
  heroLabel: { fontSize: font.small, fontWeight: "600", color: "rgba(255,255,255,0.85)" },
  heroValue: { fontSize: 34, fontWeight: "800", color: colors.onPrimary },
  heroDetail: { fontSize: font.small, color: "rgba(255,255,255,0.85)" },
  heroSide: { justifyContent: "center", gap: 8 },
  heroStat: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.medium,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  heroStatValue: { fontSize: font.large, fontWeight: "800", color: colors.onPrimary },
  heroStatLabel: { fontSize: 13, color: "rgba(255,255,255,0.9)" },
  detail: { fontSize: font.small, color: colors.textMuted, paddingHorizontal: 4 },
  weekRow: { paddingVertical: 12, gap: 6 },
  weekSeparator: { borderTopWidth: 1, borderTopColor: colors.borderLight },
  weekLine: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  weekLabel: { fontSize: font.body, color: colors.text },
  weekValue: { fontSize: font.body, fontWeight: "800", color: colors.text },
  track: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.borderLight,
    overflow: "hidden",
  },
  bar: { height: 8, borderRadius: radius.pill, backgroundColor: colors.primary },
  barOver: { backgroundColor: colors.warning },
  weekExtra: { fontSize: font.small, fontWeight: "700", color: colors.warningText },
});
