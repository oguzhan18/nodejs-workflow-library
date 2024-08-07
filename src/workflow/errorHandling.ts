export class WorkflowError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'WorkflowError';
    }
  }
  
  export class ErrorHandler {
    static handleError(error: WorkflowError): void {
      console.error(`[WorkflowError] ${error.message}`);
    }
  }
  