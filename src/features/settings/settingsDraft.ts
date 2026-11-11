import { WorkSettings } from "@/domain/models/workSettings";
import { sortIntervals, validateIntervals } from "@/domain/time";

/** Forme enregistrée d'un brouillon de réglages : nom sans espaces autour, listes triées. */
export function normalizeSettingsDraft(draft: WorkSettings): WorkSettings {
  return {
    employeeName: draft.employeeName.trim(),
    weeklyContractMinutes: draft.weeklyContractMinutes,
    workingDays: [...draft.workingDays].sort(),
    defaultIntervals: sortIntervals(draft.defaultIntervals),
  };
}

export const NO_WORKING_DAY_ERROR = "Choisissez au moins un jour travaillé.";

/** Ce qui empêche d'enregistrer le brouillon (message affichable), ou null. */
export function settingsDraftError(draft: WorkSettings): string | null {
  return draft.workingDays.length === 0
    ? NO_WORKING_DAY_ERROR
    : validateIntervals(draft.defaultIntervals);
}
