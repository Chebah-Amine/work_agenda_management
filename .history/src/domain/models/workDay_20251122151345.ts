export type DayOffReason = "repos" | "maladie" | "congé" | "autre";

export interface WorkInterval {
  start: string; // "07:00"
  end: string;   // "10:00"
}

export type DayStatus = "WORKED" | "NOT_WORKED";

export interface WorkDay {
  date: string; // YYYY-MM-DD
  status: DayStatus;
  intervals: WorkInterval[] = [];
  dayOffReason?: DayOffReason;
}
