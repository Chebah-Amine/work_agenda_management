import { MutableRefObject } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { WorkInterval } from "@/domain/models/workDay";
import { calendarStyles as s } from "../CalendarStyles";

type Props = {
  intervals: WorkInterval[];
  activeIndex: number;
  effectiveCardWidth: number;
  scrollRef: MutableRefObject<ScrollView | null>;
  onAdd: () => void;
  onUpdate: (index: number, field: "start" | "end", value: string) => void;
  onRemove: (index: number) => void;
  onIndexChange: (index: number) => void;
  onLayoutWidth: (width: number) => void;
};

export function IntervalCarousel({
  intervals,
  activeIndex,
  effectiveCardWidth,
  scrollRef,
  onAdd,
  onUpdate,
  onRemove,
  onIndexChange,
  onLayoutWidth,
}: Props) {
  return (
    <>
      <View style={s.intervalHeaderRow}>
        <Text style={s.label}>Créneaux</Text>
        <TouchableOpacity style={s.addIntervalButton} onPress={onAdd}>
          <Text style={s.addIntervalText}>+ Ajouter un créneau</Text>
        </TouchableOpacity>
      </View>

      {intervals.length === 0 && (
        <View style={s.intervalEmpty}>
          <Text style={s.intervalEmptyText}>Ajoutez un créneau pour commencer</Text>
        </View>
      )}

      {intervals.length > 0 && (
        <View
          style={s.intervalCarousel}
          onLayout={(e) => onLayoutWidth(e.nativeEvent.layout.width)}
        >
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            snapToInterval={effectiveCardWidth}
            snapToAlignment="start"
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              if (!effectiveCardWidth) return;
              const nextIndex = Math.round(
                e.nativeEvent.contentOffset.x / effectiveCardWidth
              );
              onIndexChange(
                Math.min(Math.max(nextIndex, 0), Math.max(intervals.length - 1, 0))
              );
            }}
            contentContainerStyle={s.intervalCarouselContent}
          >
            {intervals.map((interval, index) => (
              <View
                key={index}
                style={[s.intervalCard, { width: effectiveCardWidth }]}
              >
                <Text style={s.intervalTitle}>Créneau {index + 1}</Text>

                <TextInput
                  style={s.input}
                  value={interval.start}
                  placeholder="Début (ex: 07:00)"
                  onChangeText={(v) => onUpdate(index, "start", v)}
                />

                <TextInput
                  style={s.input}
                  value={interval.end}
                  placeholder="Fin (ex: 10:00)"
                  onChangeText={(v) => onUpdate(index, "end", v)}
                />

                <TouchableOpacity
                  style={s.intervalActions}
                  onPress={() => onRemove(index)}
                >
                  <Text style={s.intervalActionsText}>Supprimer</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          {intervals.length > 1 && (
            <View style={s.carouselControls}>
              <TouchableOpacity
                style={[s.carouselButton, activeIndex === 0 && s.carouselButtonDisabled]}
                disabled={activeIndex === 0}
                onPress={() => onIndexChange(activeIndex - 1)}
              >
                <Text style={s.carouselButtonText}>◀</Text>
              </TouchableOpacity>

              <Text style={s.carouselIndicator}>
                {activeIndex + 1} / {intervals.length}
              </Text>

              <TouchableOpacity
                style={[
                  s.carouselButton,
                  activeIndex === intervals.length - 1 && s.carouselButtonDisabled,
                ]}
                disabled={activeIndex === intervals.length - 1}
                onPress={() => onIndexChange(activeIndex + 1)}
              >
                <Text style={s.carouselButtonText}>▶</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </>
  );
}
