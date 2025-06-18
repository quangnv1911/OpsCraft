import express, { Application } from 'express';
import dotenv from 'dotenv';
import { Server } from 'http';
import { handleGracefulShutdown } from './shutdown/graceful.js';
import { registerGlobalMiddleware, registerErrorMiddleware } from './middleware/index.js';
import { routesConfig } from './routes/index.js';
import { logger } from './utils/helpers/logger.js';
import { getEnvConfig } from './config/env/env.config.js';
import { ErrnoException } from './types/index.js';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT: number = parseInt(process.env.PORT ?? '8080', 10);

// Register global middleware
registerGlobalMiddleware(app);

// Routes
routesConfig(app);

// Register error handling middleware (must be after routes)
registerErrorMiddleware(app);

// Start server with error handling
const server: Server = app.listen(PORT, () => {
    const startupMessage = `
🎉 ===============================
🚀 Server started successfully!
================================
📱 URL: http://localhost:${PORT}
🌍 Environment: ${getEnvConfig().NODE_ENV}
⏰ Started at: ${new Date().toLocaleString()}
================================
`;

    logger.info(startupMessage);
});

// Handle server errors
server.on('error', (error: ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
        logger.error(`❌ Port ${PORT} is already in use`);
        process.exit(1);
    } else {
        logger.error('❌ Server error:', error);
        process.exit(1);
    }
});

handleGracefulShutdown(server);
