import { DayOffReason, WorkDay } from "@/domain/models/workDay";
import { formatDateKey, getMonthMatrix, isFrenchFixedHoliday } from "@/utils/date";
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
  const { year, month, settings, workDays, loading, changeMonth, saveDay } = useCalendar();

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [breakMinutes, setBreakMinutes] = useState("");
  const [notWorked, setNotWorked] = useState(false);
  const [reason, setReason] = useState<DayOffReason | undefined>(undefined);

  const monthMatrix = useMemo(() => getMonthMatrix(year, month), [year, month]);

  useEffect(() => {
    if (!selectedDate) return;
    const key = formatDateKey(selectedDate);
    const day = workDays[key];

    if (day) {
      if (day.status === "WORKED" && day.manualEntries[0]) {
        const entry = day.manualEntries[0];
        setStartTime(entry.start);
        setEndTime(entry.end);
        setBreakMinutes(entry.breakMinutes ? String(entry.breakMinutes) : "");
        setNotWorked(false);
        setReason(undefined);
      } else if (day.status === "NOT_WORKED") {
        setStartTime("");
        setEndTime("");
        setBreakMinutes("");
        setNotWorked(true);
        setReason(day.dayOffReason);
      } else {
        resetModalFields();
      }
    } else {
      resetModalFields();
    }
  }, [selectedDate, workDays]);

  function resetModalFields() {
    setStartTime("");
    setEndTime("");
    setBreakMinutes("");
    setNotWorked(false);
    setReason(undefined);
  }

  function openDay(date: Date) {
    setSelectedDate(date);
    setModalVisible(true);
  }

  async function onSave() {
    if (!selectedDate) return;
    const key = formatDateKey(selectedDate);

    let updated: WorkDay;

    if (notWorked) {
      updated = {
        date: key,
        status: "NOT_WORKED",
        manualEntries: [],
        dayOffReason: reason || "repos",
      };
    } else {
      updated = {
        date: key,
        status: "WORKED",
        manualEntries: [
          {
            start: startTime,
            end: endTime,
            breakMinutes: breakMinutes ? Number(breakMinutes) : 0,
          },
        ],
      };
    }

    await saveDay(updated);
    setModalVisible(false);
  }

  function getDayStyle(date: Date | null) {
    if (!date) {
      return [s.dayCell, s.dayCellMuted];
    }

    const key = formatDateKey(date);
    const inMonth = date.getMonth() === month;

    if (!inMonth) {
      return [s.dayCell, s.dayCellMuted];
    }

    const isHoliday = isFrenchFixedHoliday(date);
    if (isHoliday) {
      return [s.dayCell, s.dayCellHoliday];
    }

    const isWorkingDay =
      !!settings?.workingDays.includes(((date.getDay() + 6) % 7) + 1); // 1-7 lundi-dimanche

    const workDay = workDays[key];

    if (workDay && workDay.status === "WORKED") {
      return [s.dayCell, s.dayCellWorked];
    }

    if (isWorkingDay && !workDay) {
      return [s.dayCell, s.dayCellWorking];
    }

    return [s.dayCell];
  }

  function getMonthLabel() {
    const months = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
    ];
    return `${months[month]} ${year}`;
  }

  if (loading || !settings) {
    return (
      <View style={[s.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text>Chargement...</Text>
      </View>
    );
  }

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
                {date && (
                  <Text style={s.dayCellText}>{date.getDate()}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>

      {/* Popup */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>
              {selectedDate &&
                `${selectedDate.getDate()}/${selectedDate.getMonth() + 1}/${selectedDate.getFullYear()}`}
            </Text>

            <View style={s.checkboxRow}>
              <Switch value={notWorked} onValueChange={setNotWorked} />
              <Text>Je n'ai pas travaillé ce jour-là</Text>
            </View>

            {!notWorked && (
              <>
                <Text style={s.label}>Heure de début (HH:MM)</Text>
                <TextInput
                  style={s.input}
                  value={startTime}
                  onChangeText={setStartTime}
                  placeholder="08:30"
                />

                <Text style={s.label}>Heure de fin (HH:MM)</Text>
                <TextInput
                  style={s.input}
                  value={endTime}
                  onChangeText={setEndTime}
                  placeholder="17:00"
                />

                <Text style={s.label}>Pause (minutes)</Text>
                <TextInput
                  style={s.input}
                  keyboardType="numeric"
                  value={breakMinutes}
                  onChangeText={setBreakMinutes}
                  placeholder="60"
                />
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
