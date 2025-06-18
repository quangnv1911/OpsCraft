/*
    Sanitize body to remove sensitive fields
*/

export const sanitizeBody = (body: any): any => {
    const sensitiveFields = ['password', 'token', 'accessToken', 'refreshToken'];

    if (!body || typeof body !== 'object') return body;

    const sanitized = { ...body };
    for (const field of sensitiveFields) {
        if (field in sanitized) {
            sanitized[field] = '[REDACTED]';
        }
    }

    return sanitized;
};
