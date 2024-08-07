import { State } from './state';
import { Transition } from './transition';
import { Event } from './event';

export class TestUtils {
  static createMockState(name: string): State {
    return new State(name);
  }

  static createMockTransition(from: string, to: string, condition: () => boolean): Transition {
    return new Transition(from, to, condition);
  }

  static createMockEvent(name: string, callback: () => void): Event {
    return new Event(name, callback);
  }
}
