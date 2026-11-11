export type DayOffReason = "repos" | "maladie" | "conge" | "autre";

export const DAY_OFF_REASONS: { label: string; value: DayOffReason }[] = [
  { label: "Repos", value: "repos" },
  { label: "Maladie", value: "maladie" },
  { label: "Congé", value: "conge" },
  { label: "Autre", value: "autre" },
];

export function dayOffLabel(reason: DayOffReason | undefined): string {
  return DAY_OFF_REASONS.find((r) => r.value === reason)?.label ?? "Repos";
}

export interface WorkInterval {
  start: string; // "07:00"
  end: string; // "10:00"
}

export type DayStatus = "WORKED" | "NOT_WORKED";

/** Longueur maximale du commentaire d'un jour (il doit tenir dans une case du rapport). */
export const DAY_COMMENT_MAX_LENGTH = 80;

export interface WorkDay {
  date: string; // YYYY-MM-DD (date locale)
  status: DayStatus;
  intervals: WorkInterval[];
  dayOffReason?: DayOffReason;
  /** Commentaire facultatif, repris dans la colonne « Remarque » du rapport. */
  comment?: string;
}

/** Commentaire nettoyé : une seule ligne, sans espaces superflus, borné ; undefined si vide. */
export function cleanDayComment(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const text = raw.replace(/\s+/g, " ").trim().slice(0, DAY_COMMENT_MAX_LENGTH).trim();
  return text || undefined;
}
