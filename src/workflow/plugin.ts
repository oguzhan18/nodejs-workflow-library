import { WorkflowManager } from "./workflowManager";

export interface Plugin {
    initialize(workflowManager: WorkflowManager): void;
  }
  
  export class PluginManager {
    private plugins: Plugin[] = [];
  
    register(plugin: Plugin): void {
      this.plugins.push(plugin);
    }
  
    initializePlugins(workflowManager: WorkflowManager): void {
      this.plugins.forEach(plugin => plugin.initialize(workflowManager));
    }
  }
  