export class Event {
    constructor(
      public name: string,
      public callback: () => void
    ) {}
  
    trigger(): void {
      this.callback();
    }
  }
  