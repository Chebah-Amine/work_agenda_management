import { StyleProp, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import { calendarStyles as s } from "../CalendarStyles";

type Props = {
  monthMatrix: (Date | null)[][];
  weekDays: string[];
  getDayStyle: (date: Date | null) => StyleProp<ViewStyle>;
  onDayPress: (date: Date) => void;
};

export function MonthGrid({
  monthMatrix,
  weekDays,
  getDayStyle,
  onDayPress,
}: Props) {
  return (
    <>
      <View style={s.weekHeader}>
        {weekDays.map((d) => (
          <Text key={d} style={s.weekHeaderCell}>
            {d}
          </Text>
        ))}
      </View>

      <View style={s.grid}>
        {monthMatrix.map((week, i) => (
          <View key={i} style={s.weekRow}>
            {week.map((date, j) => (
              <TouchableOpacity
                key={j}
                style={getDayStyle(date)}
                disabled={!date}
                onPress={() => date && onDayPress(date)}
              >
                {date && <Text style={s.dayCellText}>{date.getDate()}</Text>}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </>
  );
}
