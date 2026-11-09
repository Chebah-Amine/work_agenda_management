import { formatLongDate, parseDateKey } from "@/domain/date";
import { dayOffLabel } from "@/domain/models/workDay";
import { ScanProposal } from "@/domain/scan";
import { formatDuration, formatIntervals, totalMinutes, validateIntervals } from "@/domain/time";
import { isScanConfigured, scanNotes } from "@/services/scan/scanNotes";
import { useAppData } from "@/state/AppDataContext";
import { Button } from "@/ui/Button";
import { DayEditorModal } from "@/ui/DayEditorModal";
import { LoadingView } from "@/ui/LoadingView";
import { MonthHeader, useYearMonth } from "@/ui/MonthHeader";
import { colors, font } from "@/ui/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Review = {
  photoUri: string;
  proposals: ScanProposal[];
  /** Dates cochées, c'est-à-dire à enregistrer. */
  accepted: Set<string>;
};

export function ScanScreen() {
  const { data, saveDays } = useAppData();
  const { year, month, shift, goToToday } = useYearMonth();
  const [analyzing, setAnalyzing] = useState(false);
  const [review, setReview] = useState<Review | null>(null);
  const [message, setMessage] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [editingDate, setEditingDate] = useState<string | null>(null);

  if (!data) return <LoadingView />;
  if (analyzing) return <LoadingView label="Lecture de vos notes… Cela prend quelques secondes." />;

  async function pick(source: "camera" | "library") {
    setMessage(null);
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ["images"],
      quality: 0.6,
      base64: true,
    };

    let result: ImagePicker.ImagePickerResult;
    if (source === "camera") {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setMessage({
          kind: "error",
          text: "L'appareil photo n'est pas autorisé. Autorisez-le dans les réglages du téléphone, ou choisissez une photo existante.",
        });
        return;
      }
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      result = await ImagePicker.launchImageLibraryAsync(options);
    }

    const asset = result.canceled ? null : result.assets[0];
    if (!asset?.base64) return;

    setAnalyzing(true);
    try {
      const proposals = await scanNotes(
        { base64: asset.base64, mimeType: asset.mimeType ?? "image/jpeg" },
        year,
        month
      );
      if (proposals.length === 0) {
        setMessage({
          kind: "error",
          text: "Aucun horaire n'a pu être lu sur cette photo. Reprenez-la bien à plat, avec assez de lumière.",
        });
      } else {
        setReview({
          photoUri: asset.uri,
          proposals,
          // Les jours dont la lecture est incohérente sont décochés d'office.
          accepted: new Set(proposals.filter(isSavable).map((p) => p.day.date)),
        });
      }
    } catch (e) {
      console.warn("Lecture de la photo impossible", e);
      setMessage({
        kind: "error",
        text: "La lecture de la photo a échoué. Vérifiez la connexion Internet et réessayez.",
      });
    } finally {
      setAnalyzing(false);
    }
  }

  if (!review) {
    return (
      <ScrollView style={s.screen} contentContainerStyle={s.content}>
        <Text style={s.intro}>
          Prenez en photo vos notes papier : les horaires lus vous seront proposés, et rien n’est
          enregistré sans votre accord.
        </Text>

        {message && (
          <Text style={message.kind === "error" ? s.error : s.success}>{message.text}</Text>
        )}

        {isScanConfigured() ? (
          <>
            <Text style={s.label}>Mois des notes</Text>
            <MonthHeader year={year} month={month} onShift={shift} onToday={goToToday} />
            <Button label="Prendre une photo" icon="camera-outline" onPress={() => pick("camera")} />
            <Button
              label="Choisir une photo existante"
              icon="images-outline"
              variant="secondary"
              onPress={() => pick("library")}
            />
          </>
        ) : (
          <Text style={s.error}>
            La lecture des photos n’est pas encore configurée sur cette application (clés Firebase
            manquantes, voir le fichier README).
          </Text>
        )}
      </ScrollView>
    );
  }

  const { proposals, accepted } = review;
  const toSave = proposals.filter((p) => accepted.has(p.day.date));
  const editing = proposals.find((p) => p.day.date === editingDate);

  function toggle(date: string) {
    if (!review) return;
    const next = new Set(review.accepted);
    if (!next.delete(date)) next.add(date);
    setReview({ ...review, accepted: next });
  }

  async function confirm() {
    await saveDays(toSave.map((p) => p.day));
    setReview(null);
    setMessage({
      kind: "success",
      text: `${toSave.length} jour${toSave.length > 1 ? "s enregistrés" : " enregistré"} dans le calendrier.`,
    });
  }

  return (
    <View style={s.screen}>
      <ScrollView contentContainerStyle={s.content}>
        <Image source={{ uri: review.photoUri }} style={s.photo} resizeMode="contain" />
        <Text style={s.intro}>
          Vérifiez chaque jour avec vos notes. Décochez ou corrigez ce qui est faux.
        </Text>

        {proposals.map((proposal) => {
          const { day, warnings } = proposal;
          const checked = accepted.has(day.date);
          const savable = isSavable(proposal);
          return (
            <View key={day.date} style={[s.card, !checked && s.cardOff]}>
              <TouchableOpacity
                style={s.cardMain}
                onPress={() => toggle(day.date)}
                disabled={!savable}
                accessibilityRole="checkbox"
                accessibilityState={{ checked, disabled: !savable }}
              >
                <Ionicons
                  name={checked ? "checkbox" : "square-outline"}
                  size={32}
                  color={savable ? colors.primary : colors.border}
                />
                <View style={s.cardBody}>
                  <Text style={s.cardDate}>{formatLongDate(parseDateKey(day.date))}</Text>
                  <Text style={s.cardText}>
                    {day.status === "WORKED"
                      ? `${formatIntervals(day.intervals)}  ·  ${formatDuration(totalMinutes(day.intervals))}`
                      : `Pas travaillé (${dayOffLabel(day.dayOffReason)})`}
                  </Text>
                  {warnings.map((warning) => (
                    <Text key={warning} style={s.warning}>
                      {warning}
                    </Text>
                  ))}
                  {data.workDays[day.date] && (
                    <Text style={s.warning}>Remplacera la saisie déjà présente ce jour-là.</Text>
                  )}
                </View>
              </TouchableOpacity>
              <Button
                label="Corriger"
                icon="create-outline"
                variant="secondary"
                onPress={() => setEditingDate(day.date)}
              />
            </View>
          );
        })}
      </ScrollView>

      <View style={s.footer}>
        <Button
          label={
            toSave.length === 0
              ? "Aucun jour coché"
              : `Enregistrer ${toSave.length} jour${toSave.length > 1 ? "s" : ""}`
          }
          icon="checkmark"
          onPress={confirm}
          disabled={toSave.length === 0}
        />
        <Button label="Abandonner cette photo" variant="secondary" onPress={() => setReview(null)} />
      </View>

      <DayEditorModal
        visible={!!editing}
        title={editing ? formatLongDate(parseDateKey(editing.day.date)) : ""}
        initial={editing?.day}
        defaultIntervals={data.settings.defaultIntervals}
        saveLabel="Valider la correction"
        onSave={(draft) => {
          if (!editing) return;
          const date = editing.day.date;
          setReview({
            ...review,
            // Une correction à la main lève les doutes de lecture et coche le jour.
            proposals: proposals.map((p) =>
              p.day.date === date ? { day: { ...draft, date }, warnings: [] } : p
            ),
            accepted: new Set(accepted).add(date),
          });
          setEditingDate(null);
        }}
        onClose={() => setEditingDate(null)}
      />
    </View>
  );
}

/** Un jour travaillé dont les créneaux se chevauchent doit être corrigé avant d'être enregistré. */
function isSavable(proposal: ScanProposal): boolean {
  return proposal.day.status === "NOT_WORKED" || validateIntervals(proposal.day.intervals) === null;
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 14, paddingBottom: 24 },
  intro: { fontSize: font.body, color: colors.text, lineHeight: 24 },
  label: { fontSize: font.body, fontWeight: "700", color: colors.text },
  error: { fontSize: font.body, fontWeight: "600", color: colors.danger },
  success: { fontSize: font.body, fontWeight: "600", color: colors.success },
  photo: { width: "100%", height: 200, borderRadius: 12, backgroundColor: colors.borderLight },
  card: {
    padding: 12,
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cardOff: { backgroundColor: colors.background },
  cardMain: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  cardBody: { flex: 1, gap: 4 },
  cardDate: { fontSize: font.body, fontWeight: "700", color: colors.text },
  cardText: { fontSize: font.body, color: colors.text },
  warning: {
    fontSize: font.small,
    fontWeight: "600",
    color: colors.warningText,
    backgroundColor: colors.warningLight,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  footer: {
    padding: 14,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
});
