import { WorkInterval } from "./models/workDay";

const pad = (n: number) => String(n).padStart(2, "0");

/** "07:30" → 450 ; null si le format est invalide. */
export function parseTime(value: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/** 450 → "07:30" (borné à la journée). */
export function formatTime(minutes: number): string {
  const bounded = Math.min(Math.max(Math.round(minutes), 0), 23 * 60 + 59);
  return `${pad(Math.floor(bounded / 60))}:${pad(bounded % 60)}`;
}

/** 270 → "4 h 30" */
export function formatDuration(minutes: number): string {
  const rounded = Math.round(minutes);
  const sign = rounded < 0 ? "-" : "";
  const abs = Math.abs(rounded);
  return `${sign}${Math.floor(abs / 60)} h ${pad(abs % 60)}`;
}

/**
 * Accepte les écritures manuscrites courantes : "7h30", "7 h", "07:30", "7.30", "0730".
 * Renvoie "HH:MM" ou null.
 */
export function normalizeTime(raw: string): string | null {
  const text = raw.trim().toLowerCase().replace(/\s+/g, "");
  const m =
    /^(\d{1,2})(?:h|:|\.|,)(\d{2})?$/.exec(text) ??
    /^(\d{1,2})(\d{2})$/.exec(text) ??
    /^(\d{1,2})$/.exec(text);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2] ?? 0);
  if (h > 23 || min > 59) return null;
  return `${pad(h)}:${pad(min)}`;
}

export function intervalMinutes(interval: WorkInterval): number {
  const start = parseTime(interval.start);
  const end = parseTime(interval.end);
  if (start === null || end === null || end <= start) return 0;
  return end - start;
}

export function totalMinutes(intervals: WorkInterval[] = []): number {
  return intervals.reduce((sum, i) => sum + intervalMinutes(i), 0);
}

export function isValidInterval(interval: WorkInterval): boolean {
  return intervalMinutes(interval) > 0;
}

export function sortIntervals(intervals: WorkInterval[]): WorkInterval[] {
  return [...intervals].sort(
    (a, b) => (parseTime(a.start) ?? 0) - (parseTime(b.start) ?? 0)
  );
}

/** Message d'erreur en français, ou null si les créneaux sont cohérents. */
export function validateIntervals(intervals: WorkInterval[]): string | null {
  if (intervals.length === 0) return "Ajoutez au moins un créneau.";

  for (let i = 0; i < intervals.length; i++) {
    if (!isValidInterval(intervals[i])) {
      return `Créneau ${i + 1} : l'heure de fin doit être après l'heure de début.`;
    }
  }

  const sorted = sortIntervals(intervals);
  for (let i = 1; i < sorted.length; i++) {
    if (parseTime(sorted[i].start)! < parseTime(sorted[i - 1].end)!) {
      return `Les créneaux ${sorted[i - 1].start}–${sorted[i - 1].end} et ${sorted[i].start}–${sorted[i].end} se chevauchent.`;
    }
  }
  return null;
}

/** "07:00–09:00, 16:00–18:00" */
export function formatIntervals(intervals: WorkInterval[]): string {
  return intervals.map((i) => `${i.start}–${i.end}`).join(", ");
}
