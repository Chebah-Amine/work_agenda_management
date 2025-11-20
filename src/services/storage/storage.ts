export interface StorageService {
    load(): Promise<any>;
    save(data: any): Promise<void>;
}
