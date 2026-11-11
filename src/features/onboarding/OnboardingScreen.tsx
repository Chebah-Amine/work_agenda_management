import { WEEKDAY_LONG } from "@/domain/date";
import { WorkSettings } from "@/domain/models/workSettings";
import { formatDuration, formatIntervals, totalMinutes, validateIntervals } from "@/domain/time";
import { ContractStepper } from "@/features/settings/components/ContractStepper";
import { WorkingDaysPicker } from "@/features/settings/components/WorkingDaysPicker";
import { NO_WORKING_DAY_ERROR, normalizeSettingsDraft } from "@/features/settings/settingsDraft";
import { useAppData } from "@/state/AppDataContext";
import { Button } from "@/ui/Button";
import { IntervalsEditor } from "@/ui/IntervalsEditor";
import { colors, font, radius, spacing } from "@/ui/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ComponentProps, ComponentRef, ReactNode, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type IconName = ComponentProps<typeof Ionicons>["name"];

type StepId = "welcome" | "name" | "contract" | "days" | "usualDay" | "done";
const STEPS: StepId[] = ["welcome", "name", "contract", "days", "usualDay", "done"];

/** Ce qui empêche de quitter l'étape (message affichable), ou null. */
function stepError(step: StepId, draft: WorkSettings): string | null {
  if (step === "days" && draft.workingDays.length === 0) return NO_WORKING_DAY_ERROR;
  if (step === "usualDay") return validateIntervals(draft.defaultIntervals);
  return null;
}

/** Présentation de première ouverture : explique l'application et règle l'essentiel. */
export function OnboardingScreen() {
  const { data, updateData } = useAppData();
  const [index, setIndex] = useState(0);
  // En rejouant la présentation depuis les Réglages, on repart des réglages existants.
  const [draft, setDraft] = useState<WorkSettings | null>(data?.settings ?? null);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);

  if (!draft) return null;

  const step = STEPS[index];
  const isLast = index === STEPS.length - 1;
  const error = stepError(step, draft);

  function change(patch: Partial<WorkSettings>) {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  }

  function goTo(next: number) {
    setIndex(next);
    scroll.current?.scrollTo({ y: 0, animated: false });
  }

  /** Termine la présentation en enregistrant les réglages donnés. */
  function finish(settings: WorkSettings) {
    return updateData((current) => {
      const { needsOnboarding: _done, ...rest } = current;
      return { ...rest, settings };
    });
  }

  return (
    <SafeAreaView style={s.screen}>
      <View style={s.topBar}>
        <View
          style={s.dots}
          accessibilityRole="progressbar"
          accessibilityLabel={`Étape ${index + 1} sur ${STEPS.length}`}
        >
          {STEPS.map((id, i) => (
            <View key={id} style={[s.dot, i === index && s.dotActive, i < index && s.dotDone]} />
          ))}
        </View>
        {!isLast && data && (
          // « Passer » garde les réglages déjà enregistrés (ceux par défaut à la première ouverture).
          <Pressable
            onPress={() => finish(data.settings)}
            accessibilityRole="button"
            hitSlop={10}
            style={s.skip}
          >
            <Text style={s.skipText}>Passer</Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        ref={scroll}
        style={s.scroll}
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
      >
        {step === "welcome" && (
          <Step
            icon="hand-right"
            title="Bienvenue"
            text="Cette application remplace votre feuille d’heures : vous notez vos horaires, elle fait les calculs."
          >
            <Feature icon="calendar" text="Notez vos heures jour par jour, en quelques touchers." />
            <Feature
              icon="calculator"
              text="Vos heures complémentaires sont calculées toutes seules, semaine par semaine."
            />
            <Feature icon="document-text" text="Envoyez le relevé du mois en PDF ou en Excel." />
            <Text style={s.note}>Quatre petites questions pour régler l’application, puis c’est prêt.</Text>
          </Step>
        )}

        {step === "name" && (
          <Step
            icon="person"
            title="Comment vous appelez-vous ?"
            text="Votre nom apparaîtra en haut du relevé mensuel. Vous pouvez laisser vide."
          >
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
          </Step>
        )}

        {step === "contract" && (
          <Step
            icon="document-text"
            title="Combien d’heures par semaine ?"
            text="Indiquez les heures prévues à votre contrat. Au-delà, l’application compte des heures complémentaires."
          >
            <View style={s.panel}>
              <ContractStepper
                minutes={draft.weeklyContractMinutes}
                onChange={(weeklyContractMinutes) => change({ weeklyContractMinutes })}
              />
            </View>
          </Step>
        )}

        {step === "days" && (
          <Step
            icon="calendar"
            title="Quels jours travaillez-vous ?"
            text="Touchez un jour pour l’ajouter ou le retirer. Le calendrier vous signalera ces jours tant qu’ils ne sont pas remplis."
          >
            <WorkingDaysPicker
              days={draft.workingDays}
              onChange={(workingDays) => change({ workingDays })}
            />
          </Step>
        )}

        {step === "usualDay" && (
          <Step
            icon="time"
            title="Votre journée habituelle"
            text="Ces horaires seront proposés d’office pour chaque nouveau jour : il suffira de les corriger s’ils changent."
          >
            <IntervalsEditor
              intervals={draft.defaultIntervals}
              onChange={(defaultIntervals) => change({ defaultIntervals })}
            />
          </Step>
        )}

        {step === "done" && (
          <Step
            icon="checkmark-circle"
            title="Tout est prêt"
            text="Voici vos réglages. Vous pourrez les modifier à tout moment dans l’onglet Réglages."
          >
            <View style={s.panel}>
              <Recap label="Nom" value={draft.employeeName.trim() || "Non renseigné"} />
              <Recap label="Contrat" value={`${formatDuration(draft.weeklyContractMinutes)} par semaine`} />
              <Recap
                label="Jours de travail"
                value={[...draft.workingDays]
                  .sort()
                  .map((day) => WEEKDAY_LONG[day - 1])
                  .join(", ")}
              />
              <Recap
                label="Journée habituelle"
                value={`${formatIntervals(draft.defaultIntervals)} (${formatDuration(
                  totalMinutes(draft.defaultIntervals)
                )})`}
              />
            </View>
            <Text style={s.note}>
              Pour commencer, touchez un jour du calendrier et enregistrez vos heures.
            </Text>
          </Step>
        )}

        {error ? <Text style={s.error}>{error}</Text> : null}
      </ScrollView>

      <View style={s.bottomBar}>
        {index > 0 && (
          <Button label="Retour" variant="secondary" onPress={() => goTo(index - 1)} style={s.back} />
        )}
        <Button
          label={isLast ? "Commencer" : index === 0 ? "C’est parti" : "Continuer"}
          icon={isLast ? "checkmark" : "arrow-forward"}
          onPress={() => (isLast ? finish(normalizeSettingsDraft(draft)) : goTo(index + 1))}
          disabled={!!error}
          style={s.next}
        />
      </View>
    </SafeAreaView>
  );
}

function Step(props: { icon: IconName; title: string; text: string; children: ReactNode }) {
  return (
    <View style={s.step}>
      <View style={s.badge}>
        <Ionicons name={props.icon} size={44} color={colors.primary} />
      </View>
      <Text style={s.title} accessibilityRole="header">
        {props.title}
      </Text>
      <Text style={s.text}>{props.text}</Text>
      <View style={s.body}>{props.children}</View>
    </View>
  );
}

function Feature(props: { icon: IconName; text: string }) {
  return (
    <View style={s.feature}>
      <View style={s.featureIcon}>
        <Ionicons name={props.icon} size={24} color={colors.primary} />
      </View>
      <Text style={s.featureText}>{props.text}</Text>
    </View>
  );
}

function Recap(props: { label: string; value: string }) {
  return (
    <View style={s.recap}>
      <Text style={s.recapLabel}>{props.label}</Text>
      <Text style={s.recapValue}>{props.value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 56,
    paddingHorizontal: spacing.screen,
  },
  dots: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 10, height: 10, borderRadius: radius.pill, backgroundColor: colors.border },
  dotDone: { backgroundColor: colors.primary },
  dotActive: { width: 28, backgroundColor: colors.primary },
  skip: { minHeight: 44, justifyContent: "center", paddingHorizontal: 8 },
  skipText: { fontSize: font.body, fontWeight: "700", color: colors.textMuted },
  scroll: { flex: 1 },
  content: { padding: spacing.screen, paddingTop: 8, paddingBottom: 32, gap: spacing.gap },
  step: { gap: 12 },
  badge: {
    width: 88,
    height: 88,
    borderRadius: radius.large,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: { fontSize: 30, fontWeight: "800", color: colors.text, lineHeight: 36 },
  text: { fontSize: font.body, color: colors.textMuted, lineHeight: 25 },
  body: { gap: spacing.gap, marginTop: 10 },
  note: { fontSize: font.body, fontWeight: "600", color: colors.text, lineHeight: 25, marginTop: 4 },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: radius.large,
    backgroundColor: colors.surface,
  },
  featureIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.medium,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: { flex: 1, fontSize: font.body, color: colors.text, lineHeight: 24 },
  input: {
    minHeight: 60,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.medium,
    paddingHorizontal: 16,
    fontSize: font.large,
    fontWeight: "600",
    color: colors.text,
    backgroundColor: colors.surface,
  },
  panel: { padding: 18, gap: 14, borderRadius: radius.large, backgroundColor: colors.surface },
  recap: { gap: 2 },
  recapLabel: { fontSize: font.small, fontWeight: "600", color: colors.textMuted },
  recapValue: { fontSize: font.body, fontWeight: "700", color: colors.text, lineHeight: 24 },
  error: {
    fontSize: font.body,
    fontWeight: "600",
    color: colors.danger,
    padding: 12,
    borderRadius: radius.medium,
    backgroundColor: colors.dangerLight,
  },
  bottomBar: {
    flexDirection: "row",
    gap: 10,
    padding: spacing.screen,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  back: { flex: 1 },
  next: { flex: 2 },
});
