import { DEFAULT_SETTINGS } from "@/domain/models/workSettings";
import { buildMonthlyReport } from "@/domain/report";
import { describe, expect, it } from "vitest";
import { buildReportHtml } from "./reportHtml";
import { buildReportRows } from "./reportSheet";

const slots = [
  { start: "07:00", end: "12:00" },
  { start: "14:00", end: "15:30" },
];
// Semaine du 9 au 15 novembre 2026 : 4 × 6 h 30 = 26 h (contrat 20 h).
const workDays = Object.fromEntries(
  ["2026-11-09", "2026-11-10", "2026-11-12", "2026-11-13"].map((date) => [
    date,
    { date, status: "WORKED" as const, intervals: slots },
  ])
);
const report = buildMonthlyReport(2026, 10, {
  settings: { ...DEFAULT_SETTINGS, employeeName: "A <B> & C" },
  workDays,
});

describe("report exports", () => {
  it("builds the Excel rows with decimal hours and weekly extras", () => {
    const rows = buildReportRows(report);
    expect(rows[0]).toEqual(["Relevé d'heures – Novembre 2026"]);
    expect(rows).toContainEqual([
      "Lun 09/11", "07:00–12:00, 14:00–15:30", "6 h 30", 6.5, "",
    ]);
    expect(rows).toContainEqual(["Total du mois (4 jours travaillés)", "", "26 h 00", 26, ""]);
    expect(rows).toContainEqual(["Du 09/11 au 15/11", 26, 2, 4, 0, "Oui"]);
    expect(rows.at(-1)).toEqual(["Total retenu pour le mois", null, 2, 4, 0, ""]);
  });

  it("builds the PDF page and escapes user text", () => {
    const html = buildReportHtml(report);
    expect(html).toContain("A &lt;B&gt; &amp; C");
    expect(html).toContain("Lun 09/11");
    expect(html).toContain("Férié (Armistice 1918)");
    expect(html).toContain("26 h 00");
    expect(html).toContain("Semaine à cheval sur deux mois");
  });
});
