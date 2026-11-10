import {
  WEEKDAY_SHORT,
  formatLongDate,
  getFrenchHolidayName,
  toDateKey,
  weekdayIndex,
} from "@/domain/date";
import { DayOffReason, WorkDay, dayOffLabel } from "@/domain/models/workDay";
import { formatDuration, totalMinutes } from "@/domain/time";
import { colors, font, radius } from "@/ui/theme";
import { Pressable, StyleSheet, Text, View } from "react-native";

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

/** Libellés assez courts pour tenir dans une case. */
const ABSENCE_CAPTION: Record<DayOffReason, string> = {
  repos: "Repos",
  maladie: "Mal.",
  conge: "Congé",
  autre: "Abs.",
};

type CellInfo = {
  background: string;
  color: string;
  caption: string;
  /** Jour habituellement travaillé, déjà passé, sans saisie. */
  missing?: boolean;
  description: string;
};

function describeDay(
  date: Date,
  day: WorkDay | undefined,
  workingDays: number[],
  todayKey: string
): CellInfo {
  if (day?.status === "WORKED") {
    const minutes = totalMinutes(day.intervals);
    return {
      background: colors.dayWorked,
      color: colors.dayWorkedText,
      caption: compactDuration(minutes),
      description: `${formatDuration(minutes)} travaillées`,
    };
  }
  if (day?.status === "NOT_WORKED") {
    const label = dayOffLabel(day.dayOffReason);
    return {
      background: colors.dayAbsent,
      color: colors.dayAbsentText,
      caption: ABSENCE_CAPTION[day.dayOffReason ?? "repos"],
      description: label,
    };
  }
  const holiday = getFrenchHolidayName(date);
  if (holiday) {
    return {
      background: colors.dayHoliday,
      color: colors.dayHolidayText,
      caption: "Férié",
      description: `Férié, ${holiday}`,
    };
  }
  const isWorkingDay = workingDays.includes(weekdayIndex(date));
  if (isWorkingDay && toDateKey(date) <= todayKey) {
    return {
      background: colors.surfaceMuted,
      color: colors.text,
      caption: "",
      missing: true,
      description: "à saisir",
    };
  }
  return {
    background: colors.surfaceMuted,
    color: isWorkingDay ? colors.text : colors.textMuted,
    caption: "",
    description: "rien de saisi",
  };
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
            const isToday = key === todayKey;

            return (
              <Pressable
                key={j}
                style={({ pressed }) => [
                  s.dayCell,
                  { backgroundColor: selected ? colors.dayRange : info.background },
                  isToday && s.today,
                  selected && s.selected,
                  pressed && s.pressed,
                ]}
                onPress={() => onDayPress(date)}
                accessibilityRole="button"
                accessibilityLabel={`${formatLongDate(date)}, ${info.description}${isToday ? ", aujourd'hui" : ""}`}
              >
                <Text style={[s.dayNumber, { color: info.color }]}>{date.getDate()}</Text>
                {info.missing ? (
                  <View style={s.captionSlot}>
                    <View style={s.missingDot} />
                  </View>
                ) : (
                  <Text style={[s.caption, { color: info.color }]} numberOfLines={1}>
                    {info.caption}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  grid: { gap: 6 },
  weekRow: { flexDirection: "row", gap: 6 },
  weekHeaderCell: {
    flex: 1,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    paddingBottom: 2,
  },
  emptyCell: { flex: 1 },
  dayCell: {
    flex: 1,
    minHeight: 60,
    borderRadius: radius.small,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  today: { borderColor: colors.primary },
  selected: { borderColor: colors.primary },
  pressed: { opacity: 0.7 },
  dayNumber: { fontSize: font.body, fontWeight: "700" },
  caption: { fontSize: 12, fontWeight: "700", height: 16, lineHeight: 16 },
  captionSlot: { height: 16, justifyContent: "center" },
  missingDot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.warning,
  },
});
