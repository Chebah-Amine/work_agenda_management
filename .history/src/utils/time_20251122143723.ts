import { WorkInterval } from "@/domain/models/workDay";

export function calculateTotalMinutes(intervals: WorkInterval[]): number {
  return intervals.reduce((total, { start, end }) => {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);

    return total + (eh * 60 + em) - (sh * 60 + sm);
  }, 0);
}
