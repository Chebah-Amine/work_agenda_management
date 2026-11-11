import { describe, expect, it } from "vitest";
import {
  getDateRange,
  getFrenchHolidayName,
  getMonthMatrix,
  isValidDateKey,
  parseDateKey,
  startOfWeek,
  toDateKey,
} from "./date";
import { normalizeAppData } from "./models/appData";
import { cleanDayComment, DAY_COMMENT_MAX_LENGTH, WorkDay } from "./models/workDay";
import { DEFAULT_SETTINGS } from "./models/workSettings";
import { computeExtraHours, summarizeMonth, summarizeWeek } from "./overtime";
import { buildMonthlyReport } from "./report";
import { parseScanResponse } from "./scan";
import { buildShareMessage } from "./shareMessage";
import {
  formatDuration,
  normalizeTime,
  parseTime,
  totalMinutes,
  validateIntervals,
} from "./time";

const worked = (date: string, ...slots: [string, string][]): WorkDay => ({
  date,
  status: "WORKED",
  intervals: slots.map(([start, end]) => ({ start, end })),
});
const byDate = (...days: WorkDay[]) => Object.fromEntries(days.map((d) => [d.date, d]));

describe("date", () => {
  it("keeps the local day when building keys", () => {
    expect(toDateKey(new Date(2026, 10, 9, 0, 0))).toBe("2026-11-09");
    expect(toDateKey(parseDateKey("2026-03-01"))).toBe("2026-03-01");
  });

  it("validates date keys", () => {
    expect(isValidDateKey("2026-02-28")).toBe(true);
    expect(isValidDateKey("2026-02-30")).toBe(false);
    expect(isValidDateKey("09/11/2026")).toBe(false);
  });

  it("starts weeks on Monday", () => {
    expect(toDateKey(startOfWeek(new Date(2026, 10, 15)))).toBe("2026-11-09"); // dimanche
    expect(toDateKey(startOfWeek(new Date(2026, 10, 9)))).toBe("2026-11-09"); // lundi
  });

  it("builds the month grid", () => {
    const nov = getMonthMatrix(2026, 10); // 1er novembre 2026 = dimanche
    expect(nov).toHaveLength(6);
    expect(nov[0][6]?.getDate()).toBe(1);
    expect(nov[0][5]).toBeNull();
    expect(getMonthMatrix(2027, 1)).toHaveLength(4); // février 2027 commence un lundi
  });

  it("returns inclusive ranges in either order", () => {
    const range = getDateRange(new Date(2026, 10, 12), new Date(2026, 10, 9));
    expect(range.map(toDateKey)).toEqual([
      "2026-11-09", "2026-11-10", "2026-11-11", "2026-11-12",
    ]);
  });

  it("knows French public holidays, including movable ones", () => {
    expect(getFrenchHolidayName(new Date(2026, 10, 11))).toBe("Armistice 1918");
    expect(getFrenchHolidayName(new Date(2026, 3, 6))).toBe("Lundi de Pâques");
    expect(getFrenchHolidayName(new Date(2026, 4, 14))).toBe("Ascension");
    expect(getFrenchHolidayName(new Date(2026, 4, 25))).toBe("Lundi de Pentecôte");
    expect(getFrenchHolidayName(new Date(2026, 10, 12))).toBeNull();
  });
});

describe("time", () => {
  it("parses and formats", () => {
    expect(parseTime("07:30")).toBe(450);
    expect(parseTime("24:00")).toBeNull();
    expect(parseTime("abc")).toBeNull();
    expect(formatDuration(270)).toBe("4 h 30");
    expect(formatDuration(240)).toBe("4 h 00");
  });

  it("normalizes handwritten times", () => {
    expect(normalizeTime("7h30")).toBe("07:30");
    expect(normalizeTime("7 h")).toBe("07:00");
    expect(normalizeTime("16:05")).toBe("16:05");
    expect(normalizeTime("0715")).toBe("07:15");
    expect(normalizeTime("18")).toBe("18:00");
    expect(normalizeTime("25h")).toBeNull();
    expect(normalizeTime("matin")).toBeNull();
  });

  it("sums intervals and ignores broken ones", () => {
    expect(
      totalMinutes([
        { start: "07:00", end: "09:00" },
        { start: "16:00", end: "18:15" },
        { start: "10:00", end: "09:00" },
      ])
    ).toBe(255);
  });

  it("rejects empty, reversed and overlapping intervals", () => {
    expect(validateIntervals([])).not.toBeNull();
    expect(validateIntervals([{ start: "09:00", end: "07:00" }])).not.toBeNull();
    expect(
      validateIntervals([
        { start: "16:00", end: "18:00" },
        { start: "07:00", end: "16:30" },
      ])
    ).toContain("chevauchent");
    expect(
      validateIntervals([
        { start: "07:00", end: "09:00" },
        { start: "09:00", end: "11:00" },
      ])
    ).toBeNull();
  });
});

describe("overtime", () => {
  const H = 60;

  it("has no extra hours at or under the contract", () => {
    expect(computeExtraHours(20 * H, 20 * H)).toEqual({
      complementary10: 0, complementary25: 0, overtime: 0,
    });
    expect(computeExtraHours(12 * H, 20 * H).complementary10).toBe(0);
  });

  it("splits complementary hours at one tenth of the contract", () => {
    expect(computeExtraHours(21 * H, 20 * H)).toEqual({
      complementary10: 1 * H, complementary25: 0, overtime: 0,
    });
    expect(computeExtraHours(25 * H, 20 * H)).toEqual({
      complementary10: 2 * H, complementary25: 3 * H, overtime: 0,
    });
  });

  it("counts overtime beyond 35 h", () => {
    expect(computeExtraHours(37 * H, 20 * H)).toEqual({
      complementary10: 2 * H, complementary25: 13 * H, overtime: 2 * H,
    });
  });

  it("summarizes a Monday-to-Sunday week", () => {
    const days = byDate(
      worked("2026-11-09", ["07:00", "09:00"], ["16:00", "18:00"]),
      worked("2026-11-10", ["07:00", "09:00"], ["16:00", "18:00"]),
      worked("2026-11-12", ["07:00", "09:30"], ["16:00", "18:00"]),
      worked("2026-11-13", ["07:00", "09:00"], ["16:00", "18:00"]),
      worked("2026-11-14", ["08:00", "13:00"]),
      worked("2026-11-16", ["07:00", "09:00"]), // semaine suivante
      { date: "2026-11-11", status: "NOT_WORKED", intervals: [], dayOffReason: "repos" }
    );
    const week = summarizeWeek(new Date(2026, 10, 11), days, 20 * H);
    expect(week.weekStart).toBe("2026-11-09");
    expect(week.weekEnd).toBe("2026-11-15");
    expect(week.workedMinutes).toBe(21 * H + 30);
    expect(week.complementary10).toBe(90);
  });

  it("attributes a straddling week to the month where it ends", () => {
    // Semaine du lundi 30 novembre au dimanche 6 décembre 2026 : 22 h
    const days = byDate(
      worked("2026-11-30", ["07:00", "12:00"]),
      worked("2026-12-01", ["07:00", "12:00"]),
      worked("2026-12-02", ["07:00", "12:00"]),
      worked("2026-12-03", ["07:00", "12:00"]),
      worked("2026-12-04", ["07:00", "09:00"])
    );
    const november = summarizeMonth(2026, 10, days, 20 * H);
    const december = summarizeMonth(2026, 11, days, 20 * H);

    expect(november.totalMinutes).toBe(5 * H);
    expect(november.complementary10).toBe(0);
    expect(november.weeks.at(-1)?.countedInMonth).toBe(false);

    expect(december.totalMinutes).toBe(17 * H);
    expect(december.complementary10).toBe(2 * H);
    expect(december.weeks[0].weekStart).toBe("2026-11-30");
    expect(december.weeks[0].countedInMonth).toBe(true);
  });
});

describe("report", () => {
  it("lists every day of the month with notes and totals", () => {
    const data = {
      settings: { ...DEFAULT_SETTINGS, employeeName: " Mme Test " },
      workDays: byDate(
        worked("2026-11-02", ["07:00", "09:00"], ["16:00", "18:00"]),
        { date: "2026-11-03", status: "NOT_WORKED", intervals: [], dayOffReason: "maladie" }
      ),
    };
    const report = buildMonthlyReport(2026, 10, data);
    expect(report.rows).toHaveLength(30);
    expect(report.employeeName).toBe("Mme Test");
    expect(report.rows[1]).toMatchObject({
      dayLabel: "Lun 02/11", intervals: "07:00–09:00, 16:00–18:00", minutes: 240,
    });
    expect(report.rows[2].note).toBe("Maladie");
    expect(report.rows[10].note).toContain("Férié");
    expect(report.summary.workedDays).toBe(1);
    expect(report.summary.absenceDays).toBe(1);
  });

  it("adds the day comment to the remark column", () => {
    const data = {
      settings: DEFAULT_SETTINGS,
      workDays: byDate(
        { ...worked("2026-11-02", ["07:00", "09:00"]), comment: "Remplacement" },
        { date: "2026-11-03", status: "NOT_WORKED", intervals: [], dayOffReason: "maladie", comment: "Arrêt" }
      ),
    };
    const report = buildMonthlyReport(2026, 10, data);
    expect(report.rows[1].note).toBe("Remplacement");
    expect(report.rows[2].note).toBe("Maladie · Arrêt");
  });
});

describe("share message", () => {
  const report = (month: number, employeeName = "") =>
    buildMonthlyReport(2026, month, { settings: { ...DEFAULT_SETTINGS, employeeName }, workDays: {} });

  it("is a short e-mail signed with the employee name", () => {
    const message = buildShareMessage(report(10, "Fatima Chebah"));
    expect(message.subject).toBe("Relevé d'heures de novembre 2026 – Fatima Chebah");
    expect(message.body).toBe(
      "Bonjour,\n\nVous trouverez ci-joint mon relevé d'heures de novembre 2026.\n\nBien cordialement,\nFatima Chebah"
    );
  });

  it("elides « de » before a vowel and works without a name", () => {
    const message = buildShareMessage(report(3));
    expect(message.subject).toBe("Relevé d'heures d'avril 2026");
    expect(message.body.endsWith("Bien cordialement,")).toBe(true);
  });
});

describe("day comment", () => {
  it("is kept on one line, trimmed and limited in length", () => {
    expect(cleanDayComment("  Remplacement \n de  Mme X ")).toBe("Remplacement de Mme X");
    expect(cleanDayComment("   ")).toBeUndefined();
    expect(cleanDayComment(42)).toBeUndefined();
    expect(cleanDayComment("a".repeat(200))).toHaveLength(DAY_COMMENT_MAX_LENGTH);
  });

  it("survives loading from storage", () => {
    const data = normalizeAppData({
      workDays: {
        "2026-11-02": { status: "WORKED", intervals: [{ start: "07:00", end: "09:00" }], comment: " Formation " },
        "2026-11-03": { status: "NOT_WORKED", dayOffReason: "conge", comment: "" },
      },
    });
    expect(data.workDays["2026-11-02"].comment).toBe("Formation");
    expect(data.workDays["2026-11-03"]).not.toHaveProperty("comment");
  });
});

describe("scan", () => {
  it("normalizes, sorts and merges what the model read", () => {
    const proposals = parseScanResponse({
      days: [
        { date: "2026-11-10", worked: true, intervals: [{ start: "16h", end: "18h15" }] },
        { date: "2026-11-09", worked: true, intervals: [{ start: "7h", end: "9h" }, { start: "??", end: "18h" }] },
        { date: "2026-11-10", worked: true, intervals: [{ start: "7:00", end: "9:00" }] },
        { date: "2026-11-11", worked: false, absenceReason: "maladie", intervals: [] },
        { date: "2026-11-31", worked: true, intervals: [{ start: "7h", end: "9h" }] },
        { date: "2026-11-12", worked: true, intervals: [] },
      ],
    });

    expect(proposals.map((p) => p.day.date)).toEqual(["2026-11-09", "2026-11-10", "2026-11-11"]);
    expect(proposals[0].day.intervals).toEqual([{ start: "07:00", end: "09:00" }]);
    expect(proposals[0].warnings).toHaveLength(1);
    expect(proposals[1].day.intervals).toEqual([
      { start: "07:00", end: "09:00" },
      { start: "16:00", end: "18:15" },
    ]);
    expect(proposals[2].day).toMatchObject({ status: "NOT_WORKED", dayOffReason: "maladie" });
  });

  it("returns nothing for an unusable response", () => {
    expect(parseScanResponse(null)).toEqual([]);
    expect(parseScanResponse({ days: "oops" })).toEqual([]);
  });
});

describe("stored data", () => {
  it("migrates the old settings format and drops broken days", () => {
    const data = normalizeAppData({
      settings: { baseMonthlyMinutes: 9060, baseDailyMinutes: 420, workingDays: [1, 2, 4, 5] },
      workDays: {
        "2026-11-09": worked("2026-11-09", ["16:00", "18:00"], ["07:00", "09:00"]),
        "2026-11-10": { date: "2026-11-10", status: "WORKED", intervals: [] },
        "2026-11-11": { date: "2026-11-11", status: "NOT_WORKED", intervals: [] },
        "pas-une-date": worked("x", ["07:00", "09:00"]),
      },
    });
    expect(data.settings.weeklyContractMinutes).toBe(1200);
    expect(data.settings.workingDays).toEqual([1, 2, 4, 5]);
    expect(Object.keys(data.workDays)).toEqual(["2026-11-09", "2026-11-11"]);
    expect(data.workDays["2026-11-09"].intervals[0].start).toBe("07:00");
    expect(data.workDays["2026-11-11"].dayOffReason).toBe("repos");
    expect(normalizeAppData(undefined).workDays).toEqual({});
  });
});
