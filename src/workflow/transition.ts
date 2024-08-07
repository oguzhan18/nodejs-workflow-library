export class Transition {
    constructor(
      public from: string,
      public to: string,
      public condition: () => boolean
    ) {}
  
    canTransition(): boolean {
      return this.condition();
    }
  }
  