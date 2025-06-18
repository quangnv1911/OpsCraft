import prisma from '../lib/prisma.js';
import { Server } from 'http';
import { logger } from '../utils/helpers/logger.js';

export function handleGracefulShutdown(server: Server) {
    const shutdown = async () => {
        logger.info('👋 Shutting down...');
        server.close();
        await prisma.$disconnect();
        process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}
