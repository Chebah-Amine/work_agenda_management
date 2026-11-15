import { formatTime, parseTime } from "@/domain/time";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { colors, font } from "./theme";

/** Délai avant que l'appui long ne fasse défiler la valeur, puis cadence du défilement. */
const REPEAT_DELAY_MS = 400;
const REPEAT_INTERVAL_MS = 80;

type Props = {
  label: string;
  /** "HH:MM" */
  value: string;
  onChange: (value: string) => void;
};

/**
 * Heure réglée à la minute près : on touche le nombre pour le taper au clavier,
 * ou on utilise + / − (appui long pour faire défiler). Le format reste toujours valide.
 */
export function TimeField({ label, value, onChange }: Props) {
  const total = parseTime(value) ?? 0;
  const hours = Math.floor(total / 60);
  const minutes = total % 60;

  function setHours(next: number) {
    onChange(formatTime(((next + 24) % 24) * 60 + minutes));
  }

  function setMinutes(next: number) {
    onChange(formatTime(hours * 60 + ((next + 60) % 60)));
  }

  return (
    <View style={s.row}>
      <Text style={s.label}>{label}</Text>
      <View style={s.steppers}>
        <Stepper
          value={hours}
          max={23}
          unit="heures"
          field={label}
          onChange={setHours}
        />
        <Text style={s.colon}>:</Text>
        <Stepper
          value={minutes}
          max={59}
          unit="minutes"
          field={label}
          onChange={setMinutes}
        />
      </View>
    </View>
  );
}

function Stepper(props: {
  value: number;
  max: number;
  unit: string;
  field: string;
  /** Reçoit la valeur voulue ; le parent gère le passage 59 → 00, 23 → 00, etc. */
  onChange: (next: number) => void;
}) {
  return (
    <View style={s.stepper}>
      <RepeatButton
        icon="remove"
        label={`${props.field} : moins de ${props.unit}`}
        onStep={() => props.onChange(props.value - 1)}
      />
      <NumberInput
        value={props.value}
        max={props.max}
        label={`${props.field} : ${props.unit}`}
        onChange={props.onChange}
      />
      <RepeatButton
        icon="add"
        label={`${props.field} : plus de ${props.unit}`}
        onStep={() => props.onChange(props.value + 1)}
      />
    </View>
  );
}

/**
 * Champ à deux chiffres, appliqué à chaque chiffre tapé (borné au maximum).
 *
 * On n'attend pas que le champ perde le focus : dans un formulaire, toucher + / −
 * ou un autre bouton laisse le clavier ouvert, et la saisie ne serait jamais appliquée.
 */
function NumberInput(props: {
  value: number;
  max: number;
  label: string;
  onChange: (next: number) => void;
}) {
  const shown = String(props.value).padStart(2, "0");
  // Texte en cours de frappe, et la valeur qu'il représente.
  const [draft, setDraft] = useState<{ text: string; value: number } | null>(null);
  // Le texte tapé n'est affiché que s'il correspond encore à la valeur réelle :
  // si + / − la change pendant la saisie, le champ réaffiche la valeur à jour.
  const typing = draft !== null && draft.value === props.value;

  function handleChangeText(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 2);
    if (digits === "") {
      setDraft({ text: "", value: props.value });
      return;
    }
    const next = Math.min(Number(digits), props.max);
    setDraft({ text: Number(digits) > props.max ? String(props.max) : digits, value: next });
    if (next !== props.value) props.onChange(next);
  }

  return (
    <TextInput
      style={s.value}
      value={typing ? draft.text : shown}
      onFocus={() => setDraft({ text: "", value: props.value })}
      onChangeText={handleChangeText}
      onBlur={() => setDraft(null)}
      onSubmitEditing={() => setDraft(null)}
      maxFontSizeMultiplier={1.4}
      placeholder={shown}
      placeholderTextColor={colors.textMuted}
      keyboardType="number-pad"
      returnKeyType="done"
      maxLength={2}
      selectTextOnFocus
      accessibilityLabel={props.label}
    />
  );
}

function RepeatButton(props: {
  icon: "add" | "remove";
  label: string;
  onStep: () => void;
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // L'appui long rappelle onStep en boucle : on garde la version du dernier rendu,
  // qui connaît la valeur à jour.
  const onStep = useRef(props.onStep);
  useEffect(() => {
    onStep.current = props.onStep;
  });

  function stop() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }

  function startRepeat() {
    const repeat = () => {
      onStep.current();
      timer.current = setTimeout(repeat, REPEAT_INTERVAL_MS);
    };
    repeat();
  }

  useEffect(() => stop, []);

  return (
    <TouchableOpacity
      style={s.stepButton}
      // Appui court : un pas. Appui long : défilement jusqu'au relâchement.
      onPress={() => onStep.current()}
      onLongPress={startRepeat}
      delayLongPress={REPEAT_DELAY_MS}
      onPressOut={stop}
      accessibilityRole="button"
      accessibilityLabel={props.label}
    >
      <Ionicons name={props.icon} size={22} color={colors.primary} />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  row: { gap: 4 },
  label: { fontSize: font.small, color: colors.textMuted, fontWeight: "600" },
  // Largeurs souples : le champ tient dans la place disponible, du petit téléphone
  // (360 points de large, dans une carte de formulaire) à la tablette.
  steppers: { flexDirection: "row", alignItems: "center", gap: 4 },
  stepper: { flex: 1, maxWidth: 180, flexDirection: "row", alignItems: "center", gap: 2 },
  stepButton: {
    width: 40,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    flex: 1,
    // Sans minWidth: 0, un champ de texte refuse de rétrécir (notamment sur le web).
    minWidth: 0,
    height: 44,
    paddingVertical: 4,
    paddingHorizontal: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    textAlign: "center",
    fontSize: font.title,
    fontWeight: "700",
    color: colors.text,
    fontVariant: ["tabular-nums"],
  },
  colon: { fontSize: font.title, fontWeight: "700", color: colors.text },
});
