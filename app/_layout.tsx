import { AppDataProvider } from "@/state/AppDataContext";
import { colors } from "@/ui/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { ComponentProps } from "react";
import type { ColorValue } from "react-native";

type IconName = ComponentProps<typeof Ionicons>["name"];
type IconColor = ComponentProps<typeof Ionicons>["color"];

/** Icône pleine pour l'onglet actif, en contour pour les autres. */
const tabIcon = (name: IconName, outline: IconName) =>
  function TabIcon({ focused, color }: { focused: boolean; color: ColorValue; size: number }) {
    // @expo/vector-icons n'a pas encore élargi son type `color` au ColorValue de React Native 0.88.
    return <Ionicons name={focused ? name : outline} size={28} color={color as IconColor} />;
  };

export default function RootLayout() {
  return (
    <AppDataProvider>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarLabelStyle: { fontSize: 13, fontWeight: "700" },
          tabBarStyle: {
            minHeight: 68,
            paddingTop: 6,
            backgroundColor: colors.surface,
            borderTopColor: colors.borderLight,
          },
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          headerTitleAlign: "left",
          headerTitleStyle: { fontSize: 26, fontWeight: "800", color: colors.text },
          sceneStyle: { backgroundColor: colors.background },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{ title: "Mes heures", tabBarLabel: "Calendrier", tabBarIcon: tabIcon("calendar", "calendar-outline") }}
        />
        <Tabs.Screen
          name="scan"
          options={{ title: "Photo de mes notes", tabBarLabel: "Photo", tabBarIcon: tabIcon("camera", "camera-outline") }}
        />
        <Tabs.Screen
          name="report"
          options={{ title: "Rapport du mois", tabBarLabel: "Rapport", tabBarIcon: tabIcon("document-text", "document-text-outline") }}
        />
        <Tabs.Screen
          name="settings"
          options={{ title: "Réglages", tabBarLabel: "Réglages", tabBarIcon: tabIcon("settings", "settings-outline") }}
        />
      </Tabs>
    </AppDataProvider>
  );
}
