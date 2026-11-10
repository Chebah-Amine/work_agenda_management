import { LocalStorage } from "./localStorage";
import { StorageService } from "./storage";

const storage: StorageService = new LocalStorage();

export function getStorage(): StorageService {
  return storage;
}
