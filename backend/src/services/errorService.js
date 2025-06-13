import fs from 'fs-extra';
import path from 'path';

// Error Types Classification
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
    RATE_LIMIT: 'RATE_LIMIT_ERROR'
};

// Error Severity Levels
export const ERROR_SEVERITY = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL'
};

// Custom Error Classes
export class AppError extends Error {
    constructor(message, statusCode, errorType = ERROR_TYPES.SYSTEM, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.errorType = errorType;
        this.isOperational = isOperational;
        this.timestamp = new Date().toISOString();
        this.severity = this.determineSeverity(statusCode);

        Error.captureStackTrace(this, this.constructor);
    }

    determineSeverity(statusCode) {
        if (statusCode >= 500) return ERROR_SEVERITY.CRITICAL;
        if (statusCode >= 400) return ERROR_SEVERITY.MEDIUM;
        return ERROR_SEVERITY.LOW;
    }
}

export class ValidationError extends AppError {
    constructor(message, fields = []) {
        super(message, 400, ERROR_TYPES.VALIDATION);
        this.fields = fields;
    }
}

export class AuthenticationError extends AppError {
    constructor(message = 'Authentication failed') {
        super(message, 401, ERROR_TYPES.AUTHENTICATION);
    }
}

export class AuthorizationError extends AppError {
    constructor(message = 'Access denied') {
        super(message, 403, ERROR_TYPES.AUTHORIZATION);
    }
}

export class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404, ERROR_TYPES.NOT_FOUND);
    }
}

export class DatabaseError extends AppError {
    constructor(message = 'Database operation failed') {
        super(message, 500, ERROR_TYPES.DATABASE);
    }
}

export class ConfigurationError extends AppError {
    constructor(message = 'Configuration error') {
        super(message, 500, ERROR_TYPES.CONFIGURATION);
    }
}

// Error Logger
class ErrorLogger {
    constructor() {
        this.logsDir = './logs';
        this.ensureLogsDirectory();
    }

    async ensureLogsDirectory() {
        try {
            await fs.ensureDir(this.logsDir);
        } catch (error) {
            console.error('Failed to create logs directory:', error);
        }
    }

    async logError(error, context = {}) {
        const errorLog = {
            timestamp: new Date().toISOString(),
            message: error.message,
            stack: error.stack,
            statusCode: error.statusCode || 500,
            errorType: error.errorType || ERROR_TYPES.SYSTEM,
            severity: error.severity || ERROR_SEVERITY.MEDIUM,
            isOperational: error.isOperational || false,
            context,
            environment: process.env.NODE_ENV || 'development',
            nodeVersion: process.version,
            platform: process.platform
        };

        // Log to console với colors
        this.logToConsole(errorLog);

        // Log to file
        await this.logToFile(errorLog);

        // Log to external service (in production)
        if (process.env.NODE_ENV === 'production') {
            await this.logToExternalService(errorLog);
        }
    }

    logToConsole(errorLog) {
        const colors = {
            red: '\x1b[31m',
            yellow: '\x1b[33m',
            blue: '\x1b[34m',
            green: '\x1b[32m',
            reset: '\x1b[0m',
            bright: '\x1b[1m'
        };

        const severityColor = {
            [ERROR_SEVERITY.LOW]: colors.green,
            [ERROR_SEVERITY.MEDIUM]: colors.yellow,
            [ERROR_SEVERITY.HIGH]: colors.blue,
            [ERROR_SEVERITY.CRITICAL]: colors.red
        };

        const color = severityColor[errorLog.severity] || colors.red;

        console.log(`\n${colors.bright}${color}🚨 ERROR DETECTED 🚨${colors.reset}`);
        console.log(`${color}┌─────────────────────────────────────${colors.reset}`);
        console.log(`${color}│ Time: ${errorLog.timestamp}${colors.reset}`);
        console.log(`${color}│ Type: ${errorLog.errorType}${colors.reset}`);
        console.log(`${color}│ Severity: ${errorLog.severity}${colors.reset}`);
        console.log(`${color}│ Status: ${errorLog.statusCode}${colors.reset}`);
        console.log(`${color}│ Message: ${errorLog.message}${colors.reset}`);
        console.log(`${color}└─────────────────────────────────────${colors.reset}`);

        if (errorLog.context && Object.keys(errorLog.context).length > 0) {
            console.log(`${colors.yellow}Context:${colors.reset}`, errorLog.context);
        }

        if (process.env.NODE_ENV === 'development') {
            console.log(`${colors.blue}Stack trace:${colors.reset}`);
            console.log(errorLog.stack);
        }
        console.log('\n');
    }

    async logToFile(errorLog) {
        try {
            const date = new Date().toISOString().split('T')[0];
            const logFile = path.join(this.logsDir, `error-${date}.log`);

            await fs.appendFile(logFile, JSON.stringify(errorLog) + '\n');
        } catch (error) {
            console.error('Failed to write error log to file:', error);
        }
    }

    async logToExternalService(errorLog) {
        // Placeholder for external logging service (Sentry, LogRocket, etc.)
        // In production, implement integration with your preferred service
        try {
            // Example: await sentry.captureException(errorLog);
            console.log('📤 Error logged to external service');
        } catch (error) {
            console.error('Failed to log to external service:', error);
        }
    }
}

// Error Service
class ErrorService {
    constructor() {
        this.logger = new ErrorLogger();
        this.setupGlobalHandlers();
    }

    setupGlobalHandlers() {
        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            console.error('💥 UNCAUGHT EXCEPTION! Shutting down...');
            this.handleCriticalError(error, 'uncaughtException');
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            console.error('💥 UNHANDLED REJECTION! Shutting down...');
            const error = new Error(`Unhandled promise rejection: ${reason}`);
            this.handleCriticalError(error, 'unhandledRejection', { promise });
        });

        // Handle SIGTERM
        process.on('SIGTERM', () => {
            console.log('👋 SIGTERM received. Graceful shutdown...');
            this.gracefulShutdown();
        });

        // Handle SIGINT (Ctrl+C)
        process.on('SIGINT', () => {
            console.log('👋 SIGINT received. Graceful shutdown...');
            this.gracefulShutdown();
        });
    }

    async handleError(error, context = {}) {
        try {
            await this.logger.logError(error, context);

            // Send notifications for critical errors
            if (error.severity === ERROR_SEVERITY.CRITICAL) {
                await this.sendNotification(error, context);
            }
        } catch (loggingError) {
            console.error('Failed to handle error:', loggingError);
        }
    }

    async handleCriticalError(error, source, context = {}) {
        try {
            const criticalError = new AppError(
                error.message,
                500,
                ERROR_TYPES.SYSTEM,
                false
            );
            criticalError.severity = ERROR_SEVERITY.CRITICAL;

            await this.handleError(criticalError, { source, ...context });

            // Force exit after logging
            setTimeout(() => {
                process.exit(1);
            }, 1000);
        } catch (err) {
            console.error('Failed to handle critical error:', err);
            process.exit(1);
        }
    }

    async sendNotification(error, context) {
        // Implement notification logic (email, Slack, SMS, etc.)
        try {
            console.log('🔔 Sending critical error notification...');
            // Example: await this.sendSlackNotification(error, context);
        } catch (notificationError) {
            console.error('Failed to send notification:', notificationError);
        }
    }

    gracefulShutdown() {
        console.log('🔄 Starting graceful shutdown...');

        // Close database connections
        // Close server
        // Clean up resources

        setTimeout(() => {
            console.log('✅ Graceful shutdown completed');
            process.exit(0);
        }, 5000);
    }

    // Express error middleware
    expressErrorHandler() {
        return (error, req, res, next) => {
            // Add request context
            const context = {
                url: req.url,
                method: req.method,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                userId: req.user?.id,
                body: req.body,
                params: req.params,
                query: req.query
            };

            // Handle the error
            this.handleError(error, context);

            // Determine if error is operational
            const isOperationalError = error.isOperational || error instanceof AppError;

            // Send response
            if (isOperationalError) {
                res.status(error.statusCode || 500).json({
                    success: false,
                    error: {
                        type: error.errorType || ERROR_TYPES.SYSTEM,
                        message: error.message,
                        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
                    }
                });
            } else {
                // Don't leak error details for non-operational errors
                res.status(500).json({
                    success: false,
                    error: {
                        type: ERROR_TYPES.SYSTEM,
                        message: 'Internal server error'
                    }
                });
            }
        };
    }

    // 404 handler
    notFoundHandler() {
        return (req, res, next) => {
            const error = new NotFoundError(`Route ${req.originalUrl}`);
            next(error);
        };
    }
}

// Export singleton instance
export const errorService = new ErrorService();
