import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";
import { StorageService } from "./storage";

const FILE_PATH = FileSystem.documentDirectory + "data.json";

export class LocalStorage implements StorageService {

    async load() {
        // --- Web fallback ---
        if (Platform.OS === "web") {
            const raw = localStorage.getItem("data");
            return raw ? JSON.parse(raw) : {};
        }


        // --- Mobile version ---
        try {
            const raw = await FileSystem.readAsStringAsync(FILE_PATH);
            return JSON.parse(raw);
        } catch (e) {
            return {};
        }
    }

    async save(data: any) {
        const json = JSON.stringify(data);

        // --- Web fallback ---
        if (Platform.OS === "web") {
            localStorage.setItem("data", json);
            return;
        }

        // --- Mobile version ---
        await FileSystem.writeAsStringAsync(FILE_PATH, json);
    }
}
