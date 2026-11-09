import { MONTH_NAMES } from "@/domain/date";
import { parseScanResponse, ScanProposal } from "@/domain/scan";
import { getAI, getGenerativeModel, GoogleAIBackend, Schema } from "firebase/ai";
import { getApp, getApps, initializeApp } from "firebase/app";

// Renseignés dans le fichier .env (voir .env.example).
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};
const MODEL = process.env.EXPO_PUBLIC_GEMINI_MODEL || "gemini-2.5-flash";

export function isScanConfigured(): boolean {
  return !!(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
}

const responseSchema = Schema.object({
  properties: {
    days: Schema.array({
      items: Schema.object({
        properties: {
          date: Schema.string({ description: "Date du jour au format YYYY-MM-DD" }),
          worked: Schema.boolean({ description: "false si le jour est noté comme non travaillé" }),
          intervals: Schema.array({
            items: Schema.object({
              properties: {
                start: Schema.string({ description: "Heure de début au format HH:MM (24 h)" }),
                end: Schema.string({ description: "Heure de fin au format HH:MM (24 h)" }),
              },
            }),
          }),
          absenceReason: Schema.enumString({ enum: ["repos", "maladie", "conge", "autre"] }),
        },
        optionalProperties: ["absenceReason"],
      }),
    }),
  },
});

function buildPrompt(year: number, month: number): string {
  return `Cette photo montre des notes manuscrites en français : les horaires de travail d'une conductrice, jour par jour.
Elle travaille en général deux fois par jour (un créneau le matin, un créneau l'après-midi).

Relève, pour chaque jour lisible, les créneaux travaillés (heure de début et heure de fin).

Règles :
- Les notes concernent ${MONTH_NAMES[month].toLowerCase()} ${year}, sauf si un autre mois ou une autre année est écrit explicitement. Donne chaque date au format YYYY-MM-DD.
- Donne les heures au format HH:MM sur 24 heures ("7h30" devient "07:30", "16h" devient "16:00").
- Un jour noté comme repos, maladie, congé ou absent : "worked": false, "intervals": [] et le motif dans "absenceReason".
- N'invente rien : si un jour ou un créneau est illisible ou incomplet, ne le renvoie pas.
- Si la photo ne contient aucun horaire, renvoie "days": [].`;
}

export type ScanImage = { base64: string; mimeType: string };

/** Envoie la photo à Gemini (via Firebase AI Logic) et renvoie les jours lus, à valider. */
export async function scanNotes(
  image: ScanImage,
  year: number,
  month: number
): Promise<ScanProposal[]> {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const ai = getAI(app, { backend: new GoogleAIBackend() });
  const model = getGenerativeModel(ai, {
    model: MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0,
    },
  });

  const result = await model.generateContent([
    buildPrompt(year, month),
    { inlineData: { data: image.base64, mimeType: image.mimeType } },
  ]);

  return parseScanResponse(JSON.parse(result.response.text()));
}
