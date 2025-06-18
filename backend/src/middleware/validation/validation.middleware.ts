import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ValidationError } from '../error/error.middleware.js';

// Generic validation middleware factory
export const validateBody = <T>(schema: ZodSchema<T>) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            const result = schema.safeParse(req.body);

            if (!result.success) {
                const fields = result.error.errors.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));
                throw new ValidationError('Validation failed', fields);
            }

            req.body = result.data;
            next();
        } catch (error) {
            next(error);
        }
    };
};

export const validateParams = <T>(schema: ZodSchema<T>) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            const result = schema.safeParse(req.params);

            if (!result.success) {
                const fields = result.error.errors.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));
                throw new ValidationError('Parameter validation failed', fields);
            }

            req.params = result.data as Record<string, string>;
            next();
        } catch (error) {
            next(error);
        }
    };
};

export const validateQuery = <T>(schema: ZodSchema<T>) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            const result = schema.safeParse(req.query);

            if (!result.success) {
                const fields = result.error.errors.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));
                throw new ValidationError('Query validation failed', fields);
            }

            req.query = result.data as Record<string, string | string[]>;
            next();
        } catch (error) {
            next(error);
        }
    };
};
