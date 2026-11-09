import { formatTime, parseTime } from "@/domain/time";
import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, font } from "./theme";

const MINUTE_STEP = 5;

type Props = {
  label: string;
  /** "HH:MM" */
  value: string;
  onChange: (value: string) => void;
};

/** Heure réglée par boutons, comme un réveil : impossible de saisir un mauvais format. */
export function TimeField({ label, value, onChange }: Props) {
  const total = parseTime(value) ?? 0;
  const hours = Math.floor(total / 60);
  const minutes = total % 60;

  function setHours(next: number) {
    onChange(formatTime(((next + 24) % 24) * 60 + minutes));
  }

  function stepMinutes(direction: 1 | -1) {
    // Se cale d'abord sur le multiple de 5 voisin (ex. 12 → 15 ou 10).
    const next =
      direction === 1
        ? Math.floor(minutes / MINUTE_STEP) * MINUTE_STEP + MINUTE_STEP
        : Math.ceil(minutes / MINUTE_STEP) * MINUTE_STEP - MINUTE_STEP;
    onChange(formatTime(hours * 60 + ((next + 60) % 60)));
  }

  return (
    <View style={s.row}>
      <Text style={s.label}>{label}</Text>
      <View style={s.steppers}>
        <Stepper
          text={String(hours).padStart(2, "0")}
          unit="heures"
          field={label}
          onMinus={() => setHours(hours - 1)}
          onPlus={() => setHours(hours + 1)}
        />
        <Text style={s.colon}>:</Text>
        <Stepper
          text={String(minutes).padStart(2, "0")}
          unit="minutes"
          field={label}
          onMinus={() => stepMinutes(-1)}
          onPlus={() => stepMinutes(1)}
        />
      </View>
    </View>
  );
}

function Stepper(props: {
  text: string;
  unit: string;
  field: string;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <View style={s.stepper}>
      <TouchableOpacity
        style={s.stepButton}
        onPress={props.onMinus}
        accessibilityRole="button"
        accessibilityLabel={`${props.field} : moins de ${props.unit}`}
      >
        <Ionicons name="remove" size={22} color={colors.primary} />
      </TouchableOpacity>
      <Text style={s.value}>{props.text}</Text>
      <TouchableOpacity
        style={s.stepButton}
        onPress={props.onPlus}
        accessibilityRole="button"
        accessibilityLabel={`${props.field} : plus de ${props.unit}`}
      >
        <Ionicons name="add" size={22} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  row: { gap: 4 },
  label: { fontSize: font.small, color: colors.textMuted, fontWeight: "600" },
  steppers: { flexDirection: "row", alignItems: "center", gap: 6 },
  stepper: { flexDirection: "row", alignItems: "center", gap: 2 },
  stepButton: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    minWidth: 38,
    textAlign: "center",
    fontSize: font.title,
    fontWeight: "700",
    color: colors.text,
    fontVariant: ["tabular-nums"],
  },
  colon: { fontSize: font.title, fontWeight: "700", color: colors.text },
});
