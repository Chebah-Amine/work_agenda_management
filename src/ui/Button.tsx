import Ionicons from "@expo/vector-icons/Ionicons";
import { ComponentProps } from "react";
import { StyleProp, StyleSheet, Text, TouchableOpacity, ViewStyle } from "react-native";
import { colors, font } from "./theme";

type Variant = "primary" | "secondary" | "danger";

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: ComponentProps<typeof Ionicons>["name"];
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

const TEXT_COLOR: Record<Variant, string> = {
  primary: "#FFFFFF",
  secondary: colors.text,
  danger: colors.danger,
};

export function Button({ label, onPress, variant = "primary", icon, disabled, style }: Props) {
  const color = TEXT_COLOR[variant];
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      style={[s.base, s[variant], disabled && s.disabled, style]}
      onPress={onPress}
      disabled={disabled}
    >
      {icon && <Ionicons name={icon} size={22} color={color} />}
      <Text style={[s.label, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  base: {
    minHeight: 52,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
  },
  primary: { backgroundColor: colors.primary, borderColor: colors.primary },
  secondary: { backgroundColor: colors.surface, borderColor: colors.border },
  danger: { backgroundColor: colors.dangerLight, borderColor: colors.dangerLight },
  disabled: { opacity: 0.45 },
  label: { fontSize: font.body, fontWeight: "600", textAlign: "center", flexShrink: 1 },
});
