import { WorkSettings } from "./workSettings";
import { WorkDay } from "./workDay";

export interface AppData {
  settings?: WorkSettings;
  workDays: Record<string, WorkDay>; // "2025-11-15": {...}
}
