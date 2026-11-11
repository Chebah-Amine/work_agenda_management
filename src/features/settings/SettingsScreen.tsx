import { LEGAL_WEEKLY_MINUTES, WorkSettings } from "@/domain/models/workSettings";
import { formatDuration, totalMinutes } from "@/domain/time";
import { isScanConfigured } from "@/services/scan/scanNotes";
import { useAppData } from "@/state/AppDataContext";
import { Button } from "@/ui/Button";
import { Card, CardHeader } from "@/ui/Card";
import { IntervalsEditor } from "@/ui/IntervalsEditor";
import { LoadingView } from "@/ui/LoadingView";
import { colors, font, radius, spacing } from "@/ui/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { ContractStepper } from "./components/ContractStepper";
import { WorkingDaysPicker } from "./components/WorkingDaysPicker";
import { normalizeSettingsDraft as normalize, settingsDraftError } from "./settingsDraft";


export function SettingsScreen() {
  const { data, saveSettings, updateData } = useAppData();
  if (!data) return <LoadingView />;
  return (
    <SettingsForm
      saved={data.settings}
      onSave={saveSettings}
      onReplayOnboarding={() => updateData((current) => ({ ...current, needsOnboarding: true }))}
    />
  );
}

type FormProps = {
  saved: WorkSettings;
  onSave: (settings: WorkSettings) => Promise<void>;
  onReplayOnboarding: () => void;
};

function SettingsForm({ saved, onSave, onReplayOnboarding }: FormProps) {
  const [draft, setDraft] = useState(saved);
  const [justSaved, setJustSaved] = useState(false);
  const router = useRouter();

  const dirty = JSON.stringify(normalize(draft)) !== JSON.stringify(normalize(saved));
  const error = settingsDraftError(draft);

  // Le message « enregistré » s'efface tout seul.
  useEffect(() => {
    if (!justSaved) return;
    const timer = setTimeout(() => setJustSaved(false), 3000);
    return () => clearTimeout(timer);
  }, [justSaved]);

  function change(patch: Partial<WorkSettings>) {
    setJustSaved(false);
    setDraft({ ...draft, ...patch });
  }

  async function save() {
    if (error) return;
    const next = normalize(draft);
    await onSave(next);
    setDraft(next);
    setJustSaved(true);
  }

  const contract = draft.weeklyContractMinutes;
  const dayMinutes = totalMinutes(draft.defaultIntervals);
  const usualWeek = dayMinutes * draft.workingDays.length;

  return (
    <View style={s.screen}>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <Card>
          <CardHeader
            icon="person"
            title="Mon nom"
            subtitle="Il apparaît en haut du rapport mensuel."
          />
          <TextInput
            style={s.input}
            value={draft.employeeName}
            onChangeText={(employeeName) => change({ employeeName })}
            placeholder="Prénom Nom"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="words"
            autoCorrect={false}
            accessibilityLabel="Mon nom"
          />
        </Card>

        <Card>
          <CardHeader
            icon="document-text"
            title="Mon contrat"
            subtitle="Nombre d'heures prévues chaque semaine."
          />
          <ContractStepper
            minutes={contract}
            onChange={(weeklyContractMinutes) => change({ weeklyContractMinutes })}
          />
          <View style={s.rules}>
            <Rule color={colors.success} limit={formatDuration(contract)} text="heures normales" />
            {contract < LEGAL_WEEKLY_MINUTES && (
              <>
                <Rule
                  color={colors.warning}
                  limit={formatDuration(Math.min(contract * 1.1, LEGAL_WEEKLY_MINUTES))}
                  text="complémentaires à +10 %"
                />
                {contract * 1.1 < LEGAL_WEEKLY_MINUTES && (
                  <Rule
                    color={colors.warning}
                    limit={formatDuration(LEGAL_WEEKLY_MINUTES)}
                    text="complémentaires à +25 %"
                  />
                )}
              </>
            )}
            <Rule color={colors.danger} text="Au-delà : heures supplémentaires" />
          </View>
        </Card>

        <Card>
          <CardHeader
            icon="calendar"
            title="Mes jours de travail"
            subtitle="Touchez un jour pour l'ajouter ou le retirer."
          />
          <WorkingDaysPicker
            days={draft.workingDays}
            onChange={(workingDays) => change({ workingDays })}
          />
          <Text style={s.help}>
            {draft.workingDays.length === 0
              ? "Aucun jour choisi."
              : `${draft.workingDays.length} jour${draft.workingDays.length > 1 ? "s" : ""} par semaine. Seuls ces jours sont signalés « à saisir » dans le calendrier.`}
          </Text>
        </Card>

        <Card>
          <CardHeader
            icon="time"
            title="Ma journée habituelle"
            subtitle="Ces horaires sont proposés d'office quand vous touchez un jour vide."
          />
          <IntervalsEditor
            intervals={draft.defaultIntervals}
            onChange={(defaultIntervals) => change({ defaultIntervals })}
          />
          <View style={s.info}>
            <Ionicons name="information-circle" size={22} color={colors.primary} />
            <Text style={s.infoText}>
              {formatDuration(dayMinutes)} par jour, soit {formatDuration(usualWeek)} pour une
              semaine habituelle
              {usualWeek > contract
                ? ` : ${formatDuration(usualWeek - contract)} de plus que le contrat.`
                : usualWeek < contract
                  ? ` : ${formatDuration(contract - usualWeek)} de moins que le contrat.`
                  : ", comme prévu au contrat."}
            </Text>
          </View>
        </Card>

        <Card>
          <CardHeader
            icon="server"
            title="Mes données"
            subtitle="Sauvegarder, archiver ou supprimer mes heures."
          />
          <Button
            label="Gérer mes données"
            icon="chevron-forward"
            variant="secondary"
            onPress={() => router.navigate("/data")}
          />
        </Card>

        <Card>
          <CardHeader
            icon="shield-checkmark"
            title="À savoir"
            tint={{ background: colors.successLight, color: colors.success }}
          />
          <InfoRow
            icon="phone-portrait-outline"
            text="Vos heures sont enregistrées uniquement sur ce téléphone."
          />
          <InfoRow
            icon="camera-outline"
            text={
              isScanConfigured()
                ? "Lecture des photos de notes : activée."
                : "Lecture des photos de notes : pas encore configurée."
            }
          />
          <Button
            label="Revoir la présentation"
            icon="play-circle-outline"
            variant="secondary"
            onPress={onReplayOnboarding}
          />
        </Card>
      </ScrollView>

      {(dirty || justSaved) && (
        <View style={s.saveBar}>
          {justSaved && !dirty ? (
            <View style={s.savedRow}>
              <Ionicons name="checkmark-circle" size={26} color={colors.success} />
              <Text style={s.savedText}>Réglages enregistrés</Text>
            </View>
          ) : (
            <>
              <Text style={error ? s.errorText : s.dirtyText}>
                {error ?? "Vous avez des modifications non enregistrées."}
              </Text>
              <View style={s.saveActions}>
                <Button
                  label="Annuler"
                  variant="secondary"
                  onPress={() => setDraft(saved)}
                  style={s.flex}
                />
                <Button
                  label="Enregistrer"
                  icon="checkmark"
                  onPress={save}
                  disabled={!!error}
                  style={s.flex}
                />
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
}

/** Une tranche d'heures de la semaine : « Jusqu'à 22 h 00 : complémentaires à +10 % ». */
function Rule(props: { color: string; limit?: string; text: string }) {
  return (
    <View style={s.rule}>
      <View style={[s.ruleDot, { backgroundColor: props.color }]} />
      <Text style={s.ruleText}>
        {props.limit ? (
          <>
            Jusqu’à <Text style={s.ruleLimit}>{props.limit}</Text> :{" "}
          </>
        ) : null}
        {props.text}
      </Text>
    </View>
  );
}

function InfoRow(props: { icon: "phone-portrait-outline" | "camera-outline"; text: string }) {
  return (
    <View style={s.infoRow}>
      <Ionicons name={props.icon} size={22} color={colors.textMuted} />
      <Text style={s.infoRowText}>{props.text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.screen, gap: spacing.gap, paddingBottom: 32 },
  flex: { flex: 1 },
  help: { fontSize: font.small, color: colors.textMuted, lineHeight: 20 },
  input: {
    minHeight: 56,
    borderWidth: 2,
    borderColor: colors.borderLight,
    borderRadius: radius.medium,
    paddingHorizontal: 16,
    fontSize: font.large,
    fontWeight: "600",
    color: colors.text,
    backgroundColor: colors.surfaceMuted,
  },
  rules: {
    gap: 8,
    padding: 14,
    borderRadius: radius.medium,
    backgroundColor: colors.surfaceMuted,
  },
  rule: { flexDirection: "row", alignItems: "center", gap: 10 },
  ruleDot: { width: 10, height: 10, borderRadius: radius.pill },
  ruleLimit: { fontWeight: "800" },
  ruleText: { flex: 1, fontSize: font.small, color: colors.text, lineHeight: 20 },
  info: {
    flexDirection: "row",
    gap: 10,
    padding: 12,
    borderRadius: radius.medium,
    backgroundColor: colors.primaryLight,
  },
  infoText: { flex: 1, fontSize: font.small, color: colors.text, lineHeight: 20 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  infoRowText: { flex: 1, fontSize: font.body, color: colors.text, lineHeight: 23 },
  saveBar: {
    padding: spacing.screen,
    gap: 10,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    boxShadow: "0 -4px 12px rgba(23, 32, 51, 0.08)",
  },
  saveActions: { flexDirection: "row", gap: 10 },
  dirtyText: { fontSize: font.small, fontWeight: "600", color: colors.textMuted },
  errorText: { fontSize: font.body, fontWeight: "700", color: colors.danger },
  savedRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  savedText: { fontSize: font.body, fontWeight: "700", color: colors.success },
});
