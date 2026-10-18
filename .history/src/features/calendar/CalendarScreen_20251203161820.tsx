import { DayOffReason, WorkDay, WorkInterval } from "@/domain/models/workDay";
import {
  formatDateKey,
  getDateRange,
  getMonthMatrix,
  getWeekdayIndex1to7,
  isFrenchFixedHoliday,
  isSameDay,
} from "@/utils/date";
import { computeMonthStats } from "@/utils/monthStats";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
  useWindowDimensions,
  View,
} from "react-native";
import { calendarStyles as s } from "./CalendarStyles";
import { useCalendar } from "./useCalendar";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const REASONS: { label: string; value: DayOffReason }[] = [
  { label: "Repos", value: "repos" },
  { label: "Maladie", value: "maladie" },
  { label: "Congé", value: "conge" },
  { label: "Autre", value: "autre" },
];

export function CalendarScreen() {
  const {
    year,
    month,
    settings,
    workDays,
    loading,
    changeMonth,
    saveDay,
    saveDays,
  } = useCalendar();

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [notWorked, setNotWorked] = useState(false);
  const [reason, setReason] = useState<DayOffReason | undefined>(undefined);
  const [intervals, setIntervals] = useState<WorkInterval[]>([]);
  const [activeIntervalIndex, setActiveIntervalIndex] = useState(0);
  const [rangeMode, setRangeMode] = useState(false);
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null);
  const [carouselWidth, setCarouselWidth] = useState(0);

  const intervalScrollRef = useRef<ScrollView | null>(null);
  const { width: windowWidth } = useWindowDimensions();

  const monthMatrix = useMemo(
    () => getMonthMatrix(year, month),
    [year, month]
  );

  useEffect(() => {
    if (!selectedDate) return;

    const key = formatDateKey(selectedDate);
    const day = workDays[key];

    if (!day) {
      setNotWorked(false);
      setReason(undefined);
      setIntervals([]);
      setActiveIntervalIndex(0);
      return;
    }

    if (day.status === "NOT_WORKED") {
      setNotWorked(true);
      setReason(day.dayOffReason);
      setIntervals([]);
      setActiveIntervalIndex(0);
    } else {
      setNotWorked(false);
      setReason(undefined);
      setIntervals(day.intervals || []);
      setActiveIntervalIndex(0);
    }
  }, [selectedDate, workDays]);

  const effectiveCardWidth =
    carouselWidth || Math.max(windowWidth - 120, 260);

  useEffect(() => {
    if (!intervalScrollRef.current || !effectiveCardWidth) return;
    if (!intervals.length) return;
    const bounded = Math.min(
      Math.max(activeIntervalIndex, 0),
      intervals.length - 1
    );
    intervalScrollRef.current.scrollTo({
      x: bounded * effectiveCardWidth,
      animated: true,
    });
  }, [activeIntervalIndex, effectiveCardWidth, intervals.length]);

  function openDay(date: Date) {
    setSelectedDate(date);
    setModalVisible(true);
  }

  function addInterval() {
    const updated = [...intervals, { start: "", end: "" }];
    setIntervals(updated);
    setActiveIntervalIndex(updated.length - 1);
  }

  function updateInterval(index: number, field: "start" | "end", value: string) {
    const updated = [...intervals];
    updated[index][field] = value;
    setIntervals(updated);
  }

  function removeInterval(index: number) {
    const updated = intervals.filter((_, i) => i !== index);
    setIntervals(updated);
    if (activeIntervalIndex >= updated.length) {
      setActiveIntervalIndex(Math.max(updated.length - 1, 0));
    }
  }

  function goToInterval(index: number) {
    const bounded = Math.min(
      Math.max(index, 0),
      Math.max(intervals.length - 1, 0)
    );
    setActiveIntervalIndex(bounded);
  }

  function toggleRangeMode() {
    setRangeMode((prev) => {
      const next = !prev;
      if (!next) {
        clearRange();
      }
      return next;
    });
  }

  function clearRange() {
    setRangeStart(null);
    setRangeEnd(null);
  }

  function handleRangeSelection(date: Date) {
    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(date);
      setRangeEnd(null);
      return;
    }

    if (isSameDay(date, rangeStart)) {
      return;
    }

    if (date < rangeStart) {
      setRangeStart(date);
      setRangeEnd(rangeStart);
    } else {
      setRangeEnd(date);
    }
  }

  function handleDayPress(date: Date) {
    if (rangeMode) {
      if (rangeStart && rangeEnd) {
        openDay(date);
      } else {
        handleRangeSelection(date);
      }
      return;
    }
    openDay(date);
  }

  function buildWorkDayPayload(date: Date): WorkDay {
    const key = formatDateKey(date);

    if (notWorked) {
      return {
        date: key,
        status: "NOT_WORKED",
        intervals: [],
        dayOffReason: reason || "repos",
      };
    }

    const cleaned = intervals.filter((i) => i.start && i.end);
    return {
      date: key,
      status: "WORKED",
      intervals: cleaned,
    };
  }

  async function onSave() {
    if (!selectedDate) return;
    const updated = buildWorkDayPayload(selectedDate);
    await saveDay(updated);
    setModalVisible(false);
  }

  async function onApplyToRange() {
    if (!selectedDate || !rangeStart || !rangeEnd) return;
    const base = buildWorkDayPayload(selectedDate);
    const days = getDateRange(rangeStart, rangeEnd).map((date) => ({
      ...base,
      date: formatDateKey(date),
    }));
    await saveDays(days);
    setModalVisible(false);
  }

  function isDateInSelectedRange(date: Date): boolean {
    if (!rangeStart || !rangeEnd) return false;
    const start = rangeStart < rangeEnd ? rangeStart : rangeEnd;
    const end = rangeStart < rangeEnd ? rangeEnd : rangeStart;
    return date >= start && date <= end;
  }

  function getDayStyle(date: Date | null): StyleProp<ViewStyle> {
    if (!date) {
      return [s.dayCell, s.dayCellMuted];
    }

    const stylesArray: Array<StyleProp<ViewStyle>> = [s.dayCell];
    const inMonth = date.getMonth() === month;
    const key = formatDateKey(date);
    const workDay = workDays[key];

    if (!inMonth) {
      stylesArray.push(s.dayCellMuted);
      return stylesArray;
    }

    const isHoliday = isFrenchFixedHoliday(date);
    if (isHoliday) {
      stylesArray.push(s.dayCellHoliday);
      return stylesArray;
    }

    const isWorkingDay =
      !!settings?.workingDays.includes(getWeekdayIndex1to7(date));

    if (workDay?.status === "WORKED" && workDay.intervals?.length > 0) {
      stylesArray.push(s.dayCellWorked);
    }

    if (workDay?.status === "NOT_WORKED") {
      stylesArray.push(s.dayCellMuted);
    }

    if (isWorkingDay && !workDay) {
      stylesArray.push(s.dayCellWorking);
    }

    const isEdge =
      (rangeStart && isSameDay(date, rangeStart)) ||
      (rangeEnd && isSameDay(date, rangeEnd));
    const inRange = isDateInSelectedRange(date);

    if (inRange && !isEdge) {
      stylesArray.push(s.dayCellRange);
    }
    if (isEdge) {
      stylesArray.push(s.dayCellRangeEdge);
    }

    return stylesArray;
  }

  const monthStats = useMemo(() => {
    if (!settings) return null;
    return computeMonthStats(
      year,
      month,
      workDays,
      settings.baseMonthlyMinutes
    );
  }, [year, month, workDays, settings]);

  function getMonthLabel() {
    const months = [
      "Janvier",
      "Février",
      "Mars",
      "Avril",
      "Mai",
      "Juin",
      "Juillet",
      "Août",
      "Septembre",
      "Octobre",
      "Novembre",
      "Décembre",
    ];
    return `${months[month]} ${year}`;
  }

  function formatDisplayDate(date: Date) {
    const d = date.getDate().toString().padStart(2, "0");
    const m = (date.getMonth() + 1).toString().padStart(2, "0");
    return `${d}/${m}/${date.getFullYear()}`;
  }

  if (loading || !settings) {
    return (
      <View
        style={[
          s.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text>Chargement...</Text>
      </View>
    );
  }

  const hasRange = !!(rangeStart && rangeEnd);

  return (
    <View style={s.container}>
      {/* Légende */}
      <View style={s.legendContainer}>
        <View style={s.legendItem}>
          <View style={[s.legendColor, { backgroundColor: "#FEF3C7" }]} />
          <Text>Jour travaillé (non saisi)</Text>
        </View>
        <View style={s.legendItem}>
          <View style={[s.legendColor, { backgroundColor: "#BBF7D0" }]} />
          <Text>Jour saisi</Text>
        </View>
        <View style={s.legendItem}>
          <View style={[s.legendColor, { backgroundColor: "#FECACA" }]} />
          <Text>Jour férié</Text>
        </View>
        <View style={s.legendItem}>
          <View style={[s.legendColor, { backgroundColor: "#F3F4F6" }]} />
          <Text>Hors mois / non travaillé</Text>
        </View>
      </View>

      {/* Header mois */}
      <View style={s.header}>
        <TouchableOpacity style={s.navButton} onPress={() => changeMonth(-1)}>
          <Text style={s.navText}>◀</Text>
        </TouchableOpacity>
        <Text style={s.monthTitle}>{getMonthLabel()}</Text>
        <TouchableOpacity style={s.navButton} onPress={() => changeMonth(1)}>
          <Text style={s.navText}>▶</Text>
        </TouchableOpacity>
      </View>

      {/* Barre de sélection d'intervalle */}
      <View style={s.rangeBar}>
        <TouchableOpacity
          style={[s.rangeToggle, rangeMode && s.rangeToggleActive]}
          onPress={toggleRangeMode}
        >
          <Text
            style={[
              s.rangeToggleText,
              rangeMode && s.rangeToggleTextActive,
            ]}
          >
            Mode intervalle
          </Text>
        </TouchableOpacity>
        <View style={s.rangeInfo}>
          <Text style={s.rangeInfoText}>
            Début : {rangeStart ? formatDisplayDate(rangeStart) : "--"}
          </Text>
          <Text style={s.rangeInfoText}>
            Fin : {rangeEnd ? formatDisplayDate(rangeEnd) : "--"}
          </Text>
        </View>
        {(rangeStart || rangeEnd) && (
          <TouchableOpacity style={s.rangeClear} onPress={clearRange}>
            <Text style={s.rangeClearText}>Réinitialiser</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Noms des jours */}
      <View style={s.weekHeader}>
        {WEEKDAYS.map((d) => (
          <Text key={d} style={s.weekHeaderCell}>
            {d}
          </Text>
        ))}
      </View>

      {/* Grille */}
      <ScrollView contentContainerStyle={s.grid}>
        {monthMatrix.map((week, i) => (
          <View key={i} style={s.weekRow}>
            {week.map((date, j) => (
              <TouchableOpacity
                key={j}
                style={getDayStyle(date)}
                disabled={!date}
                onPress={() => date && handleDayPress(date)}
              >
                {date && <Text style={s.dayCellText}>{date.getDate()}</Text>}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>

      {/* Statistiques mensuelles */}
      {monthStats && (
        <View style={s.statsContainer}>
          <View style={s.statsBox}>
            <Text style={s.statsValue}>{monthStats.workedDaysCount}</Text>
            <Text style={s.statsLabel}>Jours travaillés</Text>
          </View>

          <View style={s.statsBox}>
            <Text style={s.statsValue}>
              {(monthStats.totalMinutes / 60).toFixed(1)} h
            </Text>
            <Text style={s.statsLabel}>Heures totales</Text>
          </View>

          <View style={s.statsBox}>
            <Text style={s.statsValue}>
              {(monthStats.averageMinutesPerWorkedDay / 60).toFixed(1)} h
            </Text>
            <Text style={s.statsLabel}>Heures / jour</Text>
          </View>

          <View style={s.statsBox}>
            <Text
              style={[
                s.statsValue,
                { color: monthStats.overtimeMinutes > 0 ? "#DC2626" : "#10B981" },
              ]}
            >
              {(monthStats.overtimeMinutes / 60).toFixed(1)} h
            </Text>
            <Text style={s.statsLabel}>Heures sup.</Text>
          </View>
        </View>
      )}

      {/* Popup */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <ScrollView contentContainerStyle={s.modalScrollContent}>
              <Text style={s.modalTitle}>
                {selectedDate && formatDisplayDate(selectedDate)}
              </Text>

              <View style={s.checkboxRow}>
                <Switch value={notWorked} onValueChange={setNotWorked} />
                <Text>Je n'ai pas travaillé ce jour-là</Text>
              </View>

              {!notWorked && (
                <>
                  <View style={s.intervalHeaderRow}>
                    <Text style={s.label}>Créneaux</Text>
                    <TouchableOpacity
                      style={s.addIntervalButton}
                      onPress={addInterval}
                    >
                      <Text style={s.addIntervalText}>
                        + Ajouter un créneau
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {intervals.length === 0 && (
                    <View style={s.intervalEmpty}>
                      <Text style={s.intervalEmptyText}>
                        Ajoutez un créneau pour commencer
                      </Text>
                    </View>
                  )}

                  {intervals.length > 0 && (
                    <View
                      style={s.intervalCarousel}
                      onLayout={(e) =>
                        setCarouselWidth(e.nativeEvent.layout.width)
                      }
                    >
                      <ScrollView
                        ref={intervalScrollRef}
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
                          setActiveIntervalIndex(
                            Math.min(
                              Math.max(nextIndex, 0),
                              Math.max(intervals.length - 1, 0)
                            )
                          );
                        }}
                        contentContainerStyle={s.intervalCarouselContent}
                      >
                        {intervals.map((interval, index) => (
                          <View
                            key={index}
                            style={[
                              s.intervalCard,
                              { width: effectiveCardWidth },
                            ]}
                          >
                            <Text style={s.intervalTitle}>
                              Créneau {index + 1}
                            </Text>

                            <TextInput
                              style={s.input}
                              value={interval.start}
                              placeholder="Début (ex: 07:00)"
                              onChangeText={(v) =>
                                updateInterval(index, "start", v)
                              }
                            />

                            <TextInput
                              style={s.input}
                              value={interval.end}
                              placeholder="Fin (ex: 10:00)"
                              onChangeText={(v) =>
                                updateInterval(index, "end", v)
                              }
                            />

                            <TouchableOpacity
                              style={s.intervalActions}
                              onPress={() => removeInterval(index)}
                            >
                              <Text style={s.intervalActionsText}>
                                Supprimer
                              </Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                      </ScrollView>

                      {intervals.length > 1 && (
                        <View style={s.carouselControls}>
                          <TouchableOpacity
                            style={[
                              s.carouselButton,
                              activeIntervalIndex === 0 &&
                                s.carouselButtonDisabled,
                            ]}
                            disabled={activeIntervalIndex === 0}
                            onPress={() =>
                              goToInterval(activeIntervalIndex - 1)
                            }
                          >
                            <Text style={s.carouselButtonText}>◀</Text>
                          </TouchableOpacity>

                          <Text style={s.carouselIndicator}>
                            {activeIntervalIndex + 1} / {intervals.length}
                          </Text>

                          <TouchableOpacity
                            style={[
                              s.carouselButton,
                              activeIntervalIndex === intervals.length - 1 &&
                                s.carouselButtonDisabled,
                            ]}
                            disabled={
                              activeIntervalIndex === intervals.length - 1
                            }
                            onPress={() =>
                              goToInterval(activeIntervalIndex + 1)
                            }
                          >
                            <Text style={s.carouselButtonText}>▶</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  )}
                </>
              )}

              {notWorked && (
                <>
                  <Text style={s.label}>Raison</Text>
                  <View style={s.reasonButtonsRow}>
                    {REASONS.map((r) => {
                      const selected = reason === r.value;
                      return (
                        <TouchableOpacity
                          key={r.value}
                          style={[
                            s.reasonButton,
                            selected && s.reasonButtonSelected,
                          ]}
                          onPress={() => setReason(r.value)}
                        >
                          <Text
                            style={[
                              s.reasonText,
                              selected && s.reasonTextSelected,
                            ]}
                          >
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
                    Applique les réglages de ce jour sur l'intervalle
                    sélectionné.
                  </Text>
                </View>
              )}

              <View style={s.modalButtonsRow}>
                <TouchableOpacity
                  style={s.cancelButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={s.cancelText}>Annuler</Text>
                </TouchableOpacity>

                {hasRange && (
                  <TouchableOpacity
                    style={s.applyRangeButton}
                    onPress={onApplyToRange}
                  >
                    <Text style={s.buttonText}>Appliquer intervalle</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={s.saveButton} onPress={onSave}>
                  <Text style={s.buttonText}>Enregistrer</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
