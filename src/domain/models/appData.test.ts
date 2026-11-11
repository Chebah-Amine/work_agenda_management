import { describe, expect, it } from "vitest";
import { buildBackup, deleteAllDays, parseBackup, replaceWithBackup } from "../dataManagement";
import { normalizeAppData } from "./appData";
import { DEFAULT_SETTINGS } from "./workSettings";

const day = { date: "2026-11-09", status: "WORKED", intervals: [{ start: "07:00", end: "09:00" }] };

describe("first-launch presentation", () => {
  it("is needed only when nothing has ever been saved", () => {
    expect(normalizeAppData({}).needsOnboarding).toBe(true);
    expect(normalizeAppData(undefined).needsOnboarding).toBe(true);
    expect(normalizeAppData({ settings: DEFAULT_SETTINGS }).needsOnboarding).toBeUndefined();
    expect(normalizeAppData({ workDays: { [day.date]: day } }).needsOnboarding).toBeUndefined();
    expect(
      normalizeAppData({ archives: [{ year: 2026, workDays: { [day.date]: day } }] }).needsOnboarding
    ).toBeUndefined();
  });

  it("can be asked for again from the settings", () => {
    const stored = { settings: DEFAULT_SETTINGS, workDays: { [day.date]: day }, needsOnboarding: true };
    expect(normalizeAppData(stored).needsOnboarding).toBe(true);
  });

  it("does not come back after erasing everything or restoring a backup", () => {
    const data = normalizeAppData({ settings: DEFAULT_SETTINGS, workDays: { [day.date]: day } });
    expect(deleteAllDays(data).needsOnboarding).toBeUndefined();

    const backup = parseBackup(JSON.stringify(buildBackup(data, "2026-11-11")));
    expect(replaceWithBackup(normalizeAppData({}), backup.data).needsOnboarding).toBeUndefined();
  });
});
