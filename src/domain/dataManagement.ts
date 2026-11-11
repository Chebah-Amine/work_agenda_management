import { AppData, normalizeAppData, YearArchive } from "./models/appData";
import { WorkDay } from "./models/workDay";
import { totalMinutes } from "./time";

type Days = Record<string, WorkDay>;

// ---------- Volume des données ----------

export interface DaysSummary {
  dayCount: number;
  workedMinutes: number;
  /** Premier et dernier jour saisis (YYYY-MM-DD), null s'il n'y en a aucun. */
  firstDate: string | null;
  lastDate: string | null;
}

export function summarizeDays(workDays: Days): DaysSummary {
  const keys = Object.keys(workDays).sort();
  return {
    dayCount: keys.length,
    workedMinutes: keys.reduce((sum, key) => sum + totalMinutes(workDays[key].intervals), 0),
    firstDate: keys[0] ?? null,
    lastDate: keys.at(-1) ?? null,
  };
}

export interface YearSummary extends DaysSummary {
  year: number;
}

const yearOf = (dateKey: string) => Number(dateKey.slice(0, 4));

function splitByYear(workDays: Days): Map<number, Days> {
  const byYear = new Map<number, Days>();
  for (const [key, day] of Object.entries(workDays)) {
    const year = yearOf(key);
    byYear.set(year, { ...byYear.get(year), [key]: day });
  }
  return byYear;
}

/** Jours actifs regroupés par année, de la plus récente à la plus ancienne. */
export function summarizeByYear(workDays: Days): YearSummary[] {
  return [...splitByYear(workDays)]
    .map(([year, days]) => ({ year, ...summarizeDays(days) }))
    .sort((a, b) => b.year - a.year);
}

/** Place occupée par les données une fois enregistrées, en octets (UTF-8). */
export function storageBytes(data: AppData): number {
  const json = JSON.stringify(data);
  let bytes = 0;
  for (let i = 0; i < json.length; i++) {
    const code = json.charCodeAt(i);
    bytes += code < 0x80 ? 1 : code < 0x800 ? 2 : 3;
  }
  return bytes;
}

/** 850 → "850 octets", 34 500 → "34 Ko", 2 400 000 → "2,3 Mo" */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} octets`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} Mo`;
}

// ---------- Archives ----------

/** Seules les années terminées peuvent être archivées. */
export function canArchiveYear(year: number, today: Date): boolean {
  return year < today.getFullYear();
}

const sortArchives = (archives: YearArchive[]) => [...archives].sort((a, b) => b.year - a.year);

/** Sort une année du calendrier pour la ranger dans les archives. */
export function archiveYear(data: AppData, year: number, todayKey: string): AppData {
  const byYear = splitByYear(data.workDays);
  const moved = byYear.get(year);
  if (!moved) return data;

  const existing = data.archives.find((a) => a.year === year);
  const archive: YearArchive = {
    year,
    archivedAt: todayKey,
    // Un jour présent des deux côtés : la version du calendrier, plus récente, l'emporte.
    workDays: { ...existing?.workDays, ...moved },
  };
  byYear.delete(year);

  return {
    ...data,
    workDays: Object.assign({}, ...byYear.values()),
    archives: sortArchives([...data.archives.filter((a) => a.year !== year), archive]),
  };
}

/** Remet une année archivée dans le calendrier. */
export function restoreArchive(data: AppData, year: number): AppData {
  const archive = data.archives.find((a) => a.year === year);
  if (!archive) return data;
  return {
    ...data,
    // Un jour ressaisi depuis l'archivage est conservé tel quel.
    workDays: { ...archive.workDays, ...data.workDays },
    archives: data.archives.filter((a) => a.year !== year),
  };
}

export function deleteArchive(data: AppData, year: number): AppData {
  return { ...data, archives: data.archives.filter((a) => a.year !== year) };
}

// ---------- Suppression ----------

/** Efface les jours actifs d'une année (les archives ne sont pas touchées). */
export function deleteYear(data: AppData, year: number): AppData {
  const workDays: Days = {};
  for (const [key, day] of Object.entries(data.workDays)) {
    if (yearOf(key) !== year) workDays[key] = day;
  }
  return { ...data, workDays };
}

/** Efface toutes les heures, archives comprises. Les réglages sont conservés. */
export function deleteAllDays(data: AppData): AppData {
  return { settings: data.settings, workDays: {}, archives: [] };
}

// ---------- Sauvegarde ----------

const BACKUP_APP = "work-agenda-management";
const BACKUP_VERSION = 1;

export interface BackupFile {
  app: typeof BACKUP_APP;
  version: number;
  /** Date de création (YYYY-MM-DD). */
  exportedAt: string;
  data: AppData;
}

export function buildBackup(data: AppData, todayKey: string): BackupFile {
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: todayKey,
    data: { settings: data.settings, workDays: data.workDays, archives: data.archives },
  };
}

/** "mes-heures-sauvegarde-2026-11-11.json" */
export function backupFileName(todayKey: string): string {
  return `mes-heures-sauvegarde-${todayKey}.json`;
}

/** Le fichier choisi n'est pas une sauvegarde utilisable ; le message est affichable tel quel. */
export class BackupError extends Error {}

export interface ParsedBackup {
  exportedAt: string;
  data: AppData;
  /** Jours du calendrier et des archives réunis. */
  dayCount: number;
}

export function parseBackup(text: string): ParsedBackup {
  let raw: any;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new BackupError("Ce fichier n'est pas une sauvegarde de l'application.");
  }
  if (raw?.app !== BACKUP_APP || typeof raw.data !== "object" || !raw.data) {
    throw new BackupError("Ce fichier n'est pas une sauvegarde de l'application.");
  }
  if (Number(raw.version) > BACKUP_VERSION) {
    throw new BackupError(
      "Cette sauvegarde vient d'une version plus récente de l'application. Mettez l'application à jour."
    );
  }

  const data = normalizeAppData(raw.data);
  const dayCount =
    Object.keys(data.workDays).length +
    data.archives.reduce((sum, a) => sum + Object.keys(a.workDays).length, 0);
  if (dayCount === 0) throw new BackupError("Cette sauvegarde ne contient aucune heure.");

  return { exportedAt: typeof raw.exportedAt === "string" ? raw.exportedAt : "", data, dayCount };
}

/** Remplace tout par le contenu de la sauvegarde (réglages compris). */
export function replaceWithBackup(current: AppData, backup: AppData): AppData {
  const next: AppData = { ...backup };
  if (current.lastBackupAt) next.lastBackupAt = current.lastBackupAt;
  else delete next.lastBackupAt;
  return next;
}

/**
 * Ajoute le contenu de la sauvegarde aux données du téléphone.
 * En cas de doublon, ce qui est déjà sur le téléphone est conservé, réglages compris.
 */
export function mergeBackup(current: AppData, backup: AppData): AppData {
  const archivedYears = new Set(current.archives.map((a) => a.year));
  const workDays: Days = { ...current.workDays };

  // Un jour de la sauvegarde dont l'année est archivée ici rejoint cette archive.
  const toArchive = new Map<number, Days>();
  for (const [key, day] of Object.entries(backup.workDays)) {
    const year = yearOf(key);
    if (archivedYears.has(year)) toArchive.set(year, { ...toArchive.get(year), [key]: day });
    else if (!workDays[key]) workDays[key] = day;
  }

  const archives = current.archives.map((archive) => ({
    ...archive,
    workDays: {
      ...backup.archives.find((a) => a.year === archive.year)?.workDays,
      ...toArchive.get(archive.year),
      ...archive.workDays,
    },
  }));
  for (const archive of backup.archives) {
    if (!archivedYears.has(archive.year)) archives.push(archive);
  }

  return { ...current, workDays, archives: sortArchives(archives) };
}
