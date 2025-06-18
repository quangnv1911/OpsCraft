import { Router } from 'express';
import { rootController } from '../controllers/index';
import { asyncHandler } from '../middleware/error/error.middleware';

const router = Router();

router.get('/', asyncHandler(rootController.welcomeController));

// Health check endpoint
router.get('/health', asyncHandler(rootController.healthCheckController));

// Test error endpoint (for testing error handling)
router.get('/test-error', asyncHandler(rootController.testErrorController));

export default router;
