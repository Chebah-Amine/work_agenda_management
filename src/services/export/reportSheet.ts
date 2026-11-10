import { formatDayMonth, parseDateKey } from "@/domain/date";
import { MonthlyReport } from "@/domain/report";
import { formatDuration } from "@/domain/time";

export type SheetCell = string | number | null;

/** Heures décimales (4 h 30 → 4,5) : directement utilisables dans des formules Excel. */
const hours = (minutes: number) => Math.round((minutes / 60) * 100) / 100;

/** Contenu de la feuille Excel du relevé, ligne par ligne. */
export function buildReportRows(report: MonthlyReport): SheetCell[][] {
  const { summary } = report;
  const rows: SheetCell[][] = [
    [report.title],
    [report.employeeName || null],
    [`Durée du contrat : ${formatDuration(report.contractMinutes)} par semaine`],
    [],
    ["Jour", "Créneaux", "Durée", "Heures (décimal)", "Remarque"],
  ];

  for (const row of report.rows) {
    rows.push([
      row.dayLabel,
      row.intervals,
      row.minutes > 0 ? formatDuration(row.minutes) : "",
      row.minutes > 0 ? hours(row.minutes) : null,
      row.note,
    ]);
  }
  rows.push([
    `Total du mois (${summary.workedDays} jours travaillés)`,
    "",
    formatDuration(summary.totalMinutes),
    hours(summary.totalMinutes),
    "",
  ]);

  rows.push(
    [],
    ["Heures complémentaires, semaine par semaine (heures décimales)"],
    ["Semaine", "Heures travaillées", "Compl. +10 %", "Compl. +25 %", "Supplémentaires", "Comptée ce mois"]
  );
  for (const week of summary.weeks) {
    rows.push([
      `Du ${formatDayMonth(parseDateKey(week.weekStart))} au ${formatDayMonth(parseDateKey(week.weekEnd))}`,
      hours(week.workedMinutes),
      hours(week.complementary10),
      hours(week.complementary25),
      hours(week.overtime),
      week.countedInMonth ? "Oui" : "Non (mois suivant)",
    ]);
  }
  rows.push([
    "Total retenu pour le mois",
    null,
    hours(summary.complementary10),
    hours(summary.complementary25),
    hours(summary.overtime),
    "",
  ]);

  return rows;
}
