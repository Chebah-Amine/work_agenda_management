import { formatMonthLabel } from "@/domain/date";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, font, radius, shadow } from "./theme";

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
        <NavButton icon="chevron-back" label="Mois précédent" onPress={() => onShift(-1)} />
        <Text style={s.title}>{formatMonthLabel(year, month)}</Text>
        <NavButton icon="chevron-forward" label="Mois suivant" onPress={() => onShift(1)} />
      </View>
      {!isCurrent && (
        <Pressable onPress={onToday} accessibilityRole="button" style={s.today}>
          <Ionicons name="return-up-back" size={18} color={colors.primary} />
          <Text style={s.todayText}>Revenir au mois en cours</Text>
        </Pressable>
      )}
    </View>
  );
}

function NavButton(props: { icon: "chevron-back" | "chevron-forward"; label: string; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [s.navButton, pressed && s.navButtonPressed]}
      onPress={props.onPress}
      accessibilityRole="button"
      accessibilityLabel={props.label}
    >
      <Ionicons name={props.icon} size={26} color={colors.primary} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  container: { gap: 8 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: font.title, fontWeight: "800", color: colors.text },
  navButton: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    boxShadow: shadow.card,
    alignItems: "center",
    justifyContent: "center",
  },
  navButtonPressed: { backgroundColor: colors.primaryLight },
  today: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryLight,
  },
  todayText: { fontSize: font.small, color: colors.primary, fontWeight: "700" },
});
