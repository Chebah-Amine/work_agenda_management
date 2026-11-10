import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { colors, font } from "./theme";

export function LoadingView({ label = "Chargement…" }: { label?: string }) {
  return (
    <View style={s.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={s.label}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
    backgroundColor: colors.background,
  },
  label: { fontSize: font.body, color: colors.textMuted, textAlign: "center" },
});
