import { Router } from 'express';
import { projectController } from '../controllers/index.js';
import { asyncHandler } from '../middleware/error/error.middleware.js';
import { validateBody } from '../middleware/validation/validation.middleware.js';
import { AnalyzeProjectSchema } from '../schemas/project.schema.js';
import { requireAuth } from '../middleware/auth/auth.middleware.js';
const router = Router();

router.use(requireAuth);
router.post(
    '/analyze',
    validateBody(AnalyzeProjectSchema),
    asyncHandler(projectController.analyzeProject)
);

export default router;
