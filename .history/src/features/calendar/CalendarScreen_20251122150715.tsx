import { DayOffReason, WorkDay, WorkInterval } from "@/domain/models/workDay";
import {
  formatDateKey,
  getMonthMatrix,
  getWeekdayIndex1to7,
  isFrenchFixedHoliday,
} from "@/utils/date";
import { computeMonthStats } from "@/utils/monthStats";
import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { calendarStyles as s } from "./CalendarStyles";
import { useCalendar } from "./useCalendar";



const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const REASONS: { label: string; value: DayOffReason }[] = [
  { label: "Repos", value: "repos" },
  { label: "Maladie", value: "maladie" },
  { label: "Congé", value: "congé" },
  { label: "Autre", value: "autre" },
];

export function CalendarScreen() {
  const { year, month, settings, workDays, loading, changeMonth, saveDay } =
    useCalendar();

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [notWorked, setNotWorked] = useState(false);
  const [reason, setReason] = useState<DayOffReason | undefined>(undefined);
  const [intervals, setIntervals] = useState<WorkInterval[]>([]);

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
      return;
    }

    if (day.status === "NOT_WORKED") {
      setNotWorked(true);
      setReason(day.dayOffReason);
      setIntervals([]);
    } else {
      setNotWorked(false);
      setReason(undefined);
      setIntervals(day.intervals || []);
    }
  }, [selectedDate, workDays]);

  function openDay(date: Date) {
    setSelectedDate(date);
    setModalVisible(true);
  }

  function addInterval() {
    setIntervals([...intervals, { start: "", end: "" }]);
  }

  function updateInterval(index: number, field: "start" | "end", value: string) {
    const updated = [...intervals];
    updated[index][field] = value;
    setIntervals(updated);
  }

  function removeInterval(index: number) {
    setIntervals(intervals.filter((_, i) => i !== index));
  }

  async function onSave() {
    if (!selectedDate) return;

    const key = formatDateKey(selectedDate);

    let updated: WorkDay;

    if (notWorked) {
      updated = {
        date: key,
        status: "NOT_WORKED",
        intervals: [],
        dayOffReason: reason || "repos",
      };
    } else {
      const cleaned = intervals.filter((i) => i.start && i.end);
      updated = {
        date: key,
        status: "WORKED",
        intervals: cleaned,
      };
    }

    await saveDay(updated);
    setModalVisible(false);
  }

  function getDayStyle(date: Date | null) {
    if (!date) {
      return [s.dayCell, s.dayCellMuted];
    }

    const inMonth = date.getMonth() === month;
    const key = formatDateKey(date);
    const workDay = workDays[key];

    if (!inMonth) {
      return [s.dayCell, s.dayCellMuted];
    }

    const isHoliday = isFrenchFixedHoliday(date);
    if (isHoliday) {
      return [s.dayCell, s.dayCellHoliday];
    }

    const isWorkingDay =
      !!settings?.workingDays.includes(getWeekdayIndex1to7(date));

    if (workDay?.status === "WORKED" && workDay.intervals?.length > 0) {
      return [s.dayCell, s.dayCellWorked];
    }

    if (workDay?.status === "NOT_WORKED") {
      // on pourrait mettre un style spécial plus tard si tu veux
      return [s.dayCell, s.dayCellMuted];
    }

    if (isWorkingDay && !workDay) {
      return [s.dayCell, s.dayCellWorking];
    }

    return [s.dayCell];
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

  return (
    <View style={s.container}>
      {/* Légende */}
      <View style={s.legendContainer}>
        <View style={s.legendItem}>
          <View
            style={[s.legendColor, { backgroundColor: "#FEF3C7" }]}
          />
          <Text>Jour travaillé (non saisi)</Text>
        </View>
        <View style={s.legendItem}>
          <View
            style={[s.legendColor, { backgroundColor: "#BBF7D0" }]}
          />
          <Text>Jour saisi</Text>
        </View>
        <View style={s.legendItem}>
          <View
            style={[s.legendColor, { backgroundColor: "#FECACA" }]}
          />
          <Text>Jour férié</Text>
        </View>
        <View style={s.legendItem}>
          <View
            style={[s.legendColor, { backgroundColor: "#F3F4F6" }]}
          />
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
                onPress={() => date && openDay(date)}
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
            <Text style={s.modalTitle}>
              {selectedDate &&
                `${selectedDate.getDate()}/${
                  selectedDate.getMonth() + 1
                }/${selectedDate.getFullYear()}`}
            </Text>

            <View style={s.checkboxRow}>
              <Switch value={notWorked} onValueChange={setNotWorked} />
              <Text>Je n'ai pas travaillé ce jour-là</Text>
            </View>

            {!notWorked && (
              <>
                {intervals.map((interval, index) => (
                  <View key={index} style={s.intervalBlock}>
                    <Text style={s.label}>Créneau {index + 1}</Text>

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
                      onChangeText={(v) => updateInterval(index, "end", v)}
                    />

                    <TouchableOpacity
                      style={s.intervalActions}
                      onPress={() => removeInterval(index)}
                    >
                      <Text style={s.intervalActionsText}>Supprimer</Text>
                    </TouchableOpacity>
                  </View>
                ))}

                <TouchableOpacity
                  style={s.addIntervalButton}
                  onPress={addInterval}
                >
                  <Text style={s.addIntervalText}>
                    + Ajouter un créneau
                  </Text>
                </TouchableOpacity>
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

            <View style={s.modalButtonsRow}>
              <TouchableOpacity
                style={s.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={s.cancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.saveButton} onPress={onSave}>
                <Text style={s.buttonText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
