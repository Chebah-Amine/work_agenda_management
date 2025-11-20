import { LocalStorage } from "./localStorage";
import { StorageService } from "./storage";

let storage: StorageService = new LocalStorage();

export function getStorage(): StorageService {
    return storage;
}

// plus tard :
// storage = new FirebaseStorage();
