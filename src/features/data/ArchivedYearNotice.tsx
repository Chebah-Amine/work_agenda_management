import { useAppData } from "@/state/AppDataContext";
import { colors, font, radius } from "@/ui/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";

/** Rappelle, sur un mois d'une année archivée, pourquoi il paraît vide et où retrouver ses heures. */
export function ArchivedYearNotice({ year }: { year: number }) {
  const { data } = useAppData();
  const router = useRouter();
  if (!data?.archives.some((archive) => archive.year === year)) return null;

  return (
    <Pressable style={s.notice} onPress={() => router.navigate("/data")} accessibilityRole="button">
      <Ionicons name="archive" size={24} color={colors.primary} />
      <Text style={s.text}>
        Les heures de {year} sont archivées. Touchez ici pour les retrouver dans « Mes données ».
      </Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: radius.medium,
    backgroundColor: colors.primaryLight,
  },
  text: { flex: 1, fontSize: font.small, fontWeight: "600", color: colors.text, lineHeight: 20 },
});
