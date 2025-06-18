import { Router } from 'express';
import { asyncHandler } from '../middleware/error/error.middleware.js';
import { requireAuth } from '../middleware/auth/auth.middleware.js';
import { gitController } from '../controllers/index.js';
import { validateBody } from '../middleware/validation/validation.middleware.js';
import { AddNewGitSchema } from '../schemas/integration.schema.js';

const router = Router();

router.post(
    '/git',
    requireAuth,
    validateBody(AddNewGitSchema),
    asyncHandler(gitController.addNewGit)
);

router.get('/git', requireAuth, asyncHandler(gitController.getAllUserAccount));
export default router;
