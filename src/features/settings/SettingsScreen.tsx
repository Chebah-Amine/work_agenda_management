import { WEEKDAY_SHORT } from "@/domain/date";
import { WorkSettings } from "@/domain/models/workSettings";
import { formatDuration, sortIntervals, totalMinutes, validateIntervals } from "@/domain/time";
import { useAppData } from "@/state/AppDataContext";
import { Button } from "@/ui/Button";
import { IntervalsEditor } from "@/ui/IntervalsEditor";
import { LoadingView } from "@/ui/LoadingView";
import { colors, font } from "@/ui/theme";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export function SettingsScreen() {
  const { data, saveSettings } = useAppData();
  if (!data) return <LoadingView />;
  return <SettingsForm initial={data.settings} onSave={saveSettings} />;
}

type FormProps = { initial: WorkSettings; onSave: (settings: WorkSettings) => Promise<void> };

function SettingsForm({ initial, onSave }: FormProps) {
  const [name, setName] = useState(initial.employeeName);
  const [weeklyHours, setWeeklyHours] = useState(
    String(initial.weeklyContractMinutes / 60).replace(".", ",")
  );
  const [workingDays, setWorkingDays] = useState(initial.workingDays);
  const [intervals, setIntervals] = useState(initial.defaultIntervals);
  const [saved, setSaved] = useState(false);

  const weekly = Number(weeklyHours.replace(",", "."));
  const error =
    !Number.isFinite(weekly) || weekly <= 0 || weekly > 48
      ? "Indiquez le nombre d'heures par semaine du contrat (par exemple 20)."
      : workingDays.length === 0
        ? "Choisissez au moins un jour travaillé."
        : validateIntervals(intervals);

  /** Toute modification masque le message « enregistré ». */
  function edit<T>(setter: (value: T) => void) {
    return (value: T) => {
      setSaved(false);
      setter(value);
    };
  }

  async function save() {
    if (error) return;
    await onSave({
      employeeName: name.trim(),
      weeklyContractMinutes: Math.round(weekly * 60),
      workingDays: [...workingDays].sort(),
      defaultIntervals: sortIntervals(intervals),
    });
    setSaved(true);
  }

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={s.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={s.section}>
        <Text style={s.label}>Nom (affiché sur le rapport)</Text>
        <TextInput
          style={s.input}
          value={name}
          onChangeText={edit(setName)}
          placeholder="Prénom Nom"
          placeholderTextColor={colors.textMuted}
        />
      </View>

      <View style={s.section}>
        <Text style={s.label}>Heures par semaine prévues au contrat</Text>
        <TextInput
          style={s.input}
          keyboardType="decimal-pad"
          value={weeklyHours}
          onChangeText={edit(setWeeklyHours)}
        />
        <Text style={s.help}>
          Au-delà, les heures de la semaine sont comptées en heures complémentaires (puis
          supplémentaires après 35 h).
        </Text>
      </View>

      <View style={s.section}>
        <Text style={s.label}>Jours habituellement travaillés</Text>
        <View style={s.days}>
          {WEEKDAY_SHORT.map((day, i) => {
            const selected = workingDays.includes(i + 1);
            return (
              <TouchableOpacity
                key={day}
                style={[s.dayButton, selected && s.dayButtonSelected]}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() =>
                  edit(setWorkingDays)(
                    selected ? workingDays.filter((d) => d !== i + 1) : [...workingDays, i + 1]
                  )
                }
              >
                <Text style={[s.dayText, selected && s.dayTextSelected]}>{day}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.label}>
          Journée habituelle ({formatDuration(totalMinutes(intervals))})
        </Text>
        <Text style={s.help}>
          Ces créneaux sont proposés d’office quand vous touchez un jour vide du calendrier.
        </Text>
        <IntervalsEditor intervals={intervals} onChange={edit(setIntervals)} />
      </View>

      {error ? <Text style={s.error}>{error}</Text> : null}
      {saved ? <Text style={s.saved}>Réglages enregistrés.</Text> : null}
      <Button label="Enregistrer" icon="checkmark" onPress={save} disabled={!!error} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 22, paddingBottom: 32 },
  section: { gap: 8 },
  label: { fontSize: font.body, fontWeight: "700", color: colors.text },
  help: { fontSize: font.small, color: colors.textMuted },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: font.large,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  days: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  dayButton: {
    minWidth: 56,
    minHeight: 48,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  dayButtonSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayText: { fontSize: font.body, fontWeight: "600", color: colors.text },
  dayTextSelected: { color: "#FFFFFF" },
  error: { fontSize: font.body, fontWeight: "600", color: colors.danger },
  saved: { fontSize: font.body, fontWeight: "600", color: colors.success },
});
