export class WorkflowMonitor {
    static log(message: string): void {
      console.log(`[WorkflowMonitor] ${message}`);
    }
  
    static logStateChange(oldState: string, newState: string): void {
      this.log(`State changed from ${oldState} to ${newState}`);
    }
  
    static logEventTrigger(eventName: string): void {
      this.log(`Event triggered: ${eventName}`);
    }
  }
  