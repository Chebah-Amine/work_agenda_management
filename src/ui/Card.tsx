import Ionicons from "@expo/vector-icons/Ionicons";
import { ComponentProps, ReactNode } from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { colors, font, radius, shadow, spacing } from "./theme";

type IconName = ComponentProps<typeof Ionicons>["name"];

type CardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Bloc blanc arrondi : l'unité visuelle de tous les écrans. */
export function Card({ children, style }: CardProps) {
  return <View style={[s.card, style]}>{children}</View>;
}

type HeaderProps = {
  icon: IconName;
  title: string;
  subtitle?: string;
  /** Teinte de la pastille d'icône. */
  tint?: { background: string; color: string };
};

/** En-tête de carte : pastille d'icône, titre et explication courte. */
export function CardHeader({ icon, title, subtitle, tint }: HeaderProps) {
  const color = tint?.color ?? colors.primary;
  return (
    <View style={s.header}>
      <View style={[s.badge, { backgroundColor: tint?.background ?? colors.primaryLight }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={s.headerText}>
        <Text style={s.title}>{title}</Text>
        {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    padding: spacing.card,
    gap: spacing.gap,
    borderRadius: radius.large,
    backgroundColor: colors.surface,
    boxShadow: shadow.card,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  badge: {
    width: 44,
    height: 44,
    borderRadius: radius.medium,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1, gap: 2 },
  title: { fontSize: font.large, fontWeight: "700", color: colors.text },
  subtitle: { fontSize: font.small, color: colors.textMuted, lineHeight: 20 },
});
