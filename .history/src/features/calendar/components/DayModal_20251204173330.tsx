import { DayOffReason, WorkInterval } from "@/domain/models/workDay";
import { MutableRefObject } from "react";
import {
  Modal,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { calendarStyles as s } from "../CalendarStyles";
import { IntervalCarousel } from "./IntervalCarousel";

type ReasonOption = { label: string; value: DayOffReason };

type Props = {
  visible: boolean;
  selectedDate: Date | null;
  notWorked: boolean;
  reason: DayOffReason | undefined;
  intervals: WorkInterval[];
  activeIntervalIndex: number;
  hasRange: boolean;
  effectiveCardWidth: number;
  intervalScrollRef: MutableRefObject<ScrollView | null>;
  reasons: ReasonOption[];
  onClose: () => void;
  onToggleNotWorked: (value: boolean) => void;
  onAddInterval: () => void;
  onUpdateInterval: (index: number, field: "start" | "end", value: string) => void;
  onRemoveInterval: (index: number) => void;
  onIntervalIndexChange: (index: number) => void;
  onCarouselWidth: (width: number) => void;
  onApplyToRange: () => void;
  onSave: () => void;
  onSelectReason: (value: DayOffReason) => void;
  formatDisplayDate: (date: Date) => string;
};

export function DayModal({
  visible,
  selectedDate,
  notWorked,
  reason,
  intervals,
  activeIntervalIndex,
  hasRange,
  effectiveCardWidth,
  intervalScrollRef,
  reasons,
  onClose,
  onToggleNotWorked,
  onAddInterval,
  onUpdateInterval,
  onRemoveInterval,
  onIntervalIndexChange,
  onCarouselWidth,
  onApplyToRange,
  onSave,
  onSelectReason,
  formatDisplayDate,
}: Props) {
  
  
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.modalOverlay}>
        <View style={s.modalContent}>
          <ScrollView contentContainerStyle={s.modalScrollContent}>
            <Text style={s.modalTitle}>
              {selectedDate && formatDisplayDate(selectedDate)}
            </Text>

            <View style={s.checkboxRow}>
              <Switch value={notWorked} onValueChange={onToggleNotWorked} />
              <Text>Je n'ai pas travaillé ce jour-là</Text>
            </View>

            {!notWorked && (
              <IntervalCarousel
                intervals={intervals}
                activeIndex={activeIntervalIndex}
                effectiveCardWidth={effectiveCardWidth}
                scrollRef={intervalScrollRef}
                onAdd={onAddInterval}
                onUpdate={onUpdateInterval}
                onRemove={onRemoveInterval}
                onIndexChange={onIntervalIndexChange}
                onLayoutWidth={onCarouselWidth}
              />
            )}

            {notWorked && (
              <>
                <Text style={s.label}>Raison</Text>
                <View style={s.reasonButtonsRow}>
                  {reasons.map((r) => {
                    const selected = reason === r.value;
                    return (
                      <TouchableOpacity
                        key={r.value}
                        style={[s.reasonButton, selected && s.reasonButtonSelected]}
                        onPress={() => onSelectReason(r.value)}
                      >
                        <Text style={[s.reasonText, selected && s.reasonTextSelected]}>
                          {r.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {hasRange && (
              <View style={s.rangeApplyInfo}>
                <Text style={s.rangeApplyText}>
                  Applique les réglages de ce jour sur l'intervalle sélectionné.
                </Text>
              </View>
            )}

            <View style={s.modalButtonsRow}>
              <TouchableOpacity style={s.cancelButton} onPress={onClose}>
                <Text style={s.cancelText}>Annuler</Text>
              </TouchableOpacity>

              {hasRange ? (
                <TouchableOpacity style={s.applyRangeButton} onPress={onApplyToRange}>
                  <Text style={s.buttonText}>Appliquer intervalle</Text>
                </TouchableOpacity>
              )
              :
                <TouchableOpacity style={s.saveButton} onPress={onSave} disabled={}>
                  <Text style={s.buttonText}>Enregistrer</Text>
                </TouchableOpacity>
              }

            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
