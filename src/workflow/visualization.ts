import { State } from './state';
import { Transition } from './transition';

export class WorkflowVisualizer {
  static generateGraph(states: State[], transitions: Transition[]): string {
    let graph = 'digraph Workflow {\n';

    states.forEach(state => {
      graph += `  ${state.name} [shape=ellipse];\n`;
    });

    transitions.forEach(transition => {
      graph += `  ${transition.from} -> ${transition.to} [label="${transition.condition.toString()}"];\n`;
    });

    graph += '}';

    return graph;
  }
}
