import { formatDayMonth, parseDateKey } from "@/domain/date";
import { MonthlyReport } from "@/domain/report";
import { formatDuration } from "@/domain/time";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const duration = (minutes: number) => (minutes > 0 ? formatDuration(minutes) : "");

/** Page HTML du relevé mensuel, convertie en PDF par le téléphone. */
export function buildReportHtml(report: MonthlyReport): string {
  const { summary } = report;

  const dayRows = report.rows
    .map(
      (row) => `<tr${row.dayLabel.startsWith("Sam") || row.dayLabel.startsWith("Dim") ? ' class="weekend"' : ""}>
        <td>${escapeHtml(row.dayLabel)}</td>
        <td>${escapeHtml(row.intervals)}</td>
        <td class="num">${duration(row.minutes)}</td>
        <td>${escapeHtml(row.note)}</td>
      </tr>`
    )
    .join("");

  const weekRows = summary.weeks
    .map(
      (week) => `<tr>
        <td>Du ${formatDayMonth(parseDateKey(week.weekStart))} au ${formatDayMonth(parseDateKey(week.weekEnd))}${
          week.countedInMonth ? "" : " *"
        }</td>
        <td class="num">${formatDuration(week.workedMinutes)}</td>
        <td class="num">${duration(week.complementary10)}</td>
        <td class="num">${duration(week.complementary25)}</td>
        <td class="num">${duration(week.overtime)}</td>
      </tr>`
    )
    .join("");

  const hasUncountedWeek = summary.weeks.some((w) => !w.countedInMonth);

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(report.title)}</title>
<style>
  @page { margin: 14mm; }
  body { font-family: Helvetica, Arial, sans-serif; font-size: 11px; color: #111827; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  h2 { font-size: 13px; margin: 16px 0 6px; }
  p { margin: 2px 0; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #9CA3AF; padding: 3px 6px; text-align: left; }
  th { background: #E5E7EB; }
  .num { text-align: right; white-space: nowrap; }
  .weekend td { background: #F3F4F6; }
  tfoot td { font-weight: bold; background: #E5E7EB; }
  .note { color: #4B5563; font-size: 10px; margin-top: 4px; }
  .block { page-break-inside: avoid; }
</style>
</head>
<body>
  <h1>${escapeHtml(report.title)}</h1>
  ${report.employeeName ? `<p><strong>${escapeHtml(report.employeeName)}</strong></p>` : ""}
  <p>Durée du contrat : ${formatDuration(report.contractMinutes)} par semaine</p>

  <h2>Heures du mois</h2>
  <table>
    <thead><tr><th>Jour</th><th>Créneaux</th><th>Durée</th><th>Remarque</th></tr></thead>
    <tbody>${dayRows}</tbody>
    <tfoot><tr>
      <td colspan="2">Total du mois (${summary.workedDays} jours travaillés)</td>
      <td class="num">${formatDuration(summary.totalMinutes)}</td>
      <td></td>
    </tr></tfoot>
  </table>

  <div class="block">
    <h2>Heures complémentaires, semaine par semaine</h2>
    <table>
      <thead><tr>
        <th>Semaine</th><th>Heures travaillées</th><th>Compl. +10 %</th><th>Compl. +25 %</th><th>Supplémentaires</th>
      </tr></thead>
      <tbody>${weekRows}</tbody>
      <tfoot><tr>
        <td colspan="2">Total retenu pour le mois</td>
        <td class="num">${formatDuration(summary.complementary10)}</td>
        <td class="num">${formatDuration(summary.complementary25)}</td>
        <td class="num">${formatDuration(summary.overtime)}</td>
      </tr></tfoot>
    </table>
    <p class="note">Heures complémentaires : heures de la semaine au-delà du contrat, majorées de 10 % jusqu'à 1/10 de la durée du contrat puis de 25 %. Heures supplémentaires : au-delà de 35 h dans la semaine.</p>
    ${
      hasUncountedWeek
        ? '<p class="note">* Semaine à cheval sur deux mois : elle est comptée dans le mois où elle se termine.</p>'
        : ""
    }
  </div>
</body>
</html>`;
}
