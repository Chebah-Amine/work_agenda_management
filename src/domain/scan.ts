import { isValidDateKey } from "./date";
import { DAY_OFF_REASONS, DayOffReason, WorkDay, WorkInterval } from "./models/workDay";
import { isValidInterval, normalizeTime, sortIntervals, validateIntervals } from "./time";

/** Un jour lu sur la photo, proposé à la validation. */
export interface ScanProposal {
  day: WorkDay;
  /** Ce que la lecture a d'incertain (créneau illisible, chevauchement…). */
  warnings: string[];
}

function readIntervals(raw: unknown, warnings: string[]): WorkInterval[] {
  if (!Array.isArray(raw)) return [];
  const intervals: WorkInterval[] = [];
  for (const item of raw) {
    const start = typeof item?.start === "string" ? normalizeTime(item.start) : null;
    const end = typeof item?.end === "string" ? normalizeTime(item.end) : null;
    if (start && end && isValidInterval({ start, end })) {
      intervals.push({ start, end });
    } else {
      warnings.push(
        `Créneau illisible ignoré (${item?.start ?? "?"} → ${item?.end ?? "?"}).`
      );
    }
  }
  return sortIntervals(intervals);
}

/**
 * Transforme la réponse JSON du modèle en propositions fiables :
 * dates valides uniquement, heures normalisées, un seul résultat par jour.
 */
export function parseScanResponse(response: unknown): ScanProposal[] {
  const rawDays = (response as any)?.days;
  if (!Array.isArray(rawDays)) return [];

  const byDate = new Map<string, ScanProposal>();

  for (const raw of rawDays) {
    const date = typeof raw?.date === "string" ? raw.date.trim() : "";
    if (!isValidDateKey(date)) continue;

    const warnings: string[] = [];
    const intervals = readIntervals(raw.intervals, warnings);
    let day: WorkDay;

    if (raw.worked === false) {
      const reason: DayOffReason = DAY_OFF_REASONS.some((r) => r.value === raw.absenceReason)
        ? raw.absenceReason
        : "repos";
      day = { date, status: "NOT_WORKED", intervals: [], dayOffReason: reason };
    } else if (intervals.length > 0) {
      day = { date, status: "WORKED", intervals };
      const error = validateIntervals(intervals);
      if (error) warnings.push(error);
    } else {
      continue; // rien d'exploitable pour ce jour
    }

    const previous = byDate.get(date);
    if (previous && previous.day.status === "WORKED" && day.status === "WORKED") {
      const merged = sortIntervals([...previous.day.intervals, ...day.intervals]);
      const mergedWarnings = [...previous.warnings, ...warnings];
      const error = validateIntervals(merged);
      if (error && !mergedWarnings.includes(error)) mergedWarnings.push(error);
      byDate.set(date, { day: { ...day, intervals: merged }, warnings: mergedWarnings });
    } else {
      byDate.set(date, { day, warnings });
    }
  }

  return [...byDate.values()].sort((a, b) => a.day.date.localeCompare(b.day.date));
}
