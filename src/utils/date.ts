export function formatDateKey(date: Date): string {
  return date.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function getDateRange(start: Date, end: Date): Date[] {
  const first = start < end ? start : end;
  const last = start < end ? end : start;

  const days: Date[] = [];
  const cursor = new Date(first);

  while (cursor <= last) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

export function getMonthMatrix(year: number, month: number): (Date | null)[][] {
  // month: 0-11
  const firstDay = new Date(year, month, 1);
  // 0 = lundi, ..., 6 = dimanche
  const startDay = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const weeks: (Date | null)[][] = [];
  let current = 1 - startDay;

  for (let w = 0; w < 6; w++) {
    const week: (Date | null)[] = [];
    for (let d = 0; d < 7; d++) {
      if (current < 1 || current > daysInMonth) {
        week.push(null);
      } else {
        week.push(new Date(year, month, current));
      }
      current++;
    }
    weeks.push(week);
  }

  return weeks;
}

// Jours fériés fixes France (sans Pâques & co pour l'instant)
export function isFrenchFixedHoliday(date: Date): boolean {
  const d = date.getDate();
  const m = date.getMonth() + 1;

  const fixed: [number, number][] = [
    [1, 1],   // 1 janvier
    [1, 5],   // 1 mai
    [8, 5],   // 8 mai
    [14, 7],  // 14 juillet
    [15, 8],  // 15 août
    [1, 11],  // Toussaint
    [11, 11], // 11 novembre
    [25, 12], // Noël
  ];

  return fixed.some(([day, month]) => day === d && month === m);
}

// 1-7 => lundi-dimanche
export function getWeekdayIndex1to7(date: Date): number {
  return ((date.getDay() + 6) % 7) + 1;
}
