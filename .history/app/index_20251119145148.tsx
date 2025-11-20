import { useEffect, useState } from "react";
import { Button, Text, View } from "react-native";
import { getStorage } from "../src/services/storage/";

export default function HomeScreen() {
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        getStorage().load().then(setData);
    }, []);

    const saveTest = async () => {
        const newData = { message: "Hello offline world!" };
        await getStorage().save(newData);
        setData(newData);
    };

    return (
        <View style={{ padding: 20 }}>
            <Text>Données actuelles :</Text>
            <Text>{JSON.stringify(data)}</Text>

            <Button title="Sauvegarder" onPress={saveTest} />
        </View>
    );
}
