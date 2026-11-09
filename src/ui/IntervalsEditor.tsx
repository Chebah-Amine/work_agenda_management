import { WorkInterval } from "@/domain/models/workDay";
import { formatDuration, formatTime, intervalMinutes, parseTime } from "@/domain/time";
import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Button } from "./Button";
import { colors, font } from "./theme";
import { TimeField } from "./TimeField";

type Props = {
  intervals: WorkInterval[];
  onChange: (intervals: WorkInterval[]) => void;
};

/** Nouveau créneau de 2 h, placé une heure après le dernier. */
function nextInterval(intervals: WorkInterval[]): WorkInterval {
  const lastEnd = Math.max(-1, ...intervals.map((i) => parseTime(i.end) ?? -1));
  const start = lastEnd < 0 ? 7 * 60 : Math.min(lastEnd + 60, 21 * 60);
  return { start: formatTime(start), end: formatTime(start + 120) };
}

export function IntervalsEditor({ intervals, onChange }: Props) {
  function update(index: number, patch: Partial<WorkInterval>) {
    onChange(intervals.map((interval, i) => (i === index ? { ...interval, ...patch } : interval)));
  }

  return (
    <View style={s.container}>
      {intervals.map((interval, index) => {
        const minutes = intervalMinutes(interval);
        return (
          <View key={index} style={s.card}>
            <View style={s.cardHeader}>
              <Text style={s.cardTitle}>
                Créneau {index + 1}
                {minutes > 0 ? `  ·  ${formatDuration(minutes)}` : ""}
              </Text>
              <TouchableOpacity
                style={s.remove}
                onPress={() => onChange(intervals.filter((_, i) => i !== index))}
                accessibilityRole="button"
                accessibilityLabel={`Supprimer le créneau ${index + 1}`}
              >
                <Ionicons name="trash-outline" size={22} color={colors.danger} />
              </TouchableOpacity>
            </View>
            <TimeField
              label="Début"
              value={interval.start}
              onChange={(start) => update(index, { start })}
            />
            <TimeField label="Fin" value={interval.end} onChange={(end) => update(index, { end })} />
          </View>
        );
      })}

      <Button
        label="Ajouter un créneau"
        icon="add-circle-outline"
        variant="secondary"
        onPress={() => onChange([...intervals, nextInterval(intervals)])}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { gap: 12 },
  card: {
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.background,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitle: { fontSize: font.body, fontWeight: "700", color: colors.text },
  remove: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.dangerLight,
    alignItems: "center",
    justifyContent: "center",
  },
});
