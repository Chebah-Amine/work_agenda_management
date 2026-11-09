import { AppData, normalizeAppData } from "@/domain/models/appData";
import { WorkDay } from "@/domain/models/workDay";
import { WorkSettings } from "@/domain/models/workSettings";
import { getStorage } from "@/services/storage";
import { createContext, ReactNode, useContext, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";

type AppDataContextValue = {
  /** null tant que les données ne sont pas chargées. */
  data: AppData | null;
  saveSettings: (settings: WorkSettings) => Promise<void>;
  /** Ajoute ou remplace les jours donnés. */
  saveDays: (days: WorkDay[]) => Promise<void>;
  /** Efface la saisie des jours donnés (clés YYYY-MM-DD). */
  deleteDays: (dateKeys: string[]) => Promise<void>;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

/** Source unique des données : tous les écrans lisent et écrivent ici. */
export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);
  // Dernière version connue, pour enchaîner deux écritures sans en perdre une.
  const latest = useRef<AppData | null>(null);

  useEffect(() => {
    let cancelled = false;
    getStorage()
      .load()
      .then((raw) => {
        if (cancelled) return;
        latest.current = normalizeAppData(raw);
        setData(latest.current);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function update(change: (current: AppData) => AppData) {
    if (!latest.current) return;
    const next = change(latest.current);
    latest.current = next;
    setData(next);
    try {
      await getStorage().save(next);
    } catch (e) {
      console.warn("Enregistrement impossible", e);
      Alert.alert(
        "Enregistrement impossible",
        "Vos modifications n'ont pas pu être enregistrées sur le téléphone."
      );
    }
  }

  const value: AppDataContextValue = {
    data,
    saveSettings: (settings) => update((current) => ({ ...current, settings })),
    saveDays: (days) =>
      update((current) => {
        const workDays = { ...current.workDays };
        for (const day of days) workDays[day.date] = day;
        return { ...current, workDays };
      }),
    deleteDays: (dateKeys) =>
      update((current) => {
        const workDays = { ...current.workDays };
        for (const key of dateKeys) delete workDays[key];
        return { ...current, workDays };
      }),
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const value = useContext(AppDataContext);
  if (!value) throw new Error("useAppData doit être utilisé sous AppDataProvider");
  return value;
}
