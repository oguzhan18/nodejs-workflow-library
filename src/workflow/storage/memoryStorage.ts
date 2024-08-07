export class MemoryStorage {
    private storage: { [key: string]: any } = {};
  
    set(key: string, value: any): void {
      this.storage[key] = value;
    }
  
    get(key: string): any {
      return this.storage[key];
    }
  
    remove(key: string): void {
      delete this.storage[key];
    }
  }
  