import { useState } from "react";
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { settingsStyles as s } from "./SettingsStyles";
import { useSettings } from "./useSettings";

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export function SettingsScreen() {
  const { settings, saveSettings, loading } = useSettings();
  
    
  const [monthly, setMonthly] = useState(String(settings.baseMonthlyMinutes / 60));
  const [daily, setDaily] = useState(String(settings.baseDailyMinutes / 60));
  const [workingDays, setWorkingDays] = useState(settings.workingDays);

  if (loading) {
    return (
      <View style={[s.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  function toggleDay(index: number) {
    setWorkingDays((prev) =>
      prev.includes(index + 1)
        ? prev.filter((d) => d !== index + 1)
        : [...prev, index + 1]
    );
  }

  function onSave() {
    saveSettings({
      baseMonthlyMinutes: Number(monthly) * 60,
      baseDailyMinutes: Number(daily) * 60,
      workingDays,
    });
  }

  return (
    <ScrollView contentContainerStyle={s.container}>
      <Text style={s.sectionTitle}>Paramètres horaires</Text>

      <Text style={s.label}>Heures mensuelles prévues</Text>
      <TextInput
        style={s.input}
        keyboardType="numeric"
        value={monthly}
        onChangeText={setMonthly}
      />

      <Text style={s.label}>Heures quotidiennes prévues</Text>
      <TextInput
        style={s.input}
        keyboardType="numeric"
        value={daily}
        onChangeText={setDaily}
      />

      <Text style={s.label}>Jours travaillés</Text>
      <View style={s.daysContainer}>
        {DAYS.map((day, i) => {
          const selected = workingDays.includes(i + 1);
          return (
            <TouchableOpacity
              key={day}
              style={[s.dayButton, selected && s.dayButtonSelected]}
              onPress={() => toggleDay(i)}
            >
              <Text style={[s.dayText, selected && s.dayTextSelected]}>{day}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={s.saveButton} onPress={onSave}>
        <Text style={s.saveText}>Enregistrer</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
