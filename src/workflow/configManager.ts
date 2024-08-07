import { defaultConfig } from '../config/defaultConfig';

export class ConfigManager {
  private config: any;

  constructor(customConfig?: any) {
    this.config = { ...defaultConfig, ...customConfig };
  }

  get(key: string): any {
    return this.config[key];
  }

  set(key: string, value: any): void {
    this.config[key] = value;
  }

  getAll(): any {
    return this.config;
  }
}
