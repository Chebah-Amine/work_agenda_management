import { buildMonthlyReport } from "@/domain/report";
import { formatDuration } from "@/domain/time";
import { MonthSummaryCard } from "@/features/calendar/components/MonthSummaryCard";
import { exportReportExcel, exportReportPdf } from "@/services/export/exportReport";
import { useAppData } from "@/state/AppDataContext";
import { Button } from "@/ui/Button";
import { LoadingView } from "@/ui/LoadingView";
import { MonthHeader, useYearMonth } from "@/ui/MonthHeader";
import { colors, font } from "@/ui/theme";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export function ReportScreen() {
  const { data } = useAppData();
  const { year, month, shift, goToToday } = useYearMonth();
  const [busy, setBusy] = useState<"pdf" | "excel" | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!data) return <LoadingView />;

  const report = buildMonthlyReport(year, month, data);
  const filledRows = report.rows.filter((row) => row.minutes > 0 || row.note);

  async function run(kind: "pdf" | "excel") {
    setBusy(kind);
    setError(null);
    try {
      await (kind === "pdf" ? exportReportPdf(report) : exportReportExcel(report));
    } catch (e) {
      console.warn("Export impossible", e);
      setError("Le rapport n'a pas pu être créé. Réessayez.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <MonthHeader year={year} month={month} onShift={shift} onToday={goToToday} />

      <View style={s.actions}>
        <Button
          label={busy === "pdf" ? "Création…" : "Rapport PDF"}
          icon="document-text-outline"
          onPress={() => run("pdf")}
          disabled={!!busy}
          style={s.flex}
        />
        <Button
          label={busy === "excel" ? "Création…" : "Rapport Excel"}
          icon="grid-outline"
          onPress={() => run("excel")}
          disabled={!!busy}
          style={s.flex}
        />
      </View>
      {error ? <Text style={s.error}>{error}</Text> : null}

      <MonthSummaryCard summary={report.summary} contractMinutes={report.contractMinutes} />

      <Text style={s.sectionTitle}>Jours saisis</Text>
      {filledRows.length === 0 ? (
        <Text style={s.empty}>Aucune heure saisie pour ce mois.</Text>
      ) : (
        <View style={s.table}>
          {filledRows.map((row) => (
            <View key={row.dateKey} style={s.row}>
              <Text style={s.day}>{row.dayLabel}</Text>
              <View style={s.rowBody}>
                {row.intervals ? <Text style={s.intervals}>{row.intervals}</Text> : null}
                {row.note ? <Text style={s.note}>{row.note}</Text> : null}
              </View>
              <Text style={s.duration}>{row.minutes > 0 ? formatDuration(row.minutes) : ""}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 14, gap: 14, paddingBottom: 32 },
  actions: { flexDirection: "row", gap: 10 },
  flex: { flex: 1 },
  error: { fontSize: font.body, fontWeight: "600", color: colors.danger },
  sectionTitle: { fontSize: font.body, fontWeight: "700", color: colors.text, marginTop: 6 },
  empty: { fontSize: font.body, color: colors.textMuted },
  table: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  day: { width: 84, fontSize: font.body, fontWeight: "700", color: colors.text },
  rowBody: { flex: 1, gap: 2 },
  intervals: { fontSize: font.small, color: colors.text },
  note: { fontSize: font.small, color: colors.textMuted },
  duration: { fontSize: font.body, fontWeight: "700", color: colors.text },
});
