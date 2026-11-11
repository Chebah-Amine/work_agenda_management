import { MONTH_NAMES } from "./date";
import { MonthlyReport } from "./report";

export interface ShareMessage {
  subject: string;
  body: string;
}

/** « de novembre 2026 », « d'avril 2026 », « d'août 2026 »… */
function ofMonth(year: number, month: number): string {
  const name = MONTH_NAMES[month].toLowerCase();
  return `${/^[aeiouyàâäéèêëîïôöûüh]/.test(name) ? "d'" : "de "}${name} ${year}`;
}

/** Message accompagnant le rapport envoyé par e-mail. */
export function buildShareMessage(report: MonthlyReport): ShareMessage {
  const period = ofMonth(report.year, report.month);
  const signature = report.employeeName ? `\n${report.employeeName}` : "";
  return {
    subject: `Relevé d'heures ${period}${report.employeeName ? ` – ${report.employeeName}` : ""}`,
    body:
      "Bonjour,\n\n" +
      `Vous trouverez ci-joint mon relevé d'heures ${period}.\n\n` +
      `Bien cordialement,${signature}`,
  };
}
