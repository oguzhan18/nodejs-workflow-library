import { createClient, RedisClientType } from 'redis';

export class RedisStorage {
  private client: RedisClientType;

  constructor(private uri: string) {
    this.client = createClient({ url: this.uri });
    this.client.connect();
  }

  async set(key: string, value: any): Promise<void> {
    await this.client.set(key, JSON.stringify(value));
  }

  async get(key: string): Promise<any> {
    const result = await this.client.get(key);
    return result ? JSON.parse(result) : null;
  }

  async remove(key: string): Promise<void> {
    await this.client.del(key);
  }
}
