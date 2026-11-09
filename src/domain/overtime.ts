import { addDays, startOfWeek, toDateKey } from "./date";
import { WorkDay } from "./models/workDay";
import { LEGAL_WEEKLY_MINUTES } from "./models/workSettings";
import { totalMinutes } from "./time";

export interface ExtraHours {
  /** Heures complémentaires majorées à 10 % (jusqu'à 1/10 de la durée du contrat). */
  complementary10: number;
  /** Heures complémentaires majorées à 25 % (au-delà du 1/10). */
  complementary25: number;
  /** Heures supplémentaires (au-delà de 35 h dans la semaine). */
  overtime: number;
}

/**
 * Répartit les minutes travaillées d'une semaine au-delà du contrat.
 * Temps partiel : complémentaires entre le contrat et 35 h, supplémentaires au-delà.
 */
export function computeExtraHours(
  workedMinutes: number,
  contractMinutes: number,
  legalMinutes: number = LEGAL_WEEKLY_MINUTES
): ExtraHours {
  const overtime = Math.max(0, workedMinutes - Math.max(legalMinutes, contractMinutes));
  const complementary = Math.max(0, Math.min(workedMinutes, legalMinutes) - contractMinutes);
  const complementary10 = Math.min(complementary, contractMinutes / 10);
  return {
    complementary10,
    complementary25: complementary - complementary10,
    overtime,
  };
}

export interface WeekSummary extends ExtraHours {
  /** Lundi de la semaine (YYYY-MM-DD). */
  weekStart: string;
  /** Dimanche de la semaine (YYYY-MM-DD). */
  weekEnd: string;
  workedMinutes: number;
  contractMinutes: number;
}

export function summarizeWeek(
  anyDayOfWeek: Date,
  workDays: Record<string, WorkDay>,
  contractMinutes: number
): WeekSummary {
  const monday = startOfWeek(anyDayOfWeek);
  let workedMinutes = 0;
  for (let i = 0; i < 7; i++) {
    const day = workDays[toDateKey(addDays(monday, i))];
    if (day?.status === "WORKED") workedMinutes += totalMinutes(day.intervals);
  }
  return {
    weekStart: toDateKey(monday),
    weekEnd: toDateKey(addDays(monday, 6)),
    workedMinutes,
    contractMinutes,
    ...computeExtraHours(workedMinutes, contractMinutes),
  };
}

export interface MonthWeekSummary extends WeekSummary {
  /**
   * Une semaine à cheval sur deux mois est rattachée au mois où elle se termine
   * (dimanche) : ses heures complémentaires ne sont comptées qu'une fois.
   */
  countedInMonth: boolean;
}

export interface MonthSummary extends ExtraHours {
  weeks: MonthWeekSummary[];
  /** Minutes travaillées du 1er au dernier jour du mois. */
  totalMinutes: number;
  workedDays: number;
  absenceDays: number;
}

export function summarizeMonth(
  year: number,
  month: number,
  workDays: Record<string, WorkDay>,
  contractMinutes: number
): MonthSummary {
  const lastDay = new Date(year, month + 1, 0);
  const weeks: MonthWeekSummary[] = [];

  for (
    let monday = startOfWeek(new Date(year, month, 1));
    monday <= lastDay;
    monday = addDays(monday, 7)
  ) {
    const sunday = addDays(monday, 6);
    weeks.push({
      ...summarizeWeek(monday, workDays, contractMinutes),
      countedInMonth: sunday.getMonth() === month && sunday.getFullYear() === year,
    });
  }

  let total = 0;
  let workedDays = 0;
  let absenceDays = 0;
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const day = workDays[toDateKey(new Date(year, month, d))];
    if (!day) continue;
    if (day.status === "WORKED") {
      workedDays++;
      total += totalMinutes(day.intervals);
    } else {
      absenceDays++;
    }
  }

  const counted = weeks.filter((w) => w.countedInMonth);
  const sum = (pick: (w: WeekSummary) => number) =>
    counted.reduce((s, w) => s + pick(w), 0);

  return {
    weeks,
    totalMinutes: total,
    workedDays,
    absenceDays,
    complementary10: sum((w) => w.complementary10),
    complementary25: sum((w) => w.complementary25),
    overtime: sum((w) => w.overtime),
  };
}
