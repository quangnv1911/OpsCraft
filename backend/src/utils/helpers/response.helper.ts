import { ApiResponse } from '../../types';

export const sendSuccess = <T>(res: any, data: T, message = 'Success', statusCode = 200): any => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    } as ApiResponse<T>);
};

export const sendError = (
    res: any,
    error: any,
    message = 'Something went wrong',
    statusCode = 500
): any => {
    return res.status(statusCode).json({
        success: false,
        message,
        error,
        timestamp: new Date().toISOString(),
    } as ApiResponse);
};
