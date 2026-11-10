import { buildMonthlyReport } from "@/domain/report";
import { formatDuration } from "@/domain/time";
import { MonthSummaryCard } from "@/features/calendar/components/MonthSummaryCard";
import {
  canShareReports,
  downloadReport,
  ReportFormat,
  shareReport,
} from "@/services/export/exportReport";
import { useAppData } from "@/state/AppDataContext";
import { Button } from "@/ui/Button";
import { Card, CardHeader } from "@/ui/Card";
import { LoadingView } from "@/ui/LoadingView";
import { MonthHeader, useYearMonth } from "@/ui/MonthHeader";
import { colors, font, radius, spacing } from "@/ui/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ComponentProps, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

type Action = "download" | "share";

const FORMATS: {
  format: ReportFormat;
  label: string;
  icon: ComponentProps<typeof Ionicons>["name"];
}[] = [
  { format: "pdf", label: "Rapport PDF", icon: "document-text-outline" },
  { format: "excel", label: "Rapport Excel", icon: "grid-outline" },
];

export function ReportScreen() {
  const { data } = useAppData();
  const { year, month, shift, goToToday } = useYearMonth();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  if (!data) return <LoadingView />;

  const report = buildMonthlyReport(year, month, data);
  const filledRows = report.rows.filter((row) => row.minutes > 0 || row.note);

  async function run(format: ReportFormat, action: Action) {
    setBusy(`${format}-${action}`);
    setError(null);
    setSaved(null);
    try {
      if (action === "share") {
        await shareReport(report, format);
      } else {
        const name = await downloadReport(report, format);
        if (name) setSaved(name);
      }
    } catch (e) {
      console.warn("Export impossible", e);
      setError(
        action === "download"
          ? "Le rapport n'a pas pu être enregistré. Réessayez ou choisissez un autre dossier."
          : "Le rapport n'a pas pu être créé. Réessayez."
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <MonthHeader year={year} month={month} onShift={shift} onToday={goToToday} />

      <Card>
        <CardHeader icon="download-outline" title="Obtenir le rapport" />
        {FORMATS.map(({ format, label, icon }) => (
          <View key={format} style={s.format}>
            <View style={s.formatTitle}>
              <Ionicons name={icon} size={22} color={colors.primary} />
              <Text style={s.formatLabel}>{label}</Text>
            </View>
            <View style={s.actions}>
              <Button
                label={busy === `${format}-download` ? "Création…" : "Télécharger"}
                icon="download-outline"
                onPress={() => run(format, "download")}
                disabled={!!busy}
                style={s.flex}
              />
              {canShareReports ? (
                <Button
                  label={busy === `${format}-share` ? "Création…" : "Partager"}
                  icon="share-outline"
                  variant="secondary"
                  onPress={() => run(format, "share")}
                  disabled={!!busy}
                  style={s.flex}
                />
              ) : null}
            </View>
          </View>
        ))}
        <Text style={s.hint}>
          {canShareReports
            ? "Télécharger : enregistre le fichier dans le dossier de votre choix.\nPartager : l’envoie par e-mail, messagerie, impression…"
            : "Le PDF s’ouvre dans la fenêtre d’impression : choisissez « Enregistrer en PDF »."}
        </Text>
      </Card>
      {saved ? <Text style={s.success}>Rapport enregistré : {saved}</Text> : null}
      {error ? <Text style={s.error}>{error}</Text> : null}

      <MonthSummaryCard summary={report.summary} contractMinutes={report.contractMinutes} />

      <Card>
        <CardHeader icon="list" title="Jours saisis" />
        {filledRows.length === 0 ? (
          <Text style={s.empty}>Aucune heure saisie pour ce mois.</Text>
        ) : (
          <View>
            {filledRows.map((row, index) => (
              <View key={row.dateKey} style={[s.row, index > 0 && s.rowSeparator]}>
                <Text style={s.day}>{row.dayLabel}</Text>
                <View style={s.rowBody}>
                  {row.intervals ? <Text style={s.intervals}>{row.intervals}</Text> : null}
                  {row.note ? <Text style={s.note}>{row.note}</Text> : null}
                </View>
                <Text style={s.duration}>
                  {row.minutes > 0 ? formatDuration(row.minutes) : ""}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Card>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.screen, gap: spacing.gap, paddingBottom: 32 },
  format: { gap: 8, marginBottom: 14 },
  formatTitle: { flexDirection: "row", alignItems: "center", gap: 8 },
  formatLabel: { fontSize: font.body, fontWeight: "700", color: colors.text },
  actions: { flexDirection: "row", gap: 10 },
  flex: { flex: 1 },
  hint: { fontSize: font.small, color: colors.textMuted, lineHeight: 20 },
  success: {
    fontSize: font.body,
    fontWeight: "600",
    color: colors.success,
    padding: 12,
    borderRadius: radius.medium,
    backgroundColor: colors.successLight,
  },
  error: {
    fontSize: font.body,
    fontWeight: "600",
    color: colors.danger,
    padding: 12,
    borderRadius: radius.medium,
    backgroundColor: colors.dangerLight,
  },
  empty: { fontSize: font.body, color: colors.textMuted },
  row: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12 },
  rowSeparator: { borderTopWidth: 1, borderTopColor: colors.borderLight },
  day: { width: 84, fontSize: font.body, fontWeight: "700", color: colors.text },
  rowBody: { flex: 1, gap: 2 },
  intervals: { fontSize: font.small, color: colors.text },
  note: { fontSize: font.small, color: colors.textMuted },
  duration: { fontSize: font.body, fontWeight: "800", color: colors.text },
});
