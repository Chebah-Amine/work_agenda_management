import { AppData } from "@/domain/models/appData";
import { WorkDay } from "@/domain/models/workDay";
import { WorkSettings } from "@/domain/models/workSettings";
import { getStorage } from "@/services/storage";
import { useEffect, useState } from "react";

export function useCalendar() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [settings, setSettings] = useState<WorkSettings | undefined>(undefined);
  const [workDays, setWorkDays] = useState<Record<string, WorkDay>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const data: AppData = (await getStorage().load()) || { workDays: {} };
      setSettings(data.settings);
      setWorkDays(data.workDays || {});
      setLoading(false);
    })();
  }, []);

  function changeMonth(offset: number) {
    setMonth((prev) => {
      const newMonth = prev + offset;
      if (newMonth < 0) {
        setYear((y) => y - 1);
        return 11;
      }
      if (newMonth > 11) {
        setYear((y) => y + 1);
        return 0;
      }
      return newMonth;
    });
  }

  async function saveDays(updatedDays: WorkDay[]) {
    const existing: AppData = (await getStorage().load()) || { workDays: {} };
    const merged = { ...existing.workDays, ...workDays };

    updatedDays.forEach((day) => {
      merged[day.date] = day;
    });

    setWorkDays(merged);

    await getStorage().save({
      ...existing,
      workDays: merged,
    });
  }

  async function saveDay(updated: WorkDay) {
    const key = updated.date;
    const newWorkDays = { ...workDays, [key]: updated };
    setWorkDays(newWorkDays);

    const existing: AppData = (await getStorage().load()) || { workDays: {} };
    await getStorage().save({
      ...existing,
      workDays: newWorkDays,
    });
  }

  return {
    year,
    month,
    settings,
    workDays,
    loading,
    changeMonth,
    saveDay,
    saveDays,
  };
}
