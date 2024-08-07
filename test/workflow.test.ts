import { WorkflowManager } from '../src/workflow/workflowManager';
import { State } from '../src/workflow/state';
import { Transition } from '../src/workflow/transition';
import { WorkflowMonitor } from '../src/workflow/monitoring';
import { Webhook } from '../src/api/webhook';
import { TestUtils } from '../src/workflow/testUtils';
import { WorkflowError, ErrorHandler } from '../src/workflow/errorHandling';
import { Plugin } from '../src/workflow/plugin';

jest.mock('../src/workflow/monitoring');
jest.mock('../src/api/webhook');
jest.mock('../src/workflow/errorHandling');

describe('WorkflowManager', () => {
  let workflowManager: WorkflowManager;

  beforeEach(() => {
    const workflowDefinition = {
      states: [
        { name: 'initial' },
        { name: 'in_progress' },
        { name: 'completed' }
      ],
      transitions: [
        { from: 'initial', to: 'in_progress', condition: 'true' },
        { from: 'in_progress', to: 'completed', condition: 'true' }
      ],
      events: [
        { name: 'taskStarted', callback: () => console.log('Task started') },
        { name: 'taskCompleted', callback: () => console.log('Task completed') }
      ]
    };
    workflowManager = new WorkflowManager(workflowDefinition, { webhookUrl: 'http://webhook.url', storageType: 'memory' });
    workflowManager.addRule('true', () => true);
  });

  test('should initialize workflow from definition', () => {
    expect(workflowManager['states'].length).toBe(3);
    expect(workflowManager['transitions'].length).toBe(2);
    expect(workflowManager['events'].length).toBe(2);
  });

  test('should add a new state', () => {
    const state = TestUtils.createMockState('review');
    workflowManager.addState(state);
    expect(workflowManager['states']).toContain(state);
  });

  test('should add a new transition', () => {
    const transition = TestUtils.createMockTransition('initial', 'review', () => true);
    workflowManager.addTransition(transition);
    expect(workflowManager['transitions']).toContain(transition);
  });

  test('should transition between states', () => {
    workflowManager.transitionTo('in_progress');
    expect(workflowManager.getCurrentState()?.name).toBe('in_progress');
  });

  test('should trigger events on transition', () => {
    const mockCallback = jest.fn();
    workflowManager.addEvent(TestUtils.createMockEvent('transitionToin_progress', mockCallback));
    workflowManager.transitionTo('in_progress');
    expect(mockCallback).toHaveBeenCalled();
  });

  test('should handle delayed transitions', done => {
    const startTime = Date.now();
    workflowManager.transitionTo('in_progress', 1000);
    setTimeout(() => {
      expect(workflowManager.getCurrentState()?.name).toBe('in_progress');
      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThanOrEqual(1000);
      done();
    }, 1100);
  });

  test('should save and load state', async () => {
    workflowManager.transitionTo('in_progress');
    await workflowManager['loadState']();
    expect(workflowManager.getCurrentState()?.name).toBe('in_progress');
  });

  test('should log state changes', () => {
    workflowManager.transitionTo('in_progress');
    expect(WorkflowMonitor.logStateChange).toHaveBeenCalledWith('initial', 'in_progress');
  });

  test('should send webhooks on state changes', () => {
    workflowManager.transitionTo('in_progress');
    expect(Webhook.send).toHaveBeenCalledWith('http://webhook.url', { from: 'initial', to: 'in_progress' });
  });

  test('should visualize workflow', () => {
    const graph = workflowManager['generateGraph']();
    expect(graph).toContain('initial');
    expect(graph).toContain('in_progress');
    expect(graph).toContain('completed');
  });

  test('should get and set version', () => {
    expect(workflowManager.getVersion()).toBe('1.0.0');
    workflowManager.setVersion('2.0.0');
    expect(workflowManager.getVersion()).toBe('2.0.0');
  });

  test('should save and load version', async () => {
    workflowManager.saveVersion('2.0.0');
    await workflowManager.loadVersion();
    expect(workflowManager.getVersion()).toBe('2.0.0');
  });

  test('should handle errors and rollback', () => {
    const faultyTransition = TestUtils.createMockTransition('in_progress', 'invalid_state', () => true);
    workflowManager.addTransition(faultyTransition);
    workflowManager.transitionTo('in_progress');
    workflowManager.transitionTo('invalid_state');
    expect(ErrorHandler.handleError).toHaveBeenCalledWith(expect.any(WorkflowError));
    expect(workflowManager.getCurrentState()?.name).toBe('in_progress');
  });

  test('should handle parallel transitions', async () => {
    const states = ['in_progress', 'completed'];
    await workflowManager.transitionToParallel(states);
    expect(workflowManager.getCurrentState()?.name).toBe('completed');
  });

  test('should add and evaluate rules', () => {
    workflowManager.addRule('testRule', () => true);
    expect(workflowManager.evaluateRule('testRule')).toBe(true);
  });

  test('should handle Redis storage', async () => {
    const workflowManagerRedis = new WorkflowManager(
      { states: [], transitions: [], events: [] },
      { storageType: 'redis', storageConfig: { uri: 'redis://localhost:6379' } }
    );
    await workflowManagerRedis['storage'].set('testKey', 'testValue');
    const value = await workflowManagerRedis['storage'].get('testKey');
    expect(value).toBe('testValue');
  });

  test('should trigger and handle custom events', () => {
    const mockCallback = jest.fn();
    workflowManager.on('customEvent', mockCallback);
    workflowManager.triggerEvent('customEvent');
    expect(mockCallback).toHaveBeenCalled();
  });

  test('should log messages at different levels', () => {
    workflowManager.log('Info message', 'info');
    workflowManager.log('Warning message', 'warn');
    workflowManager.log('Error message', 'error');
  });

  test('should add and translate keys', () => {
    workflowManager.addTranslations('es', { 'hello': 'hola' });
    workflowManager.setLocale('es');
    expect(workflowManager.translate('hello')).toBe('hola');
  });

  test('should add users and authorize roles', () => {
    workflowManager.addUser({ id: 'user1', roles: ['admin'] });
    workflowManager.authenticate('user1');
    expect(workflowManager.authorize(['admin'])).toBe(true);
  });

  test('should register and initialize plugins', () => {
    const mockPlugin: Plugin = {
      initialize: jest.fn()
    };
    workflowManager.registerPlugin(mockPlugin);
    workflowManager.initializePlugins();
    expect(mockPlugin.initialize).toHaveBeenCalledWith(workflowManager);
  });
});
