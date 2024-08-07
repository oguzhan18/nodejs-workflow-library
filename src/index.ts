import { WorkflowManager } from './workflow/workflowManager';

const workflowDefinition = {
  states: [
    { name: 'initial' },
    { name: 'in_progress' },
    { name: 'completed' }
  ],
  transitions: [
    { from: 'initial', to: 'in_progress', condition: () => true },
    { from: 'in_progress', to: 'completed', condition: () => true }
  ],
  events: [
    { name: 'taskStarted', callback: () => console.log('Task started') },
    { name: 'taskCompleted', callback: () => console.log('Task completed') }
  ]
};

const workflowManager = new WorkflowManager(workflowDefinition);

export { workflowManager };
