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

export interface WorkDay {
  date: string; // YYYY-MM-DD (date locale)
  status: DayStatus;
  intervals: WorkInterval[];
  dayOffReason?: DayOffReason;
}
