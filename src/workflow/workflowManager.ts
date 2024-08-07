import { State } from './state';
import { Transition } from './transition';
import { Event } from './event';
import { MemoryStorage } from './storage/MemoryStorage';
import { MongoStorage } from './storage/MongoStorage';
import { RedisStorage } from './storage/RedisStorage';
import { WorkflowMonitor } from './monitoring';
import { Webhook } from '../api/webhook';
import { ConfigManager } from './configManager';
import { WorkflowError, ErrorHandler } from './errorHandling';
import { RuleEngine } from './ruleEngine';
import { EventManager } from './eventManager';
import { Logger } from './logger';
import { Translator } from '../i18n/translator';
import { AuthManager } from '../security/authManager';
import { Plugin, PluginManager } from './plugin';
import { PerformanceOptimizer } from './performance';

export class WorkflowManager {
  transitionToParallel(states: string[]) {
    throw new Error('Method not implemented.');
  }
  private states: State[] = [];
  private transitions: Transition[] = [];
  private events: Event[] = [];
  private currentState: State | null = null;
  private storage: any;
  private timers: { [key: string]: NodeJS.Timeout } = {};
  private config: ConfigManager;
  private previousState: State | null = null;
  private ruleEngine: RuleEngine;
  private eventManager: EventManager;
  private logger: Logger;
  private translator: Translator;
  private authManager: AuthManager;
  private pluginManager: PluginManager;

  constructor(workflowDefinition?: any, customConfig?: any) {
    this.config = new ConfigManager(customConfig);
    const storageType = this.config.get('storageType');
    const webhookUrl = this.config.get('webhookUrl');
    const logLevel = this.config.get('logLevel') || 'info';
    const defaultLocale = this.config.get('defaultLocale') || 'en';

    if (storageType === 'memory') {
      this.storage = new MemoryStorage();
    } else if (storageType === 'mongo') {
      const storageConfig = this.config.get('storageConfig');
      this.storage = new MongoStorage(storageConfig.uri, storageConfig.dbName);
      this.storage.connect();
    } else if (storageType === 'redis') {
      const storageConfig = this.config.get('storageConfig');
      this.storage = new RedisStorage(storageConfig.uri);
    }

    if (workflowDefinition) {
      this.initializeWorkflow(workflowDefinition);
    }

    if (webhookUrl) {
      this.config.set('webhookUrl', webhookUrl);
    }

    this.ruleEngine = new RuleEngine();
    this.eventManager = new EventManager();
    this.logger = new Logger(logLevel);
    this.translator = new Translator(defaultLocale);
    this.authManager = new AuthManager();
    this.pluginManager = new PluginManager();

    PerformanceOptimizer.optimizeStorageAccess();
    PerformanceOptimizer.optimizeEventHandling();
    PerformanceOptimizer.optimizeStateTransitions();
  }

  private initializeWorkflow(definition: any): void {
    definition.states.forEach((state: any) => this.addState(new State(state.name)));
    definition.transitions.forEach((transition: any) => this.addTransition(new Transition(
      transition.from, 
      transition.to, 
      () => this.ruleEngine.evaluateRule(transition.condition)
    )));
    definition.events.forEach((event: any) => this.addEvent(new Event(
      event.name, 
      event.callback
    )));
  }

  addState(state: State): void {
    this.states.push(state);
    if (!this.currentState) {
      this.currentState = state;
      state.isActive = true;
      this.saveState(state.name);
    }
  }

  addTransition(transition: Transition): void {
    this.transitions.push(transition);
  }

  addEvent(event: Event): void {
    this.events.push(event);
  }

  on(eventName: string, callback: () => void): void {
    this.eventManager.on(eventName, callback);
  }

  triggerEvent(eventName: string): void {
    this.eventManager.trigger(eventName);
    WorkflowMonitor.logEventTrigger(eventName);
    const webhookUrl = this.config.get('webhookUrl');
    if (webhookUrl) {
      Webhook.send(webhookUrl, { event: eventName });
    }
  }

  async transitionTo(stateName: string, delay: number = 0): Promise<void> {
    try {
      const transition = this.transitions.find(
        transition => transition.from === this.currentState?.name && transition.to === stateName
      );

      if (transition && transition.canTransition()) {
        const oldStateName = this.currentState ? this.currentState.name : 'none';
        if (this.currentState) {
          this.currentState.isActive = false;
        }

        if (delay > 0) {
          this.setTimer(stateName, delay);
        } else {
          const newState = this.states.find(state => state.name === stateName);
          if (newState) {
            this.previousState = this.currentState;
            newState.isActive = true;
            this.currentState = newState;
            this.saveState(newState.name);
          }

          WorkflowMonitor.logStateChange(oldStateName, stateName);
          const webhookUrl = this.config.get('webhookUrl');
          if (webhookUrl) {
            Webhook.send(webhookUrl, { from: oldStateName, to: stateName });
          }

          this.triggerEvent(`transitionTo${stateName}`);
        }
      } else {
        throw new WorkflowError(`Cannot transition to state: ${stateName}`);
      }
    } catch (error) {
      ErrorHandler.handleError(error as WorkflowError);
      this.rollback();
    }
  }

  getCurrentState(): State | null {
    return this.currentState;
  }

  rollback(): void {
    if (this.previousState) {
      this.currentState!.isActive = false;
      this.currentState = this.previousState;
      this.currentState.isActive = true;
      this.previousState = null;
      WorkflowMonitor.logStateChange('rollback', this.currentState.name);
    } else {
      throw new WorkflowError('No previous state to rollback to');
    }
  }

  private saveState(stateName: string): void {
    if (this.storage instanceof MemoryStorage) {
      this.storage.set('currentState', stateName);
    } else if (this.storage instanceof MongoStorage) {
      this.storage.set('workflow', 'currentState', stateName);
    } else if (this.storage instanceof RedisStorage) {
      this.storage.set('currentState', stateName);
    }
  }

  private async loadState(): Promise<void> {
    let stateName: string | null = null;
    if (this.storage instanceof MemoryStorage) {
      stateName = this.storage.get('currentState');
    } else if (this.storage instanceof MongoStorage) {
      stateName = await this.storage.get('workflow', 'currentState');
    } else if (this.storage instanceof RedisStorage) {
      stateName = await this.storage.get('currentState');
    }
    if (stateName) {
      const state = this.states.find(state => state.name === stateName);
      if (state) {
        state.isActive = true;
        this.currentState = state;
      }
    }
  }

  private setTimer(stateName: string, delay: number): void {
    const timer = setTimeout(() => {
      const newState = this.states.find(state => state.name === stateName);
      if (newState) {
        newState.isActive = true;
        this.currentState = newState;
        this.saveState(newState.name);
        WorkflowMonitor.logStateChange('timed transition', stateName);
        const webhookUrl = this.config.get('webhookUrl');
        if (webhookUrl) {
          Webhook.send(webhookUrl, { from: 'timed transition', to: stateName });
        }
        this.triggerEvent(`transitionTo${stateName}`);
      }
    }, delay);

    this.timers[stateName] = timer;
  }

  clearTimer(stateName: string): void {
    if (this.timers[stateName]) {
      clearTimeout(this.timers[stateName]);
      delete this.timers[stateName];
    }
  }

  getVersion(): string {
    return this.config.get('version');
  }

  setVersion(version: string): void {
    this.config.set('version', version);
  }

  saveVersion(version: string): void {
    this.setVersion(version);
    if (this.storage instanceof MemoryStorage) {
      this.storage.set('version', version);
    } else if (this.storage instanceof MongoStorage) {
      this.storage.set('workflow', 'version', version);
    } else if (this.storage instanceof RedisStorage) {
      this.storage.set('version', version);
    }
  }

  async loadVersion(): Promise<void> {
    let version: string | null = null;
    if (this.storage instanceof MemoryStorage) {
      version = this.storage.get('version');
    } else if (this.storage instanceof MongoStorage) {
      version = await this.storage.get('workflow', 'version');
    } else if (this.storage instanceof RedisStorage) {
      version = await this.storage.get('version');
    }
    if (version) {
      this.setVersion(version);
    }
  }

  addRule(name: string, rule: () => boolean): void {
    this.ruleEngine.addRule(name, rule);
  }

  evaluateRule(name: string): boolean {
    return this.ruleEngine.evaluateRule(name);
  }

  log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    this.logger.log(message, level);
  }

  addTranslations(locale: string, translations: { [key: string]: string }): void {
    this.translator.addTranslations(locale, translations);
  }

  translate(key: string): string {
    return this.translator.translate(key);
  }

  setLocale(locale: string): void {
    this.translator.setLocale(locale);
  }

  addUser(user: { id: string, roles: string[] }): void {
    this.authManager.addUser(user);
  }

  authenticate(userId: string): void {
    this.authManager.authenticate(userId);
  }

  authorize(roles: string[]): boolean {
    return this.authManager.authorize(roles);
  }

  registerPlugin(plugin: Plugin): void {
    this.pluginManager.register(plugin);
  }

  initializePlugins(): void {
    this.pluginManager.initializePlugins(this);
  }
}
