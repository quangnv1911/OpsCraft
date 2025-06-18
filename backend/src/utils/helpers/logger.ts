import winston, { transports } from 'winston';
import path from 'path';
import fs from 'fs-extra';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
fs.ensureDirSync(logsDir);

const logFormat = winston.format.printf((info: winston.Logform.TransformableInfo) => {
    const { timestamp, level, message, stack, ...rest } = info;
    let log = `[${timestamp}] ${level.toUpperCase()}: ${stack ?? message}`;

    if (rest.context) {
        log += `\n  Context: ${JSON.stringify(rest.context, null, 2)}`;
    }

    return log;
});

export const logger = winston.createLogger({
    level: 'debug',
    format: winston.format.combine(logFormat),
    transports: [
        new transports.Console({
            format: winston.format.combine(
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
                logFormat
            ),
        }),
        new transports.File({
            filename: path.join(logsDir, `app-${new Date().toISOString().split('T')[0]}.log`),
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
                winston.format.errors({ stack: true }),
                winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'stack'] }),
                logFormat
            ),
        }),
    ],
});
