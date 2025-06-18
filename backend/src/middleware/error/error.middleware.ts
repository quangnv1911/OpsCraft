import { Request, Response, NextFunction } from 'express';
import { ERROR_TYPES, ErrorType, RequestContext } from './error.middleware.type.js';
import { logger } from '../../utils/helpers/logger.js';
import { sendError } from '../../utils/helpers/response.helper.js';
import { sanitizeBody } from '../../utils/helpers/sanitizeBody .js';

// ----------- Custom Errors -----------

export class AppError extends Error {
    statusCode: number;
    errorType: ErrorType;
    isOperational: boolean;
    timestamp: string;
    fields: Array<{ field: string; message: string }> = [];

    constructor(
        message: string,
        statusCode = 500,
        errorType: ErrorType = ERROR_TYPES.SYSTEM,
        fields: Array<{ field: string; message: string }>
    ) {
        super(message);
        this.statusCode = statusCode;
        this.errorType = errorType;
        this.isOperational = true;
        this.timestamp = new Date().toISOString();
        this.fields = fields;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends AppError {
    constructor(message: string, fields: Array<{ field: string; message: string }> = []) {
        super(message, 400, ERROR_TYPES.VALIDATION, fields);
        this.fields = fields;
    }
}

export class AuthenticationError extends AppError {
    constructor(
        message = 'Authentication failed',
        fields: Array<{ field: string; message: string }> = []
    ) {
        super(message, 401, ERROR_TYPES.AUTHENTICATION, fields);
    }
}

export class AuthorizationError extends AppError {
    constructor(message = 'Access denied', fields: Array<{ field: string; message: string }> = []) {
        super(message, 403, ERROR_TYPES.AUTHORIZATION, fields);
    }
}

export class NotFoundError extends AppError {
    constructor(resource = 'Resource', fields: Array<{ field: string; message: string }> = []) {
        super(`${resource} not found`, 404, ERROR_TYPES.NOT_FOUND, fields);
    }
}

export class DatabaseError extends AppError {
    originalError: unknown;

    constructor(
        message = 'Database operation failed',
        originalError: unknown = null,
        fields: Array<{ field: string; message: string }> = []
    ) {
        super(message, 500, ERROR_TYPES.DATABASE, fields);
        this.originalError = originalError;
    }
}

export class ConfigurationError extends AppError {
    constructor(
        message = 'Configuration error',
        fields: Array<{ field: string; message: string }> = []
    ) {
        super(message, 500, ERROR_TYPES.CONFIGURATION, fields);
    }
}

// ----------- Express Middlewares -----------

export const errorMiddleware = (error: any, req: Request, res: Response, next: NextFunction): void => {
    const context: RequestContext = {
        url: req.originalUrl,
        method: req.method,
        ip: req.ip ?? '',
        userAgent: req.get('User-Agent') ?? '',
        userId: (req as any).user?.id,
        body: sanitizeBody(req.body),
        params: req.params,
        query: req.query,
    };
    logger.error(error.message, { context });
    const errorFields: Record<string, any> = error?.fields ?? [];

    sendError(res, errorFields, error.message, error.statusCode);
};

export const notFoundMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    const error = new NotFoundError(`Route ${req.originalUrl}`);
    next(error);
};

export const asyncHandler = (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
