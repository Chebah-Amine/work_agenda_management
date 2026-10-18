import { Link } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

export default function HomeScreen() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 20 }}>
      <Text style={{ fontSize: 28, marginBottom: 20, fontWeight: "700" }}>
        Worktime Tracker
      </Text>

      {/* Bouton Paramètres */}
      <Link href="/settings" asChild>
        <TouchableOpacity
          style={{
            backgroundColor: "#2563EB",
            paddingVertical: 14,
            paddingHorizontal: 24,
            borderRadius: 12,
            width: 240,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontSize: 18, fontWeight: "600" }}>
            Ouvrir les paramètres
          </Text>
        </TouchableOpacity>
      </Link>

      {/* Bouton Calendrier */}
      <Link href="/calendar" asChild>
        <TouchableOpacity
          style={{
            backgroundColor: "#10B981",
            paddingVertical: 14,
            paddingHorizontal: 24,
            borderRadius: 12,
            width: 240,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontSize: 18, fontWeight: "600" }}>
            Ouvrir le calendrier
          </Text>
        </TouchableOpacity>
      </Link>

    </View>
  );
}
