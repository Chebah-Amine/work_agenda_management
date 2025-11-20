import { Link } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

export default function HomeScreen() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Worktime Tracker</Text>

      <Link href="/settings" asChild>
        <TouchableOpacity
          style={{
            backgroundColor: "#2563EB",
            paddingVertical: 14,
            paddingHorizontal: 24,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: "white", fontSize: 18, fontWeight: "600" }}>
            Ouvrir les paramètres
          </Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}
