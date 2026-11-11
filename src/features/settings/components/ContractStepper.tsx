import { LEGAL_WEEKLY_MINUTES } from "@/domain/models/workSettings";
import { formatDuration } from "@/domain/time";
import { colors, font, radius } from "@/ui/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";

const STEP = 30;
const MIN = 30;
const MAX = LEGAL_WEEKLY_MINUTES;

type Props = {
  /** Heures hebdomadaires du contrat, en minutes. */
  minutes: number;
  onChange: (minutes: number) => void;
};

/** Heures par semaine du contrat, réglées par gros boutons − / + (pas de 30 minutes). */
export function ContractStepper({ minutes, onChange }: Props) {
  return (
    <View style={s.stepper}>
      <StepButton
        icon="remove"
        label="Moins d'heures par semaine"
        disabled={minutes <= MIN}
        onPress={() => onChange(Math.max(MIN, minutes - STEP))}
      />
      <View style={s.value}>
        <Text style={s.number}>{formatDuration(minutes)}</Text>
        <Text style={s.unit}>par semaine</Text>
      </View>
      <StepButton
        icon="add"
        label="Plus d'heures par semaine"
        disabled={minutes >= MAX}
        onPress={() => onChange(Math.min(MAX, minutes + STEP))}
      />
    </View>
  );
}

function StepButton(props: {
  icon: "add" | "remove";
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [s.button, pressed && s.pressed, props.disabled && s.disabled]}
      onPress={props.onPress}
      disabled={props.disabled}
      accessibilityRole="button"
      accessibilityLabel={props.label}
      accessibilityState={{ disabled: props.disabled }}
    >
      <Ionicons name={props.icon} size={30} color={colors.primary} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  stepper: { flexDirection: "row", alignItems: "center", gap: 12 },
  value: { flex: 1, alignItems: "center" },
  number: {
    fontSize: 34,
    fontWeight: "800",
    color: colors.text,
    fontVariant: ["tabular-nums"],
  },
  unit: { fontSize: font.small, color: colors.textMuted },
  button: {
    width: 60,
    height: 60,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.35 },
});
