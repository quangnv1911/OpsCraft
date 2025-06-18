import { Router } from 'express';
import { pipelineController } from '../controllers/index.js';
import { asyncHandler } from '../middleware/error/error.middleware.js';

const router = Router();

router.post('/generate', asyncHandler(pipelineController.generatePipelineController));
router.post('/validate', asyncHandler(pipelineController.validatePipelineController));
router.post('/create', asyncHandler(pipelineController.createPipelineController));
router.post('/check', asyncHandler(pipelineController.checkExistPipelineController));
router.get('/example', asyncHandler(pipelineController.examplePipelineController));

export default router;
