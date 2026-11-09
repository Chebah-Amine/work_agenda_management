import { AppDataProvider } from "@/state/AppDataContext";
import { colors } from "@/ui/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { ComponentProps } from "react";

type IconName = ComponentProps<typeof Ionicons>["name"];

const tabIcon = (name: IconName) =>
  function TabIcon({ color, size }: { color: string; size: number }) {
    return <Ionicons name={name} size={size} color={color} />;
  };

export default function RootLayout() {
  return (
    <AppDataProvider>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarLabelStyle: { fontSize: 13, fontWeight: "600" },
          tabBarStyle: { minHeight: 64 },
          headerTitleStyle: { fontSize: 22, fontWeight: "700" },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{ title: "Mes heures", tabBarLabel: "Calendrier", tabBarIcon: tabIcon("calendar") }}
        />
        <Tabs.Screen
          name="scan"
          options={{ title: "Photo de mes notes", tabBarLabel: "Photo", tabBarIcon: tabIcon("camera") }}
        />
        <Tabs.Screen
          name="report"
          options={{ title: "Rapport du mois", tabBarLabel: "Rapport", tabBarIcon: tabIcon("document-text") }}
        />
        <Tabs.Screen
          name="settings"
          options={{ title: "Réglages", tabBarLabel: "Réglages", tabBarIcon: tabIcon("settings") }}
        />
      </Tabs>
    </AppDataProvider>
  );
}
