import { useEffect, useState } from "react";
import { View, Text, Button } from "react-native";
import { getStorage } from "@/services/storage";

export default function HomeScreen() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    getStorage().load().then(setData);
  }, []);

  async function saveTest() {
    const newData = { message: "Hello world offline!" };
    await getStorage().save(newData);
    setData(newData);
  }

  return (
    <View style={{ padding: 20 }}>
      <Text>Données actuelles :</Text>
      <Text>{JSON.stringify(data)}</Text>

      <Button title="Sauvegarder" onPress={saveTest} />
    </View>
  );
}
