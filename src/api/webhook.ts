import axios from 'axios';

export class Webhook {
  static async send(url: string, payload: any): Promise<void> {
    try {
      await axios.post(url, payload);
    } catch (error) {
      console.error('Error sending webhook:', error);
    }
  }
}
