import {
  WEEKDAY_SHORT,
  formatDayMonth,
  formatMonthLabel,
  getFrenchHolidayName,
  toDateKey,
  weekdayIndex,
} from "./date";
import { AppData } from "./models/appData";
import { dayOffLabel } from "./models/workDay";
import { MonthSummary, summarizeMonth } from "./overtime";
import { formatIntervals, totalMinutes } from "./time";

export interface ReportDayRow {
  dateKey: string;
  /** "Lun 02/11" */
  dayLabel: string;
  /** "07:00–09:00, 16:00–18:00" ou vide */
  intervals: string;
  minutes: number;
  /** Férié, motif d'absence, commentaire du jour… */
  note: string;
}

export interface MonthlyReport {
  title: string;
  employeeName: string;
  year: number;
  month: number;
  contractMinutes: number;
  rows: ReportDayRow[];
  summary: MonthSummary;
}

export function buildMonthlyReport(
  year: number,
  month: number,
  data: Pick<AppData, "settings" | "workDays">
): MonthlyReport {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const rows: ReportDayRow[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const dateKey = toDateKey(date);
    const day = data.workDays[dateKey];
    const notes: string[] = [];

    const holiday = getFrenchHolidayName(date);
    if (holiday) notes.push(`Férié (${holiday})`);
    if (day?.status === "NOT_WORKED") notes.push(dayOffLabel(day.dayOffReason));
    if (day?.comment) notes.push(day.comment);

    const worked = day?.status === "WORKED";
    rows.push({
      dateKey,
      dayLabel: `${WEEKDAY_SHORT[weekdayIndex(date) - 1]} ${formatDayMonth(date)}`,
      intervals: worked ? formatIntervals(day.intervals) : "",
      minutes: worked ? totalMinutes(day.intervals) : 0,
      note: notes.join(" · "),
    });
  }

  return {
    title: `Relevé d'heures – ${formatMonthLabel(year, month)}`,
    employeeName: data.settings.employeeName.trim(),
    year,
    month,
    contractMinutes: data.settings.weeklyContractMinutes,
    rows,
    summary: summarizeMonth(year, month, data.workDays, data.settings.weeklyContractMinutes),
  };
}

/** Nom de fichier sans extension : "releve-heures-2026-11". */
export function reportFileName(report: MonthlyReport): string {
  return `releve-heures-${report.year}-${String(report.month + 1).padStart(2, "0")}`;
}
