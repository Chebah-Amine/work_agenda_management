export interface StorageService {
  /** Données brutes telles qu'enregistrées (à normaliser par l'appelant). */
  load(): Promise<unknown>;
  save(data: unknown): Promise<void>;
}
