// State pour les intervalles
const [intervals, setIntervals] = useState<WorkInterval[]>([]);

// Quand un jour est sélectionné
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

// Ajouter intervalle
function addInterval() {
  setIntervals([...intervals, { start: "", end: "" }]);
}

// Modifier intervalle
function updateInterval(index: number, field: "start" | "end", value: string) {
  const updated = [...intervals];
  updated[index][field] = value;
  setIntervals(updated);
}

// Supprimer intervalle
function removeInterval(index: number) {
  const updated = intervals.filter((_, i) => i !== index);
  setIntervals(updated);
}

// Sauvegarde
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
    updated = {
      date: key,
      status: "WORKED",
      intervals: intervals.filter(i => i.start && i.end),
    };
  }

  await saveDay(updated);
  setModalVisible(false);
}
