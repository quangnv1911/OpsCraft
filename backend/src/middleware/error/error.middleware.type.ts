// ----------- Types -----------

export const ERROR_TYPES = {
    VALIDATION: 'VALIDATION_ERROR',
    AUTHENTICATION: 'AUTHENTICATION_ERROR',
    AUTHORIZATION: 'AUTHORIZATION_ERROR',
    NOT_FOUND: 'NOT_FOUND_ERROR',
    DATABASE: 'DATABASE_ERROR',
    EXTERNAL_API: 'EXTERNAL_API_ERROR',
    CONFIGURATION: 'CONFIGURATION_ERROR',
    SYSTEM: 'SYSTEM_ERROR',
    BUSINESS_LOGIC: 'BUSINESS_LOGIC_ERROR',
    RATE_LIMIT: 'RATE_LIMIT_ERROR',
    UNSUPPORTED: 'UNSUPPORTED_ERROR',
} as const;

export type ErrorType = (typeof ERROR_TYPES)[keyof typeof ERROR_TYPES];

export interface RequestContext {
    url: string;
    method: string;
    ip: string;
    userAgent?: string;
    userId?: string;
    body?: Record<string, any>;
    params?: Record<string, any>;
    query?: Record<string, any>;
}

export type AsyncHandlerType = (req: Request, res: Response, next: any) => Promise<void>;
