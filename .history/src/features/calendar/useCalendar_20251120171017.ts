import { useEffect, useState } from "react";
import { getStorage } from "@/services/storage";
import { AppData } from "@/domain/models/appData";
import { WorkDay, DayOffReason } from "@/domain/models/workDay";
import { WorkSettings } from "@/domain/models/workSettings";
import { formatDateKey } from "@/utils/date";

interface DayInfo {
  date: Date;
  key: string;
  isCurrentMonth: boolean;
  isWorkingDay: boolean;
  isHoliday: boolean;
  workDay?: WorkDay;
}

export function useCalendar() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-11
  const [settings, setSettings] = useState<WorkSettings | undefined>(undefined);
  const [workDays, setWorkDays] = useState<Record<string, WorkDay>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data: AppData = (await getStorage().load()) || { workDays: {} };
      setSettings(data.settings);
      setWorkDays(data.workDays || {});
      setLoading(false);
    };
    load();
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
  };
}
