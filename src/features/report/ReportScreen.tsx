import { buildMonthlyReport } from "@/domain/report";
import { formatDuration } from "@/domain/time";
import { MonthSummaryCard } from "@/features/calendar/components/MonthSummaryCard";
import {
  canShareReports,
  downloadReport,
  emailReport,
  NoMailAppError,
  ReportFormat,
  shareReport,
} from "@/services/export/exportReport";
import { ArchivedYearNotice } from "@/features/data/ArchivedYearNotice";
import { useAppData } from "@/state/AppDataContext";
import { Button } from "@/ui/Button";
import { Card, CardHeader } from "@/ui/Card";
import { LoadingView } from "@/ui/LoadingView";
import { MonthHeader, useYearMonth } from "@/ui/MonthHeader";
import { colors, font, radius, spacing } from "@/ui/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ComponentProps, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type Action = "email" | "share" | "download";

const ERRORS: Record<Action, string> = {
  email: "L'e-mail n'a pas pu être préparé. Réessayez, ou utilisez « Partager ».",
  share: "Le rapport n'a pas pu être créé. Réessayez.",
  download: "Le rapport n'a pas pu être enregistré. Réessayez ou choisissez un autre dossier.",
};

const FORMATS: {
  format: ReportFormat;
  label: string;
  icon: ComponentProps<typeof Ionicons>["name"];
}[] = [
  { format: "pdf", label: "PDF", icon: "document-text-outline" },
  { format: "excel", label: "Excel", icon: "grid-outline" },
];

export function ReportScreen() {
  const { data } = useAppData();
  const { year, month, shift, goToToday } = useYearMonth();
  const [format, setFormat] = useState<ReportFormat>("pdf");
  const [busy, setBusy] = useState<Action | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  if (!data) return <LoadingView />;

  const report = buildMonthlyReport(year, month, data);
  const filledRows = report.rows.filter((row) => row.minutes > 0 || row.note);

  async function run(action: Action) {
    setBusy(action);
    setError(null);
    setSaved(null);
    try {
      if (action === "email") {
        await emailReport(report, format);
      } else if (action === "share") {
        await shareReport(report, format);
      } else {
        const name = await downloadReport(report, format);
        if (name) setSaved(name);
      }
    } catch (e) {
      console.warn("Export impossible", e);
      setError(e instanceof NoMailAppError ? `${e.message} Utilisez « Partager ».` : ERRORS[action]);
    } finally {
      setBusy(null);
    }
  }

  const label = (action: Action, text: string) => (busy === action ? "Création…" : text);

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <MonthHeader year={year} month={month} onShift={shift} onToday={goToToday} />
      <ArchivedYearNotice year={year} />

      <Card>
        <CardHeader icon="paper-plane-outline" title="Envoyer le rapport" />
        <Text style={s.formatLabel}>Format</Text>
        <View style={s.segment} accessibilityRole="radiogroup">
          {FORMATS.map((f) => {
            const selected = f.format === format;
            return (
              <Pressable
                key={f.format}
                style={[s.segmentButton, selected && s.segmentButtonSelected]}
                onPress={() => setFormat(f.format)}
                disabled={!!busy}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
              >
                <Ionicons name={f.icon} size={20} color={selected ? colors.onPrimary : colors.textMuted} />
                <Text style={[s.segmentText, selected && s.segmentTextSelected]}>{f.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={s.actions}>
          {canShareReports ? (
            <>
              <Button
                label={label("email", "Envoyer par e-mail")}
                icon="mail-outline"
                onPress={() => run("email")}
                disabled={!!busy}
              />
              <Button
                label={label("share", "Partager (WhatsApp, SMS…)")}
                icon="share-outline"
                variant="secondary"
                onPress={() => run("share")}
                disabled={!!busy}
              />
            </>
          ) : null}
          <Button
            label={label("download", "Télécharger")}
            icon="download-outline"
            variant={canShareReports ? "secondary" : "primary"}
            onPress={() => run("download")}
            disabled={!!busy}
          />
        </View>
        <Text style={s.hint}>
          {canShareReports
            ? "E-mail : le message est déjà rédigé, il ne reste qu’à choisir le destinataire.\nTélécharger : enregistre le fichier dans le dossier de votre choix."
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
  formatLabel: { fontSize: font.body, fontWeight: "700", color: colors.text, marginBottom: 8 },
  segment: {
    flexDirection: "row",
    gap: 4,
    padding: 4,
    marginBottom: 14,
    borderRadius: radius.medium,
    backgroundColor: colors.background,
  },
  segmentButton: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    minHeight: 48,
    borderRadius: radius.small,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentButtonSelected: { backgroundColor: colors.primary },
  segmentText: { fontSize: font.body, fontWeight: "700", color: colors.textMuted },
  segmentTextSelected: { color: colors.onPrimary },
  actions: { gap: 10, marginBottom: 12 },
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
