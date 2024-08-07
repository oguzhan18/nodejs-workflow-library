import { MongoClient, Db } from 'mongodb';

export class MongoStorage {
  private db: Db | null = null;

  constructor(private uri: string, private dbName: string) {}

  async connect(): Promise<void> {
    const client = new MongoClient(this.uri);
    await client.connect();
    this.db = client.db(this.dbName);
  }

  async set(collection: string, key: string, value: any): Promise<void> {
    if (!this.db) throw new Error('Database not connected');
    await this.db.collection(collection).updateOne({ key }, { $set: { key, value } }, { upsert: true });
  }

  async get(collection: string, key: string): Promise<any> {
    if (!this.db) throw new Error('Database not connected');
    const result = await this.db.collection(collection).findOne({ key });
    return result ? result.value : null;
  }

  async remove(collection: string, key: string): Promise<void> {
    if (!this.db) throw new Error('Database not connected');
    await this.db.collection(collection).deleteOne({ key });
  }
}
