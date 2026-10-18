import { Text, View } from "react-native";
import { calendarStyles as s } from "../CalendarStyles";

export function CalendarLegend() {
  return (
    <View style={s.legendContainer}>
      <View style={s.legendItem}>
        <View style={[s.legendColor, { backgroundColor: "#FEF3C7" }]} />
        <Text>Jour travaillé (non saisi)</Text>
      </View>
      <View style={s.legendItem}>
        <View style={[s.legendColor, { backgroundColor: "#BBF7D0" }]} />
        <Text>Jour saisi</Text>
      </View>
      <View style={s.legendItem}>
        <View style={[s.legendColor, { backgroundColor: "#FECACA" }]} />
        <Text>Jour férié</Text>
      </View>
      <View style={s.legendItem}>
        <View style={[s.legendColor, { backgroundColor: "#F3F4F6" }]} />
        <Text>Hors mois / non travaillé</Text>
      </View>
    </View>
  );
}
