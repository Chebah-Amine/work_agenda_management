import { DAY_OFF_REASONS, DayOffReason, WorkDay, WorkInterval } from "@/domain/models/workDay";
import { formatDuration, sortIntervals, totalMinutes, validateIntervals } from "@/domain/time";
import { useState } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "./Button";
import { IntervalsEditor } from "./IntervalsEditor";
import { colors, font, radius } from "./theme";

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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.sheet}>
          <View style={s.handle} />
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

  const insets = useSafeAreaInsets();
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
          <SegmentButton
            label="J'ai travaillé"
            selected={worked}
            onPress={() => setWorked(true)}
            style={s.segmentHalf}
          />
          <SegmentButton
            label="Pas travaillé"
            selected={!worked}
            onPress={() => setWorked(false)}
            style={s.segmentHalf}
          />
        </View>

        {worked ? (
          <>
            <IntervalsEditor intervals={intervals} onChange={setIntervals} />
            {error ? (
              <Text style={s.error}>{error}</Text>
            ) : (
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>Total de la journée</Text>
                <Text style={s.total}>{formatDuration(totalMinutes(intervals))}</Text>
              </View>
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

      <View style={[s.actions, { paddingBottom: 16 + insets.bottom }]}>
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

function SegmentButton(props: {
  label: string;
  selected: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      style={[s.segmentButton, props.selected && s.segmentButtonSelected, props.style]}
      onPress={props.onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: props.selected }}
    >
      <Text style={[s.segmentText, props.selected && s.segmentTextSelected]}>{props.label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(23, 32, 51, 0.5)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  sheet: {
    width: "100%",
    maxWidth: 520,
    maxHeight: "92%",
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  handle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    marginTop: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
  },
  content: { padding: 18, gap: 16 },
  title: { fontSize: font.title, fontWeight: "800", color: colors.text },
  subtitle: { fontSize: font.body, color: colors.textMuted, lineHeight: 23 },
  label: { fontSize: font.body, fontWeight: "700", color: colors.text },
  segment: {
    flexDirection: "row",
    gap: 4,
    padding: 4,
    borderRadius: radius.medium,
    backgroundColor: colors.background,
  },
  segmentHalf: { flex: 1 },
  reasons: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  segmentButton: {
    flexGrow: 1,
    minHeight: 48,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.small,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentButtonSelected: { backgroundColor: colors.primary },
  segmentText: { fontSize: font.body, fontWeight: "700", color: colors.textMuted },
  segmentTextSelected: { color: colors.onPrimary },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.medium,
    backgroundColor: colors.successLight,
  },
  totalLabel: { fontSize: font.body, fontWeight: "600", color: colors.success },
  total: { fontSize: font.large, fontWeight: "800", color: colors.success },
  error: {
    fontSize: font.body,
    fontWeight: "600",
    color: colors.danger,
    padding: 12,
    borderRadius: radius.medium,
    backgroundColor: colors.dangerLight,
  },
  actions: {
    padding: 16,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  secondaryActions: { flexDirection: "row", gap: 10 },
  flex: { flex: 1 },
});
