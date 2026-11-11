import { MonthlyReport, reportFileName } from "@/domain/report";
import { buildShareMessage } from "@/domain/shareMessage";
import { Directory, File, Paths } from "expo-file-system";
import * as MailComposer from "expo-mail-composer";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import * as XLSX from "xlsx";
import { buildReportHtml } from "./reportHtml";
import { buildReportRows } from "./reportSheet";

export type ReportFormat = "pdf" | "excel";

/** Fichier de rapport prêt à être écrit, contenu encodé en base64. */
type ReportDocument = {
  name: string;
  mimeType: string;
  /** Type de fichier attendu par le partage iOS. */
  uti: string;
  base64: string;
};

const PDF = { mimeType: "application/pdf", uti: "com.adobe.pdf", extension: "pdf" };
const EXCEL = {
  mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  uti: "org.openxmlformats.spreadsheetml.sheet",
  extension: "xlsx",
};

/** Le partage et l'enregistrement dans un dossier ne sont proposés que sur téléphone. */
export const canShareReports = Platform.OS !== "web";

function buildWorkbook(report: MonthlyReport): XLSX.WorkBook {
  const sheet = XLSX.utils.aoa_to_sheet(buildReportRows(report));
  sheet["!cols"] = [{ wch: 34 }, { wch: 30 }, { wch: 14 }, { wch: 16 }, { wch: 22 }, { wch: 20 }];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Relevé");
  return workbook;
}

async function buildDocument(report: MonthlyReport, format: ReportFormat): Promise<ReportDocument> {
  const baseName = reportFileName(report);
  if (format === "pdf") {
    // On récupère le PDF en base64 au lieu de déplacer le fichier d'expo-print :
    // dans Expo Go, son dossier de sortie n'est pas accessible à expo-file-system.
    const { base64 } = await Print.printToFileAsync({ html: buildReportHtml(report), base64: true });
    if (!base64) throw new Error("La génération du PDF a échoué.");
    return { name: `${baseName}.${PDF.extension}`, mimeType: PDF.mimeType, uti: PDF.uti, base64 };
  }
  const base64: string = XLSX.write(buildWorkbook(report), { type: "base64", bookType: "xlsx" });
  return { name: `${baseName}.${EXCEL.extension}`, mimeType: EXCEL.mimeType, uti: EXCEL.uti, base64 };
}

/** Sur le web : impression (→ « Enregistrer en PDF ») via un cadre invisible. */
function printHtmlOnWeb(html: string) {
  const frame = document.createElement("iframe");
  frame.style.cssText = "position:fixed;width:0;height:0;border:0;";
  frame.srcdoc = html;
  frame.onload = () => {
    frame.contentWindow?.print();
    setTimeout(() => frame.remove(), 60_000);
  };
  document.body.appendChild(frame);
}

async function writeToCache(doc: ReportDocument): Promise<File> {
  const file = new File(Paths.cache, doc.name);
  if (file.exists) file.delete();
  file.create();
  await file.write(doc.base64, { encoding: "base64" });
  return file;
}

/** Ouvre le partage du téléphone (messagerie, Drive, impression…), sans texte d'accompagnement. */
export async function shareReport(report: MonthlyReport, format: ReportFormat): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("Le partage de fichiers n'est pas disponible sur cet appareil.");
  }
  const doc = await buildDocument(report, format);
  const file = await writeToCache(doc);
  await Sharing.shareAsync(file.uri, { mimeType: doc.mimeType, UTI: doc.uti, dialogTitle: report.title });
}

export class NoMailAppError extends Error {
  constructor() {
    super("Aucune application d'e-mail n'est configurée sur ce téléphone.");
  }
}

/** Ouvre un e-mail prêt à envoyer : objet, message type et rapport en pièce jointe. */
export async function emailReport(report: MonthlyReport, format: ReportFormat): Promise<void> {
  if (!(await MailComposer.isAvailableAsync())) throw new NoMailAppError();
  const doc = await buildDocument(report, format);
  const file = await writeToCache(doc);
  const { subject, body } = buildShareMessage(report);
  await MailComposer.composeAsync({ subject, body, attachments: [file.uri] });
}

/** Dernier dossier choisi, pour rouvrir le sélecteur au même endroit. */
let lastDirectoryUri: string | undefined;

function isPickerCancelled(e: unknown): boolean {
  const { code, message } = (e ?? {}) as { code?: string; message?: string };
  return /cancel/i.test(`${code ?? ""} ${message ?? ""}`);
}

/**
 * Enregistre le rapport sur l'appareil, dans le dossier choisi par l'utilisateur.
 * Renvoie le nom du fichier créé, ou null si l'utilisateur a annulé.
 */
export async function downloadReport(report: MonthlyReport, format: ReportFormat): Promise<string | null> {
  if (Platform.OS === "web") {
    if (format === "pdf") printHtmlOnWeb(buildReportHtml(report));
    else XLSX.writeFile(buildWorkbook(report), `${reportFileName(report)}.${EXCEL.extension}`);
    return null;
  }

  let directory: Directory;
  try {
    directory = await Directory.pickDirectoryAsync(lastDirectoryUri);
  } catch (e) {
    if (isPickerCancelled(e)) return null;
    throw e;
  }
  lastDirectoryUri = directory.uri;

  const doc = await buildDocument(report, format);
  // iOS refuse de créer un fichier déjà présent : on remplace l'ancien rapport du même mois.
  // Android, lui, crée « nom (1).pdf » tout seul.
  if (Platform.OS === "ios") {
    const existing = new File(directory, doc.name);
    if (existing.exists) existing.delete();
  }
  const file = directory.createFile(doc.name, doc.mimeType);
  await file.write(doc.base64, { encoding: "base64" });
  return file.name;
}
