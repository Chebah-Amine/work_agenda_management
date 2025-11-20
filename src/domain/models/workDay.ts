export interface ManualEntry {
    start: string; // ISO string
    end: string;
    breakMinutes?: number;
}

export interface WorkDay {
    date: string; // "YYYY-MM-DD"
    manualEntries: ManualEntry[];
    timedSessions: any[]; // prochaine version
}
