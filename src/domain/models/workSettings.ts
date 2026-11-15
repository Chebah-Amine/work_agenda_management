import { WorkInterval } from "./workDay";

export interface WorkSettings {
  /** Nom affiché en tête du rapport mensuel (optionnel). */
  employeeName: string;
  /** Durée hebdomadaire prévue au contrat, en minutes. */
  weeklyContractMinutes: number;
  /** Jours habituellement travaillés : 1 = lundi … 7 = dimanche. */
  workingDays: number[];
  /** Créneaux d'une journée habituelle (saisie rapide). */
  defaultIntervals: WorkInterval[];
  /** Destinataires de l'e-mail du rapport (RH…), pré-remplis à l'envoi. */
  mailTo: string[];
  /** Destinataires en copie. */
  mailCc: string[];
}

/** Nombre maximal d'adresses par liste (À / Cc). */
export const MAX_RECIPIENTS = 5;

/** Vérification volontairement simple : « quelque-chose@domaine.ext », sans espace. */
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

/** Adresses nettoyées : minuscules, sans doublon ni adresse invalide, bornées. */
export function cleanEmails(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const emails = raw
    .filter((e): e is string => typeof e === "string")
    .map((e) => e.trim().toLowerCase())
    .filter(isValidEmail);
  return [...new Set(emails)].slice(0, MAX_RECIPIENTS);
}

/** Durée légale hebdomadaire : au-delà, ce sont des heures supplémentaires. */
export const LEGAL_WEEKLY_MINUTES = 35 * 60;

export const DEFAULT_SETTINGS: WorkSettings = {
  employeeName: "",
  weeklyContractMinutes: 20 * 60,
  workingDays: [1, 2, 3, 4, 5],
  defaultIntervals: [
    { start: "07:00", end: "09:00" },
    { start: "16:00", end: "18:00" },
  ],
  mailTo: [],
  mailCc: [],
};
