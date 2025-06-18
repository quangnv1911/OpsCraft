import { Application } from 'express';
import authRouter from './auth.router.js';
import userRouter from './user.router.js';
import projectRouter from './project.router.js';
import pipelineRouter from './pipeline.router.js';
import integrationRouter from './integration.router.js';

const routesConfig = (app: Application): void => {
    app.use('/api/v1/auth', authRouter);
    app.use('/api/v1/users', userRouter);
    app.use('/api/v1/project', projectRouter);
    app.use('/api/v1/pipeline', pipelineRouter);
    app.use('/api/v1/integration', integrationRouter);
};

export { routesConfig };
