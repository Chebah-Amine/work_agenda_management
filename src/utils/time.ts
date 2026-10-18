import { WorkInterval } from "@/domain/models/workDay";

export function calculateTotalMinutes(intervals: WorkInterval[] = []): number {
  return intervals.reduce((total, { start, end }) => {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);

    const startMinutes = sh * 60 + sm;
    const endMinutes = eh * 60 + em;

    return total + (endMinutes - startMinutes);
  }, 0);
}
