import { NextFunction, Request, Response } from 'express';
import { getCurrentUser } from '../../lib/context/context.js';
import { asyncHandler, AuthenticationError } from '../error/error.middleware.js';
import { logger } from '../../utils/helpers/logger.js';

export const requireAuth = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = getCurrentUser();
    logger.info(`userId: ${userId}`);
    if (!userId) {
        throw new AuthenticationError('Authentication required', [
            {
                field: 'token',
                message: 'Authentication required',
            },
        ]);
    }
    next();
});
