export class Logger {
    private logLevel: 'info' | 'warn' | 'error';
  
    constructor(logLevel: 'info' | 'warn' | 'error' = 'info') {
      this.logLevel = logLevel;
    }
  
    log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
      if (this.shouldLog(level)) {
        console.log(`[${level.toUpperCase()}] ${message}`);
      }
    }
  
    private shouldLog(level: 'info' | 'warn' | 'error'): boolean {
      const levels = ['info', 'warn', 'error'];
      return levels.indexOf(level) >= levels.indexOf(this.logLevel);
    }
  }
  