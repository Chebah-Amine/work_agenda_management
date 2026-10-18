import { Text, TouchableOpacity, View } from "react-native";
import { calendarStyles as s } from "../CalendarStyles";

type Props = {
  rangeMode: boolean;
  rangeStart: Date | null;
  rangeEnd: Date | null;
  onToggle: () => void;
  onClear: () => void;
  formatDisplayDate: (date: Date) => string;
};

export function RangeSelector({
  rangeMode,
  rangeStart,
  rangeEnd,
  onToggle,
  onClear,
  formatDisplayDate,
}: Props) {
  return (
    <>
    
    <View style={s.rangeBar}>
      <TouchableOpacity
        style={[s.rangeToggle, rangeMode && s.rangeToggleActive]}
        onPress={onToggle}
      >
        <Text style={[s.rangeToggleText, rangeMode && s.rangeToggleTextActive]}>
          Mode intervalle
        </Text>
      </TouchableOpacity>
      <View style={s.rangeInfo}>
        <Text style={s.rangeInfoText}>
          Début : {rangeStart ? formatDisplayDate(rangeStart) : "--"}
        </Text>
        <Text style={s.rangeInfoText}>
          Fin : {rangeEnd ? formatDisplayDate(rangeEnd) : "--"}
        </Text>
      </View>
    </View>
    </>
    
  );
}
