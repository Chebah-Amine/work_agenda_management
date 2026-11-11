import { describe, expect, it } from "vitest";
import {
  archiveYear,
  BackupError,
  buildBackup,
  canArchiveYear,
  deleteAllDays,
  deleteArchive,
  deleteYear,
  formatBytes,
  mergeBackup,
  parseBackup,
  replaceWithBackup,
  restoreArchive,
  storageBytes,
  summarizeByYear,
  summarizeDays,
} from "./dataManagement";
import { AppData, normalizeAppData } from "./models/appData";
import { WorkDay } from "./models/workDay";
import { DEFAULT_SETTINGS } from "./models/workSettings";

const worked = (date: string, start = "07:00", end = "09:00"): WorkDay => ({
  date,
  status: "WORKED",
  intervals: [{ start, end }],
});
const byDate = (...days: WorkDay[]) => Object.fromEntries(days.map((d) => [d.date, d]));
const appData = (days: WorkDay[], extra: Partial<AppData> = {}): AppData => ({
  settings: DEFAULT_SETTINGS,
  workDays: byDate(...days),
  archives: [],
  ...extra,
});

const sample = appData([
  worked("2025-03-10"),
  worked("2025-12-31"),
  worked("2026-01-02"),
  { date: "2026-01-05", status: "NOT_WORKED", intervals: [], dayOffReason: "maladie" },
]);

describe("data volume", () => {
  it("summarizes days overall and per year", () => {
    expect(summarizeDays(sample.workDays)).toEqual({
      dayCount: 4,
      workedMinutes: 360,
      firstDate: "2025-03-10",
      lastDate: "2026-01-05",
    });
    expect(summarizeDays({})).toMatchObject({ dayCount: 0, firstDate: null, lastDate: null });
    expect(summarizeByYear(sample.workDays).map((y) => [y.year, y.dayCount, y.workedMinutes])).toEqual([
      [2026, 2, 120],
      [2025, 2, 240],
    ]);
  });

  it("measures stored size in bytes, accents included", () => {
    const data = appData([{ ...worked("2026-01-02"), comment: "été" }]);
    expect(storageBytes(data)).toBe(JSON.stringify(data).length + 2);
    expect(formatBytes(850)).toBe("850 octets");
    expect(formatBytes(34_500)).toBe("34 Ko");
    expect(formatBytes(2_400_000)).toBe("2,3 Mo");
  });
});

describe("archives", () => {
  it("only lets finished years be archived", () => {
    const today = new Date(2026, 10, 11);
    expect(canArchiveYear(2025, today)).toBe(true);
    expect(canArchiveYear(2026, today)).toBe(false);
  });

  it("moves a year out of the calendar and back", () => {
    const archived = archiveYear(sample, 2025, "2026-11-11");
    expect(Object.keys(archived.workDays)).toEqual(["2026-01-02", "2026-01-05"]);
    expect(archived.archives).toHaveLength(1);
    expect(archived.archives[0]).toMatchObject({ year: 2025, archivedAt: "2026-11-11" });
    expect(Object.keys(archived.archives[0].workDays)).toEqual(["2025-03-10", "2025-12-31"]);

    const restored = restoreArchive(archived, 2025);
    expect(restored.archives).toEqual([]);
    expect(Object.keys(restored.workDays).sort()).toEqual(Object.keys(sample.workDays).sort());
  });

  it("merges into an existing archive and keeps re-entered days on restore", () => {
    const first = archiveYear(sample, 2025, "2026-01-10");
    const reentered = {
      ...first,
      workDays: { ...first.workDays, ...byDate(worked("2025-03-10", "10:00", "11:00"), worked("2025-06-01")) },
    };
    const second = archiveYear(reentered, 2025, "2026-02-01");
    expect(second.archives).toHaveLength(1);
    expect(Object.keys(second.archives[0].workDays).sort()).toEqual([
      "2025-03-10", "2025-06-01", "2025-12-31",
    ]);
    expect(second.archives[0].workDays["2025-03-10"].intervals[0].start).toBe("10:00");

    const restored = restoreArchive(
      { ...second, workDays: { ...second.workDays, ...byDate(worked("2025-12-31", "12:00", "13:00")) } },
      2025
    );
    expect(restored.workDays["2025-12-31"].intervals[0].start).toBe("12:00");
  });

  it("does nothing for a year without data", () => {
    expect(archiveYear(sample, 2019, "2026-11-11")).toBe(sample);
    expect(restoreArchive(sample, 2019)).toBe(sample);
  });

  it("keeps archives through storage and repairs bad ones", () => {
    const stored = JSON.parse(JSON.stringify(archiveYear(sample, 2025, "2026-11-11")));
    stored.archives.push(
      { year: 2025, archivedAt: "pas une date", workDays: byDate(worked("2025-07-01"), worked("2024-01-01")) },
      { year: "x", workDays: {} },
      { year: 2023, archivedAt: "2024-01-01", workDays: {} }
    );
    const data = normalizeAppData(stored);
    expect(data.archives).toHaveLength(1);
    expect(data.archives[0].archivedAt).toBe("2026-11-11");
    expect(Object.keys(data.archives[0].workDays).sort()).toEqual([
      "2025-03-10", "2025-07-01", "2025-12-31",
    ]);
    expect(normalizeAppData({}).archives).toEqual([]);
  });
});

describe("deletion", () => {
  it("deletes one year, one archive, or everything but the settings", () => {
    const archived = archiveYear(sample, 2025, "2026-11-11");
    expect(Object.keys(deleteYear(sample, 2026).workDays)).toEqual(["2025-03-10", "2025-12-31"]);
    expect(deleteYear(archived, 2025).archives).toHaveLength(1);
    expect(deleteArchive(archived, 2025).archives).toEqual([]);

    const settings = { ...DEFAULT_SETTINGS, employeeName: "Mme Test" };
    const wiped = deleteAllDays({ ...archived, settings, lastBackupAt: "2026-11-01" });
    expect(wiped).toEqual({ settings, workDays: {}, archives: [] });
  });
});

describe("backup", () => {
  const withArchive = archiveYear(sample, 2025, "2026-11-11");

  it("round-trips through a backup file", () => {
    const text = JSON.stringify(buildBackup({ ...withArchive, lastBackupAt: "2026-10-01" }, "2026-11-11"));
    const parsed = parseBackup(text);
    expect(parsed.exportedAt).toBe("2026-11-11");
    expect(parsed.dayCount).toBe(4);
    expect(parsed.data.workDays).toEqual(withArchive.workDays);
    expect(parsed.data.archives).toEqual(withArchive.archives);
    expect(parsed.data.lastBackupAt).toBeUndefined();
  });

  it("rejects files that are not usable backups", () => {
    expect(() => parseBackup("pas du json")).toThrow(BackupError);
    expect(() => parseBackup(JSON.stringify({ workDays: {} }))).toThrow(BackupError);
    expect(() => parseBackup(JSON.stringify(buildBackup(appData([]), "2026-11-11")))).toThrow(
      "aucune heure"
    );
    const future = { ...buildBackup(sample, "2026-11-11"), version: 99 };
    expect(() => parseBackup(JSON.stringify(future))).toThrow("plus récente");
  });

  it("replaces everything, keeping only the phone's last backup date", () => {
    const current = appData([worked("2026-02-02")], { lastBackupAt: "2026-10-01" });
    const backup = { ...sample, settings: { ...DEFAULT_SETTINGS, employeeName: "Autre" } };
    const next = replaceWithBackup(current, backup);
    expect(next.workDays).toEqual(sample.workDays);
    expect(next.settings.employeeName).toBe("Autre");
    expect(next.lastBackupAt).toBe("2026-10-01");
  });

  it("merges without overwriting what is already on the phone", () => {
    const current = appData([worked("2026-01-02", "10:00", "12:00"), worked("2026-03-03")], {
      settings: { ...DEFAULT_SETTINGS, employeeName: "Sur le téléphone" },
      archives: [{ year: 2025, archivedAt: "2026-01-10", workDays: byDate(worked("2025-03-10", "08:00", "09:00")) }],
    });
    const backup = appData(
      [worked("2026-01-02"), worked("2026-01-05"), worked("2025-12-31")],
      { archives: [{ year: 2024, archivedAt: "2025-01-05", workDays: byDate(worked("2024-05-05")) }] }
    );
    const merged = mergeBackup(current, backup);

    expect(merged.settings.employeeName).toBe("Sur le téléphone");
    expect(Object.keys(merged.workDays).sort()).toEqual(["2026-01-02", "2026-01-05", "2026-03-03"]);
    expect(merged.workDays["2026-01-02"].intervals[0].start).toBe("10:00");
    expect(merged.archives.map((a) => a.year)).toEqual([2025, 2024]);
    expect(Object.keys(merged.archives[0].workDays).sort()).toEqual(["2025-03-10", "2025-12-31"]);
    expect(merged.archives[0].workDays["2025-03-10"].intervals[0].start).toBe("08:00");
  });
});
