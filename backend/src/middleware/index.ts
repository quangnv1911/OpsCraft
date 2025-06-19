import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import passport from 'passport';
import { AppError, errorMiddleware, notFoundMiddleware } from './error/error.middleware.js';
import { getEnvConfig } from '../config/env/env.config.js';
import { contextMiddleware } from './context/context.middleware.js';
import { logger } from '../utils/helpers/logger.js';
import { ERROR_TYPES } from './error/error.middleware.type.js';
import archiver from 'archiver';
import fs from 'fs';
import { unwrapBody } from './unwrap-body/unwrap-body.middleware.ts.js';

/**
 * Register all middleware
 */
export const registerGlobalMiddleware = (app: Application): void => {
    // Serve static files từ thư mục public
    app.get('/download/:userId/:projectId', (req, res, next) => {
        const userId = req.params.userId;
        const projectId = req.params.projectId;
        const folderPath = path.join(process.cwd(), 'tmp', userId, projectId);
        const zipName = `${projectId}.zip`;

        if (!fs.existsSync(folderPath)) {
            throw new AppError('Folder not found', 404, ERROR_TYPES.NOT_FOUND, [
                {
                    field: 'folder',
                    message: 'Folder not found',
                },
            ]);
        }

        // Set header
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename=${zipName}`);

        const archive = archiver('zip', {
            zlib: { level: 9 },
        });

        archive.on('error', (err) => {
            logger.error('Archive error:', err);
            throw new AppError('Error creating zip', 500, ERROR_TYPES.SYSTEM, [
                {
                    field: 'zip',
                    message: 'Error creating zip',
                },
            ]);
        });

        // Nén folder và pipe thẳng vào response
        archive.directory(folderPath, false);
        archive.pipe(res);
        archive.finalize();
        next();
    });
    // Middleware handle request
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));
    app.use(
        cors({
            origin: getEnvConfig().FRONTEND_URL ?? 'http://localhost:3000',
            credentials: true,
        })
    );
    app.use(helmet());
    app.use(compression());

    // Middleware to handle log
    // Request logging middleware (development only)
    if (process.env.NODE_ENV === 'development') {
        app.use((req, res, next) => {
            logger.info(`${new Date().toISOString()} - ${req.method} ${req.url}`);
            next();
        });
    }
    app.use(morgan('dev'));
    // app.use(loggerMiddleware);

    // Trust proxy (for deployment behind reverse proxy)
    app.set('trust proxy', 1);

    // Passport middleware
    app.use(passport.initialize());

    // Middleware context (để lưu userId từ JWT v.v.)
    app.use(contextMiddleware);

    // Middleware unwrap body
    app.use(unwrapBody);
};

/**
 * Register error handling middleware (should be called after routes)
 */
export const registerErrorMiddleware = (app: Application): void => {
    // 404 handler
    app.use(notFoundMiddleware);

    // Global error handler
    app.use(errorMiddleware);
};
