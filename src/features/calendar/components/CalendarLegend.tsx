import { colors, font, radius } from "@/ui/theme";
import { StyleSheet, Text, View } from "react-native";

const ITEMS = [
  { color: colors.dayWorked, label: "Travaillé" },
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
      <View style={s.item}>
        <View style={s.dot} />
        <Text style={s.label}>À saisir</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    columnGap: 16,
    rowGap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  item: { flexDirection: "row", alignItems: "center", gap: 6 },
  swatch: { width: 16, height: 16, borderRadius: 5 },
  dot: {
    width: 8,
    height: 8,
    marginHorizontal: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.warning,
  },
  label: { fontSize: font.small, color: colors.textMuted, fontWeight: "600" },
});
