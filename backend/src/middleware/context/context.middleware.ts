// middlewares/context.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { context } from '../../lib/context/context.js';
import { logger } from '../../utils/helpers/logger.js';
import { jwtService } from '../../services/index.js';

export const contextMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];
    let userId = '';
    let email = '';

    if (token) {
        try {
            const { id, email: decodedEmail } = jwtService.verifyAccessToken(token);
            userId = id ?? '';
            email = decodedEmail ?? '';
        } catch (error) {
            logger.warn('Invalid token:', error);
        }
    }

    context.run({ userId, email }, () => {
        next();
    });
};
