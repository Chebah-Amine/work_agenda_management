import { Text, View } from "react-native";
import { MonthStats } from "@/utils/monthStats";
import { calendarStyles as s } from "../CalendarStyles";

type Props = {
  stats: MonthStats | null;
};

export function StatsBar({ stats }: Props) {
  if (!stats) return null;

  return (
    <View style={s.statsContainer}>
      <View style={s.statsBox}>
        <Text style={s.statsValue}>{stats.workedDaysCount}</Text>
        <Text style={s.statsLabel}>Jours travaillés</Text>
      </View>

      <View style={s.statsBox}>
        <Text style={s.statsValue}>{(stats.totalMinutes / 60).toFixed(1)} h</Text>
        <Text style={s.statsLabel}>Heures totales</Text>
      </View>

      <View style={s.statsBox}>
        <Text style={s.statsValue}>
          {(stats.averageMinutesPerWorkedDay / 60).toFixed(1)} h
        </Text>
        <Text style={s.statsLabel}>Heures / jour</Text>
      </View>

      <View style={s.statsBox}>
        <Text
          style={[
            s.statsValue,
            { color: stats.overtimeMinutes > 0 ? "#DC2626" : "#10B981" },
          ]}
        >
          {(stats.overtimeMinutes / 60).toFixed(1)} h
        </Text>
        <Text style={s.statsLabel}>Heures sup.</Text>
      </View>
    </View>
  );
}
