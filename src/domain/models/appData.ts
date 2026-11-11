import { isValidDateKey } from "../date";
import { isValidInterval, sortIntervals } from "../time";
import { cleanDayComment, DAY_OFF_REASONS, WorkDay, WorkInterval } from "./workDay";
import { DEFAULT_SETTINGS, WorkSettings } from "./workSettings";

/** Une année sortie du calendrier mais conservée sur le téléphone. */
export interface YearArchive {
  year: number;
  /** Date de l'archivage (YYYY-MM-DD), vide si inconnue. */
  archivedAt: string;
  workDays: Record<string, WorkDay>;
}

export interface AppData {
  settings: WorkSettings;
  /** Jours actifs : ceux que montrent le calendrier et le rapport. */
  workDays: Record<string, WorkDay>;
  archives: YearArchive[];
  /** Date de la dernière sauvegarde exportée (YYYY-MM-DD). */
  lastBackupAt?: string;
  /** Vrai tant que la présentation de première ouverture n'a pas été terminée. */
  needsOnboarding?: boolean;
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

function normalizeWorkDays(raw: any): Record<string, WorkDay> {
  const workDays: Record<string, WorkDay> = {};
  const rawDays = raw && typeof raw === "object" ? raw : {};

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

  return workDays;
}

/** Une archive par année, sans doublon, de la plus récente à la plus ancienne. */
function normalizeArchives(raw: unknown): YearArchive[] {
  if (!Array.isArray(raw)) return [];
  const byYear = new Map<number, YearArchive>();

  for (const item of raw) {
    const year = Number(item?.year);
    if (!Number.isInteger(year)) continue;
    const prefix = `${year}-`;
    const days = Object.entries(normalizeWorkDays(item.workDays)).filter(([key]) =>
      key.startsWith(prefix)
    );
    if (days.length === 0) continue;
    const previous = byYear.get(year);
    byYear.set(year, {
      year,
      archivedAt: isValidDateKey(item.archivedAt) ? item.archivedAt : (previous?.archivedAt ?? ""),
      workDays: { ...previous?.workDays, ...Object.fromEntries(days) },
    });
  }

  return [...byYear.values()].sort((a, b) => b.year - a.year);
}

/** Rend exploitable ce qui sort du stockage (ancien format, données abîmées…). */
export function normalizeAppData(raw: any): AppData {
  const data: AppData = {
    settings: normalizeSettings(raw?.settings),
    workDays: normalizeWorkDays(raw?.workDays),
    archives: normalizeArchives(raw?.archives),
  };
  if (isValidDateKey(String(raw?.lastBackupAt ?? ""))) data.lastBackupAt = raw.lastBackupAt;

  // Rien d'enregistré du tout : c'est la première ouverture de l'application.
  const isFirstLaunch =
    !raw?.settings && Object.keys(data.workDays).length === 0 && data.archives.length === 0;
  if (raw?.needsOnboarding === true || isFirstLaunch) data.needsOnboarding = true;
  return data;
}
