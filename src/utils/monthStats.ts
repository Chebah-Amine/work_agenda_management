import { WorkDay } from "@/domain/models/workDay";
import { calculateTotalMinutes } from "@/utils/time";

export interface MonthStats {
  workedDaysCount: number;
  totalMinutes: number;
  averageMinutesPerWorkedDay: number;
  overtimeMinutes: number;
}

export function computeMonthStats(
  year: number,
  month: number,
  workDays: Record<string, WorkDay>,
  baseMonthlyMinutes: number
): MonthStats {

  let workedDaysCount = 0;
  let totalMinutes = 0;

  // On parcourt les jours du mois
  Object.values(workDays).forEach((day) => {
    const d = new Date(day.date);
    if (d.getFullYear() !== year) return;
    if (d.getMonth() !== month) return;

    if (day.status === "WORKED") {
      workedDaysCount++;
      totalMinutes += calculateTotalMinutes(day.intervals);
    }
  });

  const averageMinutesPerWorkedDay =
    workedDaysCount > 0 ? totalMinutes / workedDaysCount : 0;

  const overtimeMinutes = Math.max(0, totalMinutes - baseMonthlyMinutes);

  return {
    workedDaysCount,
    totalMinutes,
    averageMinutesPerWorkedDay,
    overtimeMinutes,
  };
}
