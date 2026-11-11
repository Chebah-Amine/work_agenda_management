import { WEEKDAY_LONG, WEEKDAY_SHORT } from "@/domain/date";
import { colors, radius } from "@/ui/theme";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  /** Jours travaillés : 1 = lundi … 7 = dimanche. */
  days: number[];
  onChange: (days: number[]) => void;
};

/** Les sept jours de la semaine, à cocher ou décocher d'un toucher. */
export function WorkingDaysPicker({ days, onChange }: Props) {
  return (
    <View style={s.days}>
      {WEEKDAY_SHORT.map((label, i) => {
        const day = i + 1;
        const selected = days.includes(day);
        return (
          <Pressable
            key={label}
            style={[s.day, selected && s.daySelected]}
            onPress={() => onChange(selected ? days.filter((d) => d !== day) : [...days, day])}
            accessibilityRole="checkbox"
            accessibilityLabel={WEEKDAY_LONG[i]}
            accessibilityState={{ checked: selected }}
          >
            <Text style={[s.dayText, selected && s.dayTextSelected]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  days: { flexDirection: "row", gap: 6 },
  day: {
    flex: 1,
    height: 52,
    borderRadius: radius.medium,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 2,
    borderColor: colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  daySelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayText: { fontSize: 15, fontWeight: "700", color: colors.textMuted },
  dayTextSelected: { color: colors.onPrimary },
});
