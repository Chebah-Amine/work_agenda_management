import { Text, TouchableOpacity, View } from "react-native";
import { calendarStyles as s } from "../CalendarStyles";
import Ionicons from '@expo/vector-icons/Ionicons';

type Props = {
  monthLabel: string;
  onPrev: () => void;
  onNext: () => void;
};

export function MonthHeader({ monthLabel, onPrev, onNext }: Props) {
  return (
    <View style={s.header}>
      <TouchableOpacity style={s.navButton} onPress={onPrev}>
        <Text style={s.navText}>
          <Ionicons name="checkmark-circle" size={32} color="green" />
          <ion-icon name="caret-back-outline"></ion-icon>
        </Text>
      </TouchableOpacity>
      <Text style={s.monthTitle}>{monthLabel}</Text>
      <TouchableOpacity style={s.navButton} onPress={onNext}>
        <Text style={s.navText}>▶</Text>
      </TouchableOpacity>
    </View>
  );
}
