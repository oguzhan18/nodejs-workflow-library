type EventCallback = () => void;

export class EventManager {
  private events: { [eventName: string]: EventCallback[] } = {};

  on(eventName: string, callback: EventCallback): void {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
  }

  trigger(eventName: string): void {
    const eventCallbacks = this.events[eventName];
    if (eventCallbacks) {
      eventCallbacks.forEach(callback => callback());
    }
  }
}
