import Ionicons from "@expo/vector-icons/Ionicons";
import { ComponentProps } from "react";
import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from "react-native";
import { colors, font, radius, shadow } from "./theme";

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
  primary: colors.onPrimary,
  secondary: colors.primary,
  danger: colors.danger,
};

export function Button({ label, onPress, variant = "primary", icon, disabled, style }: Props) {
  const color = TEXT_COLOR[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        s.base,
        s[variant],
        pressed && s.pressed,
        disabled && s.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      {icon && <Ionicons name={icon} size={22} color={color} />}
      <Text style={[s.label, { color }]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  base: {
    minHeight: 54,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: radius.medium,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primary: { backgroundColor: colors.primary, boxShadow: shadow.raised },
  secondary: { backgroundColor: colors.primaryLight },
  danger: { backgroundColor: colors.dangerLight },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.45, boxShadow: "none" },
  label: { fontSize: font.body, fontWeight: "700", textAlign: "center", flexShrink: 1 },
});
