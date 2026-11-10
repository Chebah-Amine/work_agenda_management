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
};
