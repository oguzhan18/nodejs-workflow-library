export class RuleEngine {
    private rules: { [key: string]: () => boolean } = {};
  
    addRule(name: string, rule: () => boolean): void {
      this.rules[name] = rule;
    }
  
    evaluateRule(name: string): boolean {
      const rule = this.rules[name];
      if (rule) {
        return rule();
      }
      throw new Error(`Rule ${name} not found`);
    }
  }
  