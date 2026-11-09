import { MonthlyReport, reportFileName } from "@/domain/report";
import { File, Paths } from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import * as XLSX from "xlsx";
import { buildReportHtml } from "./reportHtml";
import { buildReportRows } from "./reportSheet";

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

async function share(file: File, mimeType: string, uti: string, title: string) {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("Le partage de fichiers n'est pas disponible sur cet appareil.");
  }
  await Sharing.shareAsync(file.uri, { mimeType, UTI: uti, dialogTitle: title });
}

function cacheFile(name: string): File {
  const file = new File(Paths.cache, name);
  if (file.exists) file.delete();
  return file;
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

export async function exportReportPdf(report: MonthlyReport): Promise<void> {
  const html = buildReportHtml(report);
  if (Platform.OS === "web") {
    printHtmlOnWeb(html);
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  const target = cacheFile(`${reportFileName(report)}.pdf`);
  new File(uri).move(target);
  await share(target, "application/pdf", "com.adobe.pdf", report.title);
}

export async function exportReportExcel(report: MonthlyReport): Promise<void> {
  const sheet = XLSX.utils.aoa_to_sheet(buildReportRows(report));
  sheet["!cols"] = [{ wch: 34 }, { wch: 30 }, { wch: 14 }, { wch: 16 }, { wch: 22 }, { wch: 20 }];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Relevé");

  const fileName = `${reportFileName(report)}.xlsx`;
  if (Platform.OS === "web") {
    XLSX.writeFile(workbook, fileName);
    return;
  }
  const bytes: ArrayBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  const target = cacheFile(fileName);
  target.create();
  target.write(new Uint8Array(bytes));
  await share(target, XLSX_MIME, "org.openxmlformats.spreadsheetml.sheet", report.title);
}
