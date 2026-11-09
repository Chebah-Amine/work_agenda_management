export const MONTH_NAMES = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];
export const WEEKDAY_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
export const WEEKDAY_LONG = [
  "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche",
];

const pad = (n: number) => String(n).padStart(2, "0");

/** Clé "YYYY-MM-DD" en heure locale (surtout pas toISOString, qui décale d'un jour en France). */
export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function isValidDateKey(key: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) return false;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return toDateKey(d) === key;
}

/** Minuit local du jour désigné par la clé. */
export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function isSameDay(a: Date, b: Date): boolean {
  return toDateKey(a) === toDateKey(b);
}

/** 1 = lundi … 7 = dimanche */
export function weekdayIndex(date: Date): number {
  return ((date.getDay() + 6) % 7) + 1;
}

/** Lundi de la semaine civile contenant la date. */
export function startOfWeek(date: Date): Date {
  return addDays(date, 1 - weekdayIndex(date));
}

/** Tous les jours de a à b inclus, quel que soit l'ordre. */
export function getDateRange(a: Date, b: Date): Date[] {
  const first = a <= b ? a : b;
  const last = a <= b ? b : a;
  const days: Date[] = [];
  for (let d = first; d <= last; d = addDays(d, 1)) days.push(d);
  return days;
}

/** Semaines (lundi → dimanche) du mois ; null pour les cases hors mois. */
export function getMonthMatrix(year: number, month: number): (Date | null)[][] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = weekdayIndex(new Date(year, month, 1)) - 1;
  const weekCount = Math.ceil((offset + daysInMonth) / 7);

  return Array.from({ length: weekCount }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const day = w * 7 + d - offset + 1;
      return day >= 1 && day <= daysInMonth ? new Date(year, month, day) : null;
    })
  );
}

function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

const FIXED_HOLIDAYS: Record<string, string> = {
  "01-01": "Jour de l'an",
  "05-01": "Fête du Travail",
  "05-08": "Victoire 1945",
  "07-14": "Fête nationale",
  "08-15": "Assomption",
  "11-01": "Toussaint",
  "11-11": "Armistice 1918",
  "12-25": "Noël",
};

/** Nom du jour férié français (métropole), ou null. */
export function getFrenchHolidayName(date: Date): string | null {
  const fixed = FIXED_HOLIDAYS[toDateKey(date).slice(5)];
  if (fixed) return fixed;

  const easter = easterSunday(date.getFullYear());
  if (isSameDay(date, addDays(easter, 1))) return "Lundi de Pâques";
  if (isSameDay(date, addDays(easter, 39))) return "Ascension";
  if (isSameDay(date, addDays(easter, 50))) return "Lundi de Pentecôte";
  return null;
}

/** "09/11/2026" */
export function formatShortDate(date: Date): string {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

/** "09/11" */
export function formatDayMonth(date: Date): string {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}`;
}

/** "Lundi 9 novembre 2026" */
export function formatLongDate(date: Date): string {
  return `${WEEKDAY_LONG[weekdayIndex(date) - 1]} ${date.getDate()} ${MONTH_NAMES[
    date.getMonth()
  ].toLowerCase()} ${date.getFullYear()}`;
}

export function formatMonthLabel(year: number, month: number): string {
  return `${MONTH_NAMES[month]} ${year}`;
}
