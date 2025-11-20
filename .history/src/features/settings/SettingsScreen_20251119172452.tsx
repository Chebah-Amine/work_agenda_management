import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { settingsStyles as s } from "./SettingsStyles";
import { useSettings } from "./useSettings";

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export function SettingsScreen() {
  const { settings, saveSettings, loading } = useSettings();

  // ⚙️ Initialisation du formulaire
  const { control, setValue, handleSubmit } = useForm({
    defaultValues: {
      monthly: "",
      daily: "",
      workingDays: [] as number[],
    },
  });

  // 🧲 Synchronise les settings dès qu'ils sont chargés
  useEffect(() => {
    if (!loading) {
      setValue("monthly", String(settings.baseMonthlyMinutes / 60));
      setValue("daily", String(settings.baseDailyMinutes / 60));
      setValue("workingDays", settings.workingDays);
    }
  }, [loading]);

  const onSubmit = (data: any) => {
    saveSettings({
      baseMonthlyMinutes: Number(data.monthly) * 60,
      baseDailyMinutes: Number(data.daily) * 60,
      workingDays: data.workingDays,
    });
  };

  if (loading) {
    return (
      <View style={[s.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={s.container}>
      <Text style={s.sectionTitle}>Paramètres horaires</Text>

      {/* Heures mensuelles */}
      <Text style={s.label}>Heures mensuelles prévues</Text>
      <Controller
        control={control}
        name="monthly"
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={s.input}
            keyboardType="numeric"
            value={value}
            onChangeText={onChange}
            {required}
          />
        )}
      />

      {/* Heures quotidiennes */}
      <Text style={s.label}>Heures quotidiennes prévues</Text>
      <Controller
        control={control}
        name="daily"
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={s.input}
            keyboardType="numeric"
            value={value}
            onChangeText={onChange}
          />
        )}
      />

      {/* Jours travaillés */}
      <Text style={s.label}>Jours travaillés</Text>

      <Controller
        control={control}
        name="workingDays"
        render={({ field: { value, onChange } }) => (
          <View style={s.daysContainer}>
            {DAYS.map((day, i) => {
              const selected = value.includes(i + 1);
              return (
                <TouchableOpacity
                  key={day}
                  style={[s.dayButton, selected && s.dayButtonSelected]}
                  onPress={() => {
                    if (selected) {
                      onChange(value.filter((d: number) => d !== i + 1));
                    } else {
                      onChange([...value, i + 1]);
                    }
                  }}
                >
                  <Text style={[s.dayText, selected && s.dayTextSelected]}>{day}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      />

      {/* Enregistrer */}
      <TouchableOpacity style={s.saveButton} onPress={handleSubmit(onSubmit)}>
        <Text style={s.saveText}>Enregistrer</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
