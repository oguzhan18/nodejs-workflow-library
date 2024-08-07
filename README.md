# Node.js Workflow Library

This Node.js Workflow library is designed to manage workflows, control transitions, handle events and listeners, manage
errors and rollbacks, define rules, provide extensible plugin support, and optimize performance. It is inspired by the
Laravel Workflow library.

## Features

- **States:** Represent different stages of the workflow.
- **Transitions:** Define transitions from one state to another.
- **Events and Listeners:** Events triggered at specific points in the workflow and listeners responding to those
  events.
- **Error Handling and Rollback:** Manage errors and perform rollbacks if necessary.
- **Rule Engine:** Define and evaluate rules for transitions in the workflow.
- **Monitoring and Logging:** Monitor and log the workflow.
- **Internationalization and Localization:** Support for multiple languages.
- **Advanced Security Features:** Provide user authorization and authentication.
- **Extensibility:** Extend the workflow using a plugin system.
- **Performance and Scalability:** Suitable for large-scale and high-performance applications.

## Installation

```bash
npm install nodejs-workflow
```

## Usage

### Defining a Workflow

Create a workflowService.ts file and define the workflow:

```typescript
import {WorkflowManager, State, Transition} from 'nodejs-workflow';

const workflowDefinition = {
    states: [
        {name: 'initial'},
        {name: 'in_progress'},
        {name: 'completed'}
    ],
    transitions: [
        {from: 'initial', to: 'in_progress', condition: 'canStart'},
        {from: 'in_progress', to: 'completed', condition: 'canComplete'}
    ],
    events: [
        {name: 'taskStarted', callback: () => console.log('Task started')},
        {name: 'taskCompleted', callback: () => console.log('Task completed')}
    ]
};

const workflowManager = new WorkflowManager(workflowDefinition, {storageType: 'memory'});
workflowManager.addRule('canStart', () => true);
workflowManager.addRule('canComplete', () => true);

export {workflowManager};
```

### States and Transitions

To manage states and transitions:

```typescript
workflowManager.transitionTo('in_progress');
console.log(workflowManager.getCurrentState()?.name); // 'in_progress'
```

### Triggering Events

To manage events and listeners:

```typescript
workflowManager.on('customEvent', () => console.log('Custom event triggered'));
workflowManager.triggerEvent('customEvent');
```

###Error Handling and Rollback
To handle errors and perform rollbacks:

```typescript
workflowManager.addRule('canStart', () => false);
workflowManager.transitionTo('in_progress');
console.log(workflowManager.getCurrentState()?.name);
```

### Using Translations

To support multiple languages:

```typescript
workflowManager.addTranslations('es', {'hello': 'hola'});
workflowManager.setLocale('es');
console.log(workflowManager.translate('hello')); 
```

### User Authorization

To manage user authorization and authentication:

```bash
workflowManager.addUser({ id: 'user1', roles: ['admin'] });
workflowManager.authenticate('user1');
console.log(workflowManager.authorize(['admin']));
```

### Using Plugins

To extend the workflow using a plugin system:

```typescript
const customPlugin = {
    initialize: (workflowManager) => {
        console.log('Plugin initialized');
    }
};
workflowManager.registerPlugin(customPlugin);
workflowManager.initializePlugins();
```

## API Integration and Swagger

To create an API with Express.js and document it with Swagger:

### API Controller

Create a `workflowController.ts` file:

```typescript
import {Request, Response, Router} from 'express';
import {workflowManager} from '../services/workflowService';

const router = Router();

/**
 * @swagger
 * /state:
 *   get:
 *     summary: Get current state
 *     responses:
 *       200:
 *         description: Current state
 */
router.get('/state', (req: Request, res: Response) => {
    const currentState = workflowManager.getCurrentState();
    res.json({currentState: currentState ? currentState.name : null});
});

/**
 * @swagger
 * /transition:
 *   post:
 *     summary: Transition to a new state
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               state:
 *                 type: string
 *     responses:
 *       200:
 *         description: Transition success
 */
router.post('/transition', (req: Request, res: Response) => {
    const {state} = req.body;
    try {
        workflowManager.transitionTo(state);
        res.json({success: true});
    } catch (error) {
        res.status(400).json({success: false, message: error.message});
    }
});

export {router as workflowRouter};
```

### Swagger Configuration

Create a `swagger.ts` file:

```typescript
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import {Application} from 'express';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Node.js Workflow API',
            version: '1.0.0',
            description: 'A simple API for managing workflows'
        }
    },
    apis: ['./src/controllers/*.ts']
};

const swaggerSpec = swaggerJSDoc(options);

const setupSwagger = (app: Application) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

export {setupSwagger};
```

### Main File

Create an `index.ts` file:

```typescript
import express from 'express';
import bodyParser from 'body-parser';
import {workflowRouter} from './controllers/workflowController';
import {setupSwagger} from './swagger';

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use('/api', workflowRouter);

setupSwagger(app);

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
```

### Testing

Create a `workflow.test.ts` file:

```bash
import request from 'supertest';
import express from 'express';
import bodyParser from 'body-parser';
import { workflowRouter } from '../src/controllers/workflowController';
import { setupSwagger } from '../src/swagger';

const app = express();
app.use(bodyParser.json());
app.use('/api', workflowRouter);
setupSwagger(app);

describe('Workflow API', () => {
  it('should get the current state', async () => {
    const response = await request(app)
      .get('/api/state')
      .set('Authorization', 'your-secure-token');
    expect(response.status).toBe(200);
    expect(response.body.currentState).toBe('initial');
  });

  it('should transition to a new state', async () => {
    const response = await request(app)
      .post('/api/transition')
      .send({ state: 'in_progress' })
      .set('Authorization', 'your-secure-token');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it('should return 401 for unauthorized requests', async () => {
    const response = await request(app).get('/api/state');
    expect(response.status).toBe(401);
  });
});
```

### Starting and Testing the Project

To start the project:

```bash
npm start
```

You can access the Swagger documentation at `http://localhost:3000/api-docs`.

### Summary

This library provides a comprehensive and flexible solution for managing workflows. With its wide range of features, it
can be used even in large-scale and high-performance applications. Its easy setup, flexible configuration, and powerful
features ensure a user-friendly experience.

## Example Project Structure

Here is an example of how you can structure your project to use the Node.js Workflow library:

markdown
Copy code

## Example Project Structure

Here is an example of how you can structure your project to use the Node.js Workflow library:

```bash
nodejs-workflow-example/
├── src/
│ ├── controllers/
│ │ └── workflowController.ts
│ ├── middleware/
│ │ └── authMiddleware.ts
│ ├── services/
│ │ └── workflowService.ts
│ ├── index.ts
│ └── swagger.ts
├── test/
│ └── workflow.test.ts
├── .gitignore
├── jest.config.js
├── package.json
├── tsconfig.json
└── README.md
```

### Detailed File Descriptions

1. **`src/controllers/workflowController.ts`:** Manages the API routes for workflow operations.
2. **`src/middleware/authMiddleware.ts`:** Example middleware for handling authorization.
3. **`src/services/workflowService.ts`:** Defines the workflow using the Node.js Workflow library.
4. **`src/index.ts`:** Main entry point for the Express application.
5. **`src/swagger.ts`:** Configures Swagger for API documentation.
6. **`test/workflow.test.ts`:** Contains tests for the API using Jest and Supertest.
7. **`.gitignore`:** Specifies files and directories to ignore in the version control.
8. **`jest.config.js`:** Configuration file for Jest.
9. **`package.json`:** Lists dependencies and scripts for the project.
10. **`tsconfig.json`:** TypeScript configuration file.
11. **`README.md`:** Documentation for the project.

### Additional Setup

To ensure everything is set up correctly, follow these steps:

1. **Install Dependencies:**

   ```bash
   npm install
    ```
2. **Compile TypeScript:**
```bash
npm run build 
```
3. **Run Tests:**
```bash
npm test
```
4. **Start the Server:**
```bash
npm start
```
5. **Start the Application:**
```bash
npm start
```
### Example Middleware
Here is an example of an authorization middleware you might include in `src/middleware/authMiddleware.ts`:
```typescript
import { Request, Response, NextFunction } from 'express';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization;
  if (token === 'your-secure-token') {
    next();
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
};
```
### Example API Calls
Once your application is running, you can test it using tools like Postman or curl.
**Get Current State**
```bash
curl -X GET "http://localhost:3000/api/state" -H "Authorization: your-secure-token"
```
**Transition to a New State**
```bash
curl -X POST "http://localhost:3000/api/transition" -H "Authorization: your-secure-token" -H "Content-Type: application/json" -d '{"state": "in_progress"}'
```
## Summary
This comprehensive guide provides all the necessary steps to set up and use the Node.js Workflow library effectively. By following these instructions, you can manage complex workflows in your applications with ease, leveraging features like state management, event handling, error handling, rule evaluation, and more. The integration with Express and Swagger ensures that your workflows can be exposed via a robust API with proper documentation.
