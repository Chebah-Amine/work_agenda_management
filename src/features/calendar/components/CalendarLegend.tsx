import { colors, font } from "@/ui/theme";
import { StyleSheet, Text, View } from "react-native";

const ITEMS = [
  { color: colors.dayWorked, label: "Travaillé" },
  { color: colors.dayMissing, label: "À saisir" },
  { color: colors.dayAbsent, label: "Absence" },
  { color: colors.dayHoliday, label: "Férié" },
];

export function CalendarLegend() {
  return (
    <View style={s.container}>
      {ITEMS.map((item) => (
        <View key={item.label} style={s.item}>
          <View style={[s.swatch, { backgroundColor: item.color }]} />
          <Text style={s.label}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flexDirection: "row", flexWrap: "wrap", columnGap: 16, rowGap: 6 },
  item: { flexDirection: "row", alignItems: "center", gap: 6 },
  swatch: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: { fontSize: font.small, color: colors.textMuted },
});
