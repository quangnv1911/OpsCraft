import { Request, Response, NextFunction } from 'express'; // Update path as needed
import { getEnvConfig } from '../../config/env/env.config.js';
import {
    AuthenticationError,
    NotFoundError,
    ValidationError,
} from '../../middleware/error/error.middleware.js';

export class RootController {
    public welcomeController = async (req: Request, res: Response): Promise<Response> => {
        return res.json({
            message: 'Chào mừng bạn đến với Node.js Express API!',
            status: 'success',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            environment: getEnvConfig().NODE_ENV || 'development',
            endpoints: {
                auth: '/api/auth',
                users: '/api/users',
                products: '/api/products',
                test: '/api/test',
                ci: '/api/ci',
            },
            documentation: {
                health: '/health',
                errorTest: '/test-error',
            },
        });
    };

    public healthCheckController = async (req: Request, res: Response): Promise<Response> => {
        return res.json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            environment: process.env.NODE_ENV || 'development',
            nodeVersion: process.version,
        });
    };

    public testErrorController = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        const type = req.query.type || 'general';

        switch (type) {
            case 'validation':
                return next(new ValidationError('Test validation error'));
            case 'auth':
                return next(new AuthenticationError('Test authentication error'));
            case 'not-found':
                return next(new NotFoundError('Test resource'));
            case 'async':
                // Test unhandled promise rejection
                return Promise.reject(new Error('Test async error'));
            case 'sync':
                // Test uncaught exception
                return process.nextTick(() => {
                    throw new Error('Test sync error');
                });
            default:
                return next(new Error('Test general error'));
        }
    };
}
