import { Paths } from "expo-file-system";
import { Platform } from "react-native";
import { StorageService } from "./storage";

console.log(Paths.document);


export class LocalStorage implements StorageService {
  async load() {
    // 🌐 Web : fallback sur localStorage
    if (Platform.OS === "web") {
      const raw = globalThis.localStorage?.getItem("data");
      return raw ? JSON.parse(raw) : {};
    }

    // 📱 Mobile : fichier dans Documents
    try {
      if (!file.exists) {
        // fichier pas encore créé
        return {};
      }

      const text = await file.text(); // nouvelle API async
      return text ? JSON.parse(text) : {};
    } catch (e) {
      console.warn("Error reading local file", e);
      return {};
    }
  }

  async save(data: any) {
    const json = JSON.stringify(data);

    // 🌐 Web
    if (Platform.OS === "web") {
      globalThis.localStorage?.setItem("data", json);
      return;
    }

    // 📱 Mobile
    try {
      // create() lève si le fichier existe déjà, donc on entoure en try/catch
      if (!file.exists) {
        file.create();
      }

      file.write(json); // sync mais très léger pour un petit JSON
    } catch (e) {
      console.warn("Error writing local file", e);
    }
  }
}
