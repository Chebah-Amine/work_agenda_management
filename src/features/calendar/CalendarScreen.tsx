import { useEffect, useMemo, useRef, useState } from "react";
import {
  ScrollView,
  StyleProp,
  Text,
  View,
  ViewStyle,
  useWindowDimensions,
} from "react-native";
import { DayOffReason, WorkDay, WorkInterval } from "@/domain/models/workDay";
import {
  formatDateKey,
  getDateRange,
  getMonthMatrix,
  getWeekdayIndex1to7,
  isFrenchFixedHoliday,
  isSameDay,
} from "@/utils/date";
import { computeMonthStats, MonthStats } from "@/utils/monthStats";
import { calendarStyles as s } from "./CalendarStyles";
import { useCalendar } from "./useCalendar";
import { CalendarLegend } from "./components/CalendarLegend";
import { MonthHeader } from "./components/MonthHeader";
import { RangeSelector } from "./components/RangeSelector";
import { MonthGrid } from "./components/MonthGrid";
import { StatsBar } from "./components/StatsBar";
import { DayModal } from "./components/DayModal";

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

  const monthStats: MonthStats | null = useMemo(() => {
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
      <CalendarLegend />

      <MonthHeader
        monthLabel={getMonthLabel()}
        onPrev={() => changeMonth(-1)}
        onNext={() => changeMonth(1)}
      />

      <RangeSelector
        rangeMode={rangeMode}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        onToggle={toggleRangeMode}
        onClear={clearRange}
        formatDisplayDate={formatDisplayDate}
      />

      <ScrollView contentContainerStyle={{ paddingBottom: 8 }}>
        <MonthGrid
          monthMatrix={monthMatrix}
          weekDays={WEEKDAYS}
          getDayStyle={getDayStyle}
          onDayPress={handleDayPress}
        />
      </ScrollView>

      <StatsBar stats={monthStats} />

      <DayModal
        visible={modalVisible}
        selectedDate={selectedDate}
        notWorked={notWorked}
        reason={reason}
        intervals={intervals}
        activeIntervalIndex={activeIntervalIndex}
        hasRange={hasRange}
        effectiveCardWidth={effectiveCardWidth}
        intervalScrollRef={intervalScrollRef}
        reasons={REASONS}
        onClose={() => setModalVisible(false)}
        onToggleNotWorked={setNotWorked}
        onAddInterval={addInterval}
        onUpdateInterval={updateInterval}
        onRemoveInterval={removeInterval}
        onIntervalIndexChange={goToInterval}
        onCarouselWidth={(w) => {
          if (w > 0) {
            setCarouselWidth(w);
          }
        }}
        onApplyToRange={onApplyToRange}
        onSave={onSave}
        onSelectReason={setReason}
        formatDisplayDate={formatDisplayDate}
      />
    </View>
  );
}
