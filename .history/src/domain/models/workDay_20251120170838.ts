export type DayOffReason = "repos" | "maladie" | "congé" | "autre";

export interface ManualEntry {
  start: string; // "HH:MM"
  end: string;   // "HH:MM"
  breakMinutes?: number;
}

export type DayStatus = "NONE" | "WORKED" | "NOT_WORKED";

export interface WorkDay {
  date: string; // "YYYY-MM-DD"
  status: DayStatus;
  manualEntries: ManualEntry[];
  dayOffReason?: DayOffReason;
}
