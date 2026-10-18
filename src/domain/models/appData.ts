import { WorkDay } from "./workDay";
import { WorkSettings } from "./workSettings";

export interface AppData {
  settings?: WorkSettings;
  workDays: Record<string, WorkDay>;
}
