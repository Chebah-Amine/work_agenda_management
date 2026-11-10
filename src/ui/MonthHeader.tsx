import { formatMonthLabel } from "@/domain/date";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, font } from "./theme";

export type YearMonth = { year: number; month: number };

export function currentYearMonth(): YearMonth {
  const today = new Date();
  return { year: today.getFullYear(), month: today.getMonth() };
}

/** Mois affiché + navigation (le passage décembre → janvier change aussi l'année). */
export function useYearMonth() {
  const [value, setValue] = useState<YearMonth>(currentYearMonth);

  function shift(offset: number) {
    setValue((prev) => {
      const d = new Date(prev.year, prev.month + offset, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  return { ...value, shift, goToToday: () => setValue(currentYearMonth()) };
}

type Props = YearMonth & {
  onShift: (offset: number) => void;
  onToday: () => void;
};

export function MonthHeader({ year, month, onShift, onToday }: Props) {
  const now = currentYearMonth();
  const isCurrent = now.year === year && now.month === month;

  return (
    <View style={s.container}>
      <View style={s.row}>
        <TouchableOpacity
          style={s.navButton}
          onPress={() => onShift(-1)}
          accessibilityRole="button"
          accessibilityLabel="Mois précédent"
        >
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.title}>{formatMonthLabel(year, month)}</Text>
        <TouchableOpacity
          style={s.navButton}
          onPress={() => onShift(1)}
          accessibilityRole="button"
          accessibilityLabel="Mois suivant"
        >
          <Ionicons name="chevron-forward" size={26} color={colors.text} />
        </TouchableOpacity>
      </View>
      {!isCurrent && (
        <TouchableOpacity onPress={onToday} accessibilityRole="button" style={s.today}>
          <Text style={s.todayText}>Revenir au mois en cours</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { gap: 4 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: font.title, fontWeight: "700", color: colors.text },
  navButton: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  today: { alignSelf: "center", paddingVertical: 8, paddingHorizontal: 12 },
  todayText: { fontSize: font.body, color: colors.primary, fontWeight: "600" },
});
