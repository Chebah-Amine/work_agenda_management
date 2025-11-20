import { useEffect, useState } from "react";
import { getStorage } from "@/services/storage";
import { WorkSettings } from "@/domain/models/workSettings";

const DEFAULT_SETTINGS: WorkSettings = {
  baseMonthlyMinutes: 151 * 60,  // 151h / mois par défaut
  baseDailyMinutes: 7 * 60,       // 7h / jour
  workingDays: [1, 2, 3, 4, 5],   // Lundi → Vendredi
};

export function useSettings() {
  const [settings, setSettings] = useState<WorkSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await getStorage().load();
      if (data.settings) setSettings(data.settings);
      setLoading(false);
    };
    load();
  }, []);

  const saveSettings = async (newSettings: WorkSettings) => {
    const data = await getStorage().load();
    await getStorage().save({ ...data, settings: newSettings });
    setSettings(newSettings);
  };

  return { settings, saveSettings, loading };
}
