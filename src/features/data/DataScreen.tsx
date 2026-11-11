import {
  archiveYear,
  BackupError,
  canArchiveYear,
  deleteAllDays,
  deleteArchive,
  deleteYear,
  formatBytes,
  mergeBackup,
  ParsedBackup,
  parseBackup,
  replaceWithBackup,
  restoreArchive,
  storageBytes,
  summarizeByYear,
  summarizeDays,
} from "@/domain/dataManagement";
import { addDays, formatShortDate, parseDateKey, toDateKey } from "@/domain/date";
import { formatDuration } from "@/domain/time";
import { exportBackup, pickBackupText } from "@/services/backup/backupFile";
import { useAppData } from "@/state/AppDataContext";
import { Button } from "@/ui/Button";
import { Card, CardHeader } from "@/ui/Card";
import { ConfirmModal } from "@/ui/ConfirmModal";
import { LoadingView } from "@/ui/LoadingView";
import { colors, font, radius, spacing } from "@/ui/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ComponentProps, ComponentRef, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type IconName = ComponentProps<typeof Ionicons>["name"];

/** Au-delà, on rappelle de refaire une sauvegarde. */
const BACKUP_MAX_AGE_DAYS = 30;

/** Action en attente de confirmation. */
type Pending =
  | { type: "archive"; year: number }
  | { type: "deleteYear"; year: number }
  | { type: "deleteArchive"; year: number }
  | { type: "deleteAll" }
  | { type: "restoreBackup"; backup: ParsedBackup };

type Message = { kind: "success" | "error"; text: string };

const plural = (count: number, word: string) => `${count} ${word}${count > 1 ? "s" : ""}`;
const shortDate = (dateKey: string) => formatShortDate(parseDateKey(dateKey));

export function DataScreen() {
  const { data, updateData } = useAppData();
  const [pending, setPending] = useState<Pending | null>(null);
  const [replaceAll, setReplaceAll] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const [busy, setBusy] = useState(false);

  if (!data) return <LoadingView />;

  const today = new Date();
  const todayKey = toDateKey(today);
  const active = summarizeDays(data.workDays);
  const years = summarizeByYear(data.workDays);
  const archives = data.archives.map((archive) => ({
    ...archive,
    ...summarizeDays(archive.workDays),
  }));
  const archivedDays = archives.reduce((sum, a) => sum + a.dayCount, 0);
  const hasDays = active.dayCount + archivedDays > 0;
  const backupIsOld =
    hasDays &&
    (!data.lastBackupAt ||
      data.lastBackupAt < toDateKey(addDays(today, -BACKUP_MAX_AGE_DAYS)));

  /** Le message s'affiche en haut de l'écran : on y remonte pour qu'il soit vu. */
  function show(next: Message) {
    setMessage(next);
    scroll.current?.scrollTo({ y: 0, animated: true });
  }

  async function apply(change: Parameters<typeof updateData>[0], done: string) {
    await updateData(change);
    setPending(null);
    show({ kind: "success", text: done });
  }

  async function createBackup() {
    if (!data) return;
    setBusy(true);
    setMessage(null);
    try {
      await exportBackup(data, todayKey);
      await apply(
        (current) => ({ ...current, lastBackupAt: todayKey }),
        "Sauvegarde créée. Gardez-la ailleurs que sur ce téléphone (e-mail, Drive…)."
      );
    } catch (e) {
      console.warn("Sauvegarde impossible", e);
      show({ kind: "error", text: "La sauvegarde n’a pas pu être créée. Réessayez." });
    } finally {
      setBusy(false);
    }
  }

  async function chooseBackup() {
    setBusy(true);
    setMessage(null);
    try {
      const text = await pickBackupText();
      if (text === null) return;
      setReplaceAll(false);
      setPending({ type: "restoreBackup", backup: parseBackup(text) });
    } catch (e) {
      if (!(e instanceof BackupError)) console.warn("Lecture de la sauvegarde impossible", e);
      show({
        kind: "error",
        text: e instanceof BackupError ? e.message : "Ce fichier n’a pas pu être lu. Réessayez.",
      });
    } finally {
      setBusy(false);
    }
  }

  function confirmPending() {
    if (!pending) return;
    switch (pending.type) {
      case "archive":
        return apply(
          (current) => archiveYear(current, pending.year, todayKey),
          `L’année ${pending.year} est archivée.`
        );
      case "deleteYear":
        return apply(
          (current) => deleteYear(current, pending.year),
          `Les heures de ${pending.year} sont supprimées.`
        );
      case "deleteArchive":
        return apply(
          (current) => deleteArchive(current, pending.year),
          `L’archive ${pending.year} est supprimée.`
        );
      case "deleteAll":
        return apply(deleteAllDays, "Toutes les heures sont supprimées.");
      case "restoreBackup":
        return apply(
          (current) =>
            replaceAll
              ? replaceWithBackup(current, pending.backup.data)
              : mergeBackup(current, pending.backup.data),
          "La sauvegarde a été reprise."
        );
    }
  }

  return (
    <ScrollView ref={scroll} style={s.screen} contentContainerStyle={s.content}>
      {message && (
        <View style={[s.message, message.kind === "error" ? s.messageError : s.messageSuccess]}>
          <Ionicons
            name={message.kind === "error" ? "alert-circle" : "checkmark-circle"}
            size={26}
            color={message.kind === "error" ? colors.danger : colors.success}
          />
          <Text
            style={[
              s.messageText,
              { color: message.kind === "error" ? colors.danger : colors.success },
            ]}
          >
            {message.text}
          </Text>
        </View>
      )}

      <Card>
        <CardHeader
          icon="phone-portrait"
          title="Sur ce téléphone"
          subtitle="Vos heures ne sont enregistrées nulle part ailleurs."
        />
        <View style={s.stats}>
          <Stat value={String(active.dayCount)} label={`jour${active.dayCount > 1 ? "s" : ""} au calendrier`} />
          <Stat value={String(archivedDays)} label={`jour${archivedDays > 1 ? "s" : ""} archivé${archivedDays > 1 ? "s" : ""}`} />
          <Stat value={formatBytes(storageBytes(data))} label="de place utilisée" />
        </View>
        {active.firstDate && active.lastDate ? (
          <Text style={s.help}>
            Calendrier : du {shortDate(active.firstDate)} au {shortDate(active.lastDate)}. Une année
            complète occupe environ 40 Ko, soit moins qu’une seule photo.
          </Text>
        ) : (
          <Text style={s.help}>Aucune heure saisie pour le moment.</Text>
        )}
      </Card>

      <Card>
        <CardHeader
          icon="cloud-upload"
          title="Sauvegarde"
          subtitle="Un fichier à garder hors du téléphone, pour ne rien perdre s’il est cassé, perdu ou remplacé."
        />
        <View style={[s.notice, backupIsOld ? s.noticeWarning : s.noticeOk]}>
          <Ionicons
            name={backupIsOld ? "warning" : "checkmark-circle"}
            size={22}
            color={backupIsOld ? colors.warningText : colors.success}
          />
          <Text style={[s.noticeText, { color: backupIsOld ? colors.warningText : colors.success }]}>
            {data.lastBackupAt
              ? `Dernière sauvegarde : le ${shortDate(data.lastBackupAt)}.`
              : hasDays
                ? "Aucune sauvegarde n’a encore été faite."
                : "Rien à sauvegarder pour le moment."}
            {backupIsOld && data.lastBackupAt ? " Pensez à en refaire une." : ""}
          </Text>
        </View>
        <Button
          label={busy ? "Un instant…" : "Faire une sauvegarde"}
          icon="download-outline"
          onPress={createBackup}
          disabled={busy || !hasDays}
        />
        <Button
          label="Reprendre une sauvegarde"
          icon="folder-open-outline"
          variant="secondary"
          onPress={chooseBackup}
          disabled={busy}
        />
      </Card>

      <Card>
        <CardHeader
          icon="calendar"
          title="Mes heures par année"
          subtitle="Archiver une année terminée la retire du calendrier sans la supprimer."
        />
        {years.length === 0 ? (
          <Text style={s.help}>Aucune heure au calendrier.</Text>
        ) : (
          years.map((year, index) => (
            <View key={year.year} style={[s.row, index > 0 && s.rowSeparator]}>
              <Text style={s.rowTitle}>{year.year}</Text>
              <Text style={s.rowDetail}>
                {plural(year.dayCount, "jour")} · {formatDuration(year.workedMinutes)}
              </Text>
              <View style={s.rowActions}>
                {canArchiveYear(year.year, today) ? (
                  <SmallButton
                    label="Archiver"
                    icon="archive-outline"
                    onPress={() => setPending({ type: "archive", year: year.year })}
                  />
                ) : (
                  <Text style={s.rowNote}>Année en cours : archivable l’an prochain.</Text>
                )}
                <SmallButton
                  label="Supprimer"
                  icon="trash-outline"
                  danger
                  onPress={() => setPending({ type: "deleteYear", year: year.year })}
                />
              </View>
            </View>
          ))
        )}
      </Card>

      <Card>
        <CardHeader
          icon="archive"
          title="Archives"
          subtitle="Années rangées : elles restent sur le téléphone et dans les sauvegardes."
        />
        {archives.length === 0 ? (
          <Text style={s.help}>Aucune année archivée.</Text>
        ) : (
          archives.map((archive, index) => (
            <View key={archive.year} style={[s.row, index > 0 && s.rowSeparator]}>
              <Text style={s.rowTitle}>{archive.year}</Text>
              <Text style={s.rowDetail}>
                {plural(archive.dayCount, "jour")} · {formatDuration(archive.workedMinutes)}
                {archive.archivedAt ? ` · archivée le ${shortDate(archive.archivedAt)}` : ""}
              </Text>
              <View style={s.rowActions}>
                <SmallButton
                  label="Remettre au calendrier"
                  icon="arrow-undo-outline"
                  onPress={() =>
                    apply(
                      (current) => restoreArchive(current, archive.year),
                      `L’année ${archive.year} est de retour dans le calendrier.`
                    )
                  }
                />
                <SmallButton
                  label="Supprimer"
                  icon="trash-outline"
                  danger
                  onPress={() => setPending({ type: "deleteArchive", year: archive.year })}
                />
              </View>
            </View>
          ))
        )}
      </Card>

      <Card>
        <CardHeader
          icon="warning"
          title="Tout effacer"
          subtitle="Supprime toutes les heures, archives comprises. Vos réglages sont conservés."
          tint={{ background: colors.dangerLight, color: colors.danger }}
        />
        <Button
          label="Effacer toutes mes heures"
          icon="trash-outline"
          variant="danger"
          onPress={() => setPending({ type: "deleteAll" })}
          disabled={!hasDays}
        />
      </Card>

      <ConfirmModal
        visible={!!pending}
        {...confirmTexts(pending, replaceAll, backupIsOld)}
        onConfirm={confirmPending}
        onCancel={() => setPending(null)}
      >
        {pending?.type === "restoreBackup" && hasDays && (
          <View style={s.choices}>
            <Choice
              selected={!replaceAll}
              title="Ajouter à mes heures"
              detail="Ce qui est déjà sur le téléphone est conservé."
              onPress={() => setReplaceAll(false)}
            />
            <Choice
              selected={replaceAll}
              title="Tout remplacer"
              detail="Les heures et réglages actuels sont effacés."
              onPress={() => setReplaceAll(true)}
            />
          </View>
        )}
      </ConfirmModal>
    </ScrollView>
  );
}

/** Textes de la fenêtre de confirmation selon l'action en attente. */
function confirmTexts(pending: Pending | null, replaceAll: boolean, backupIsOld: boolean) {
  const backupAdvice = backupIsOld ? " Vous n’avez pas de sauvegarde récente." : "";
  switch (pending?.type) {
    case "archive":
      return {
        title: `Archiver ${pending.year} ?`,
        message: `Les heures de ${pending.year} quitteront le calendrier et le rapport, mais resteront sur le téléphone. Vous pourrez les y remettre à tout moment.`,
        confirmLabel: "Archiver",
      };
    case "deleteYear":
      return {
        title: `Supprimer ${pending.year} ?`,
        message: `Toutes les heures de ${pending.year} seront effacées du calendrier.${backupAdvice}`,
        confirmLabel: "Supprimer",
        destructive: true,
      };
    case "deleteArchive":
      return {
        title: `Supprimer l’archive ${pending.year} ?`,
        message: `Les heures archivées de ${pending.year} seront effacées du téléphone.${backupAdvice}`,
        confirmLabel: "Supprimer",
        destructive: true,
      };
    case "deleteAll":
      return {
        title: "Tout effacer ?",
        message: `Toutes vos heures seront effacées, archives comprises.${backupAdvice}`,
        confirmLabel: "Tout effacer",
        destructive: true,
      };
    case "restoreBackup":
      return {
        title: "Reprendre cette sauvegarde ?",
        message: `${
          pending.backup.exportedAt ? `Sauvegarde du ${shortDate(pending.backup.exportedAt)}` : "Sauvegarde"
        } : ${plural(pending.backup.dayCount, "jour")}.`,
        confirmLabel: replaceAll ? "Tout remplacer" : "Reprendre",
        destructive: replaceAll,
      };
    default:
      return { title: "", message: "", confirmLabel: "" };
  }
}

function Stat(props: { value: string; label: string }) {
  return (
    <View style={s.stat}>
      <Text style={s.statValue}>{props.value}</Text>
      <Text style={s.statLabel}>{props.label}</Text>
    </View>
  );
}

function SmallButton(props: { label: string; icon: IconName; danger?: boolean; onPress: () => void }) {
  const color = props.danger ? colors.danger : colors.primary;
  return (
    <Pressable
      style={({ pressed }) => [
        s.smallButton,
        { backgroundColor: props.danger ? colors.dangerLight : colors.primaryLight },
        pressed && s.pressed,
      ]}
      onPress={props.onPress}
      accessibilityRole="button"
    >
      <Ionicons name={props.icon} size={20} color={color} />
      <Text style={[s.smallButtonText, { color }]}>{props.label}</Text>
    </Pressable>
  );
}

function Choice(props: { selected: boolean; title: string; detail: string; onPress: () => void }) {
  return (
    <Pressable
      style={[s.choice, props.selected && s.choiceSelected]}
      onPress={props.onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: props.selected }}
    >
      <Ionicons
        name={props.selected ? "radio-button-on" : "radio-button-off"}
        size={26}
        color={props.selected ? colors.primary : colors.textMuted}
      />
      <View style={s.choiceText}>
        <Text style={s.choiceTitle}>{props.title}</Text>
        <Text style={s.choiceDetail}>{props.detail}</Text>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.screen, gap: spacing.gap, paddingBottom: 32 },
  help: { fontSize: font.small, color: colors.textMuted, lineHeight: 20 },
  message: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: radius.medium,
  },
  messageError: { backgroundColor: colors.dangerLight },
  messageSuccess: { backgroundColor: colors.successLight },
  messageText: { flex: 1, fontSize: font.body, fontWeight: "600", lineHeight: 23 },
  stats: { flexDirection: "row", gap: 8 },
  stat: {
    flex: 1,
    alignItems: "center",
    gap: 2,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: radius.medium,
    backgroundColor: colors.surfaceMuted,
  },
  statValue: { fontSize: font.large, fontWeight: "800", color: colors.text },
  statLabel: { fontSize: 13, color: colors.textMuted, textAlign: "center" },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: radius.medium,
  },
  noticeOk: { backgroundColor: colors.successLight },
  noticeWarning: { backgroundColor: colors.warningLight },
  noticeText: { flex: 1, fontSize: font.small, fontWeight: "600", lineHeight: 20 },
  row: { gap: 4, paddingVertical: 12 },
  rowSeparator: { borderTopWidth: 1, borderTopColor: colors.borderLight },
  rowTitle: { fontSize: font.large, fontWeight: "800", color: colors.text },
  rowDetail: { fontSize: font.small, color: colors.textMuted },
  rowNote: { flex: 1, fontSize: 13, color: colors.textMuted },
  rowActions: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8, marginTop: 6 },
  smallButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 46,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
  },
  smallButtonText: { fontSize: font.small, fontWeight: "700" },
  pressed: { opacity: 0.7 },
  choices: { gap: 8 },
  choice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: radius.medium,
    borderWidth: 2,
    borderColor: colors.borderLight,
  },
  choiceSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  choiceText: { flex: 1, gap: 2 },
  choiceTitle: { fontSize: font.body, fontWeight: "700", color: colors.text },
  choiceDetail: { fontSize: font.small, color: colors.textMuted },
});
