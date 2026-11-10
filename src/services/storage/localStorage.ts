import { File, Paths } from "expo-file-system";
import { Platform } from "react-native";
import { StorageService } from "./storage";

const WEB_KEY = "data";

export class LocalStorage implements StorageService {
  // Créé à la demande : Paths.document n'existe pas sur le web.
  private get file() {
    return new File(Paths.document, "data.json");
  }

  async load(): Promise<unknown> {
    try {
      if (Platform.OS === "web") {
        const raw = globalThis.localStorage?.getItem(WEB_KEY);
        return raw ? JSON.parse(raw) : {};
      }
      const file = this.file;
      if (!file.exists) return {};
      const text = await file.text();
      return text ? JSON.parse(text) : {};
    } catch (e) {
      console.warn("Lecture des données impossible", e);
      return {};
    }
  }

  async save(data: unknown): Promise<void> {
    const json = JSON.stringify(data);
    if (Platform.OS === "web") {
      globalThis.localStorage?.setItem(WEB_KEY, json);
      return;
    }
    const file = this.file;
    if (!file.exists) file.create();
    await file.write(json);
  }
}
