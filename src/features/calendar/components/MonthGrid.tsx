import {
  WEEKDAY_SHORT,
  formatLongDate,
  getFrenchHolidayName,
  toDateKey,
  weekdayIndex,
} from "@/domain/date";
import { WorkDay, dayOffLabel } from "@/domain/models/workDay";
import { formatDuration, totalMinutes } from "@/domain/time";
import { colors, font } from "@/ui/theme";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  monthMatrix: (Date | null)[][];
  workDays: Record<string, WorkDay>;
  workingDays: number[];
  /** Clés des jours de l'intervalle en cours de sélection. */
  selectedKeys: Set<string>;
  onDayPress: (date: Date) => void;
};

/** 255 → "4h15", 240 → "4h" */
function compactDuration(minutes: number): string {
  const m = minutes % 60;
  return `${Math.floor(minutes / 60)}h${m ? String(m).padStart(2, "0") : ""}`;
}

type CellInfo = { color: string; caption: string; description: string };

function describeDay(date: Date, day: WorkDay | undefined, workingDays: number[], todayKey: string): CellInfo {
  const holiday = getFrenchHolidayName(date);

  if (day?.status === "WORKED") {
    const minutes = totalMinutes(day.intervals);
    return {
      color: colors.dayWorked,
      caption: compactDuration(minutes),
      description: `${formatDuration(minutes)} travaillées`,
    };
  }
  if (day?.status === "NOT_WORKED") {
    const label = dayOffLabel(day.dayOffReason);
    return { color: colors.dayAbsent, caption: label.slice(0, 5), description: label };
  }
  if (holiday) {
    return { color: colors.dayHoliday, caption: "Férié", description: `Férié, ${holiday}` };
  }
  const expected = workingDays.includes(weekdayIndex(date)) && toDateKey(date) <= todayKey;
  if (expected) {
    return { color: colors.dayMissing, caption: "?", description: "à saisir" };
  }
  return { color: colors.surface, caption: "", description: "rien de saisi" };
}

export function MonthGrid({ monthMatrix, workDays, workingDays, selectedKeys, onDayPress }: Props) {
  const todayKey = toDateKey(new Date());

  return (
    <View style={s.grid}>
      <View style={s.weekRow}>
        {WEEKDAY_SHORT.map((d) => (
          <Text key={d} style={s.weekHeaderCell}>
            {d}
          </Text>
        ))}
      </View>

      {monthMatrix.map((week, i) => (
        <View key={i} style={s.weekRow}>
          {week.map((date, j) => {
            if (!date) return <View key={j} style={s.emptyCell} />;

            const key = toDateKey(date);
            const info = describeDay(date, workDays[key], workingDays, todayKey);
            const selected = selectedKeys.has(key);

            return (
              <TouchableOpacity
                key={j}
                style={[
                  s.dayCell,
                  { backgroundColor: info.color },
                  key === todayKey && s.today,
                  selected && s.selected,
                ]}
                onPress={() => onDayPress(date)}
                accessibilityRole="button"
                accessibilityLabel={`${formatLongDate(date)}, ${info.description}`}
              >
                <Text style={s.dayNumber}>{date.getDate()}</Text>
                <Text style={s.caption} numberOfLines={1}>
                  {info.caption}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  grid: { gap: 5 },
  weekRow: { flexDirection: "row", gap: 5 },
  weekHeaderCell: {
    flex: 1,
    textAlign: "center",
    fontSize: font.small,
    fontWeight: "700",
    color: colors.textMuted,
  },
  emptyCell: { flex: 1 },
  dayCell: {
    flex: 1,
    minHeight: 58,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.borderLight,
  },
  today: { borderColor: colors.text },
  selected: { borderColor: colors.primary, backgroundColor: colors.dayRange },
  dayNumber: { fontSize: font.body, fontWeight: "700", color: colors.text },
  caption: { fontSize: 12, fontWeight: "600", color: colors.textMuted, minHeight: 16 },
});
