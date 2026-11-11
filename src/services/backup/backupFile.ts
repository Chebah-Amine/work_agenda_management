import { backupFileName, buildBackup } from "@/domain/dataManagement";
import { AppData } from "@/domain/models/appData";
import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

const JSON_MIME = "application/json";

/**
 * Crée le fichier de sauvegarde et le remet à l'utilisateur : partage du téléphone
 * (e-mail, Drive, Fichiers…) ou téléchargement sur le web.
 */
export async function exportBackup(data: AppData, todayKey: string): Promise<void> {
  const name = backupFileName(todayKey);
  const json = JSON.stringify(buildBackup(data, todayKey), null, 2);

  if (Platform.OS === "web") {
    const url = URL.createObjectURL(new Blob([json], { type: JSON_MIME }));
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
    return;
  }

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("Le partage de fichiers n'est pas disponible sur cet appareil.");
  }
  const file = new File(Paths.cache, name);
  if (file.exists) file.delete();
  file.create();
  await file.write(json);
  await Sharing.shareAsync(file.uri, {
    mimeType: JSON_MIME,
    UTI: "public.json",
    dialogTitle: "Sauvegarde de mes heures",
  });
}

/** Fait choisir un fichier et renvoie son texte, ou null si l'utilisateur a annulé. */
export async function pickBackupText(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    // Certains gestionnaires de fichiers ne reconnaissent pas le type JSON : on accepte tout.
    type: [JSON_MIME, "text/*", "*/*"],
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;

  const asset = result.assets[0];
  if (Platform.OS === "web") return asset.file ? await asset.file.text() : null;
  return await new File(asset.uri).text();
}
