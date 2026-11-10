import {
  formatLongDate,
  formatShortDate,
  getDateRange,
  getFrenchHolidayName,
  getMonthMatrix,
  toDateKey,
  weekdayIndex,
} from "@/domain/date";
import { summarizeMonth } from "@/domain/overtime";
import { useAppData } from "@/state/AppDataContext";
import { Button } from "@/ui/Button";
import { DayDraft, DayEditorModal } from "@/ui/DayEditorModal";
import { LoadingView } from "@/ui/LoadingView";
import { MonthHeader, useYearMonth } from "@/ui/MonthHeader";
import { colors, font } from "@/ui/theme";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { CalendarLegend } from "./components/CalendarLegend";
import { MonthGrid } from "./components/MonthGrid";
import { MonthSummaryCard } from "./components/MonthSummaryCard";

/** Saisie en cours : un seul jour, ou plusieurs jours d'un coup. */
type Editing = { kind: "day"; date: Date } | { kind: "range"; dates: Date[] };

/** Sélection de plusieurs jours : on attend le premier jour, puis le dernier. */
type RangePick = { start: Date | null; message?: string };

export function CalendarScreen() {
  const { data, saveDays, deleteDays } = useAppData();
  const { year, month, shift, goToToday } = useYearMonth();
  const [editing, setEditing] = useState<Editing | null>(null);
  const [rangePick, setRangePick] = useState<RangePick | null>(null);

  if (!data) return <LoadingView />;
  const { settings, workDays } = data;

  const summary = summarizeMonth(year, month, workDays, settings.weeklyContractMinutes);

  function closeEditor() {
    setEditing(null);
    setRangePick(null);
  }

  function handleDayPress(date: Date) {
    if (!rangePick) {
      setEditing({ kind: "day", date });
      return;
    }
    if (!rangePick.start) {
      setRangePick({ start: date });
      return;
    }
    // Seuls les jours habituellement travaillés et non fériés sont remplis.
    const dates = getDateRange(rangePick.start, date).filter(
      (d) => settings.workingDays.includes(weekdayIndex(d)) && !getFrenchHolidayName(d)
    );
    if (dates.length === 0) {
      setRangePick({
        start: null,
        message: "Aucun jour travaillé entre ces deux dates. Choisissez à nouveau le premier jour.",
      });
      return;
    }
    setEditing({ kind: "range", dates });
  }

  async function handleSave(draft: DayDraft) {
    if (!editing) return;
    const dates = editing.kind === "day" ? [editing.date] : editing.dates;
    await saveDays(dates.map((date) => ({ ...draft, date: toDateKey(date) })));
    closeEditor();
  }

  async function handleDelete() {
    if (editing?.kind !== "day") return;
    await deleteDays([toDateKey(editing.date)]);
    closeEditor();
  }

  const selectedKeys = new Set(
    editing?.kind === "range"
      ? editing.dates.map(toDateKey)
      : rangePick?.start
        ? [toDateKey(rangePick.start)]
        : []
  );

  const editedDay = editing?.kind === "day" ? workDays[toDateKey(editing.date)] : undefined;
  const holiday = editing?.kind === "day" ? getFrenchHolidayName(editing.date) : null;

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <MonthHeader year={year} month={month} onShift={shift} onToday={goToToday} />

      {rangePick ? (
        <View style={s.rangeBanner}>
          <Text style={s.rangeText}>
            {rangePick.message ??
              (rangePick.start
                ? `Premier jour : ${formatShortDate(rangePick.start)}. Touchez maintenant le dernier jour.`
                : "Touchez le premier jour à remplir.")}
          </Text>
          <Button label="Annuler" variant="secondary" onPress={() => setRangePick(null)} />
        </View>
      ) : (
        <Button
          label="Remplir plusieurs jours d'un coup"
          icon="calendar-outline"
          variant="secondary"
          onPress={() => setRangePick({ start: null })}
        />
      )}

      <MonthGrid
        monthMatrix={getMonthMatrix(year, month)}
        workDays={workDays}
        workingDays={settings.workingDays}
        selectedKeys={selectedKeys}
        onDayPress={handleDayPress}
      />
      <CalendarLegend />

      <MonthSummaryCard summary={summary} contractMinutes={settings.weeklyContractMinutes} />

      <DayEditorModal
        visible={!!editing}
        title={
          editing?.kind === "range"
            ? `Du ${formatShortDate(editing.dates[0])} au ${formatShortDate(editing.dates.at(-1)!)}`
            : editing
              ? formatLongDate(editing.date)
              : ""
        }
        subtitle={
          editing?.kind === "range"
            ? `La même saisie sera appliquée aux ${editing.dates.length} jours travaillés de cette période (hors jours fériés).`
            : holiday
              ? `Jour férié : ${holiday}`
              : undefined
        }
        initial={editedDay}
        defaultIntervals={settings.defaultIntervals}
        saveLabel={
          editing?.kind === "range" ? `Appliquer aux ${editing.dates.length} jours` : "Enregistrer"
        }
        onSave={handleSave}
        onDelete={editedDay ? handleDelete : undefined}
        onClose={closeEditor}
      />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 14, gap: 14, paddingBottom: 32 },
  rangeBanner: {
    padding: 12,
    gap: 10,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
  },
  rangeText: { fontSize: font.body, fontWeight: "600", color: colors.text },
});
