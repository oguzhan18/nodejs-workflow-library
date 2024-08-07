import { WorkflowManager } from '../workflow/workflowManager';
import express, { Request, Response } from 'express';
import { WorkflowVisualizer } from './visualization';

const router = express.Router();
const workflowManager = new WorkflowManager();

router.get('/state', (req: Request, res: Response) => {
  const currentState = workflowManager.getCurrentState();
  res.json({ currentState: currentState ? currentState.name : null });
});

router.post('/transition', (req: Request, res: Response) => {
  const { to } = req.body;
  workflowManager.transitionTo(to);
  res.json({ success: true });
});

router.get('/visualize', (req: Request, res: Response) => {
  const graph = WorkflowVisualizer.generateGraph(workflowManager['states'], workflowManager['transitions']);
  res.send(`<pre>${graph}</pre>`);
});

export { router as workflowRouter };
