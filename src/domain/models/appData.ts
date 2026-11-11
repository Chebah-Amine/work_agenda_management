import { isValidDateKey } from "../date";
import { isValidInterval, sortIntervals } from "../time";
import { cleanDayComment, DAY_OFF_REASONS, WorkDay, WorkInterval } from "./workDay";
import { DEFAULT_SETTINGS, WorkSettings } from "./workSettings";

export interface AppData {
  settings: WorkSettings;
  workDays: Record<string, WorkDay>;
}

function cleanIntervals(raw: unknown): WorkInterval[] {
  if (!Array.isArray(raw)) return [];
  const intervals = raw
    .filter((i) => i && typeof i.start === "string" && typeof i.end === "string")
    .map((i) => ({ start: i.start as string, end: i.end as string }))
    .filter(isValidInterval);
  return sortIntervals(intervals);
}

function normalizeSettings(raw: any): WorkSettings {
  if (!raw || typeof raw !== "object") return DEFAULT_SETTINGS;

  const weekly = Number(raw.weeklyContractMinutes);
  const workingDays: number[] = Array.isArray(raw.workingDays)
    ? raw.workingDays.filter((d: unknown) => Number.isInteger(d) && (d as number) >= 1 && (d as number) <= 7)
    : DEFAULT_SETTINGS.workingDays;
  const defaultIntervals = cleanIntervals(raw.defaultIntervals);

  return {
    employeeName: typeof raw.employeeName === "string" ? raw.employeeName : "",
    weeklyContractMinutes:
      Number.isFinite(weekly) && weekly > 0 ? weekly : DEFAULT_SETTINGS.weeklyContractMinutes,
    workingDays,
    defaultIntervals: defaultIntervals.length ? defaultIntervals : DEFAULT_SETTINGS.defaultIntervals,
  };
}

/** Rend exploitable ce qui sort du stockage (ancien format, données abîmées…). */
export function normalizeAppData(raw: any): AppData {
  const workDays: Record<string, WorkDay> = {};
  const rawDays = raw && typeof raw.workDays === "object" && raw.workDays ? raw.workDays : {};

  for (const [key, value] of Object.entries<any>(rawDays)) {
    if (!isValidDateKey(key) || !value) continue;
    const comment = cleanDayComment(value.comment);
    const extra = comment ? { comment } : {};
    if (value.status === "NOT_WORKED") {
      const reason = DAY_OFF_REASONS.some((r) => r.value === value.dayOffReason)
        ? value.dayOffReason
        : "repos";
      workDays[key] = { date: key, status: "NOT_WORKED", intervals: [], dayOffReason: reason, ...extra };
      continue;
    }
    const intervals = cleanIntervals(value.intervals);
    if (intervals.length) {
      workDays[key] = { date: key, status: "WORKED", intervals, ...extra };
    }
  }

  return { settings: normalizeSettings(raw?.settings), workDays };
}
