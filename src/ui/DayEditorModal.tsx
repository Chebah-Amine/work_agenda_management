import { DAY_OFF_REASONS, DayOffReason, WorkDay, WorkInterval } from "@/domain/models/workDay";
import { formatDuration, sortIntervals, totalMinutes, validateIntervals } from "@/domain/time";
import { useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Button } from "./Button";
import { IntervalsEditor } from "./IntervalsEditor";
import { colors, font } from "./theme";

/** Contenu d'un jour, sans sa date (la même saisie peut servir à plusieurs jours). */
export type DayDraft = Pick<WorkDay, "status" | "intervals" | "dayOffReason">;

type Props = {
  visible: boolean;
  title: string;
  subtitle?: string;
  /** Saisie existante ; absente pour un jour vierge. */
  initial?: DayDraft;
  /** Créneaux proposés d'office pour un jour vierge. */
  defaultIntervals: WorkInterval[];
  saveLabel?: string;
  onSave: (draft: DayDraft) => void;
  /** Fourni seulement s'il existe une saisie à effacer. */
  onDelete?: () => void;
  onClose: () => void;
};

export function DayEditorModal({ visible, onClose, ...formProps }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.sheet}>
          {/* Monté à chaque ouverture : le formulaire repart toujours de `initial`. */}
          {visible && <DayEditorForm onClose={onClose} {...formProps} />}
        </View>
      </View>
    </Modal>
  );
}

function DayEditorForm({
  title,
  subtitle,
  initial,
  defaultIntervals,
  saveLabel = "Enregistrer",
  onSave,
  onDelete,
  onClose,
}: Omit<Props, "visible">) {
  const [worked, setWorked] = useState(initial?.status !== "NOT_WORKED");
  const [intervals, setIntervals] = useState<WorkInterval[]>(
    initial?.status === "WORKED" ? initial.intervals : defaultIntervals
  );
  const [reason, setReason] = useState<DayOffReason>(initial?.dayOffReason ?? "repos");

  const error = worked ? validateIntervals(intervals) : null;

  function save() {
    if (error) return;
    onSave(
      worked
        ? { status: "WORKED", intervals: sortIntervals(intervals) }
        : { status: "NOT_WORKED", intervals: [], dayOffReason: reason }
    );
  }

  return (
    <>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <Text style={s.title}>{title}</Text>
        {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}

        <View style={s.segment}>
          <SegmentButton label="J'ai travaillé" selected={worked} onPress={() => setWorked(true)} />
          <SegmentButton
            label="Pas travaillé"
            selected={!worked}
            onPress={() => setWorked(false)}
          />
        </View>

        {worked ? (
          <>
            <IntervalsEditor intervals={intervals} onChange={setIntervals} />
            {error ? (
              <Text style={s.error}>{error}</Text>
            ) : (
              <Text style={s.total}>Total : {formatDuration(totalMinutes(intervals))}</Text>
            )}
          </>
        ) : (
          <>
            <Text style={s.label}>Pourquoi ?</Text>
            <View style={s.reasons}>
              {DAY_OFF_REASONS.map((r) => (
                <SegmentButton
                  key={r.value}
                  label={r.label}
                  selected={reason === r.value}
                  onPress={() => setReason(r.value)}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <View style={s.actions}>
        <Button label={saveLabel} onPress={save} disabled={!!error} icon="checkmark" />
        <View style={s.secondaryActions}>
          <Button label="Annuler" variant="secondary" onPress={onClose} style={s.flex} />
          {onDelete && (
            <Button label="Effacer" variant="danger" onPress={onDelete} style={s.flex} />
          )}
        </View>
      </View>
    </>
  );
}

function SegmentButton(props: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[s.segmentButton, props.selected && s.segmentButtonSelected]}
      onPress={props.onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: props.selected }}
    >
      <Text style={[s.segmentText, props.selected && s.segmentTextSelected]}>{props.label}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
  },
  sheet: {
    width: "100%",
    maxWidth: 480,
    maxHeight: "92%",
    backgroundColor: colors.surface,
    borderRadius: 18,
    overflow: "hidden",
  },
  content: { padding: 16, gap: 14 },
  title: { fontSize: font.large, fontWeight: "700", color: colors.text },
  subtitle: { fontSize: font.body, color: colors.textMuted },
  label: { fontSize: font.body, fontWeight: "600", color: colors.text },
  segment: { flexDirection: "row", gap: 8 },
  reasons: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  segmentButton: {
    flexGrow: 1,
    minHeight: 48,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentButtonSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  segmentText: { fontSize: font.body, fontWeight: "600", color: colors.text },
  segmentTextSelected: { color: "#FFFFFF" },
  total: { fontSize: font.large, fontWeight: "700", color: colors.success },
  error: { fontSize: font.body, fontWeight: "600", color: colors.danger },
  actions: {
    padding: 16,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  secondaryActions: { flexDirection: "row", gap: 10 },
  flex: { flex: 1 },
});
