# Work Agenda Management

Application mobile (Expo / React Native) de saisie d'horaires pour un travail à temps
partiel en créneaux (matin + après-midi). Elle calcule automatiquement, semaine par
semaine, les heures complémentaires et supplémentaires, et produit un relevé mensuel.

## Fonctionnalités

- **Calendrier** : toucher un jour pour saisir ses créneaux (heures réglées par boutons,
  journée habituelle proposée d'office), déclarer une absence ou effacer la saisie.
  « Remplir plusieurs jours d'un coup » applique la même saisie à une période (jours
  habituellement travaillés, hors fériés).
- **Photo** : photographier les notes papier ; les horaires lus par Gemini sont proposés
  jour par jour, à cocher / corriger avant enregistrement.
- **Rapport** : relevé du mois en PDF ou Excel (tableau jour par jour + heures
  complémentaires par semaine).
- **Réglages** : nom, heures hebdomadaires du contrat, jours travaillés, journée habituelle.

## Règles de calcul

- Semaine civile du lundi au dimanche. Seules les heures saisies comme travaillées comptent.
- Heures complémentaires = heures de la semaine au-delà du contrat (20 h par défaut) :
  +10 % jusqu'à 1/10 du contrat, +25 % au-delà.
- Heures supplémentaires = au-delà de 35 h dans la semaine.
- Une semaine à cheval sur deux mois est comptée dans le mois où elle se termine.

Le calcul est dans `src/domain/overtime.ts`.

## Démarrer

```bash
npm install
npx expo start
```

## Configurer la lecture des photos (Firebase AI Logic / Gemini)

1. Créer un projet sur la [console Firebase](https://console.firebase.google.com) et y
   ajouter une application **Web**.
2. Dans le menu **AI Logic**, activer l'API **Gemini Developer API**.
3. Copier `.env.example` en `.env` et y reporter `apiKey`, `projectId` et `appId`.
4. Relancer `npx expo start`.

Sans ces clés, le reste de l'application fonctionne ; seul l'onglet Photo est désactivé.

## Vérifications

```bash
npm test
npm run typecheck
npm run lint
```

## Organisation du code

- `app/` : routes (onglets) Expo Router.
- `src/domain/` : logique pure et testée (dates, durées, heures complémentaires, rapport,
  lecture de la réponse du scan).
- `src/features/` : écrans (calendrier, photo, rapport, réglages).
- `src/services/` : stockage local, export PDF/Excel, appel Gemini.
- `src/state/` : source unique des données partagée par les écrans.
- `src/ui/` : composants communs.
