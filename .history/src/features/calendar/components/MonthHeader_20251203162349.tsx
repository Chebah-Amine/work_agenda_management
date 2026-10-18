import { Text, TouchableOpacity, View } from "react-native";
import { calendarStyles as s } from "../CalendarStyles";

type Props = {
  monthLabel: string;
  onPrev: () => void;
  onNext: () => void;
};

export function MonthHeader({ monthLabel, onPrev, onNext }: Props) {
  return (
    <View style={s.header}>
      <TouchableOpacity style={s.navButton} onPress={onPrev}>
        <Text style={s.navText}>◀</Text>
      </TouchableOpacity>
      <Text style={s.monthTitle}>{monthLabel}</Text>
      <TouchableOpacity style={s.navButton} onPress={onNext}>
        <Text style={s.navText}>▶</Text>
      </TouchableOpacity>
    </View>
  );
}
