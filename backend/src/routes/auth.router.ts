import { authService } from './../services/index.js';
import express, { Router } from 'express';
import passport from 'passport';
import { authController } from '../controllers/index.js';
import { validateBody } from '../middleware/validation/validation.middleware.js';
import { LoginGoogleSchema, LoginSchema, LogoutSchema, RegisterSchema } from '../schemas/index.js';
import { asyncHandler } from '../middleware/error/error.middleware.js';
import { requireAuth } from '../middleware/auth/auth.middleware.js';

const router: Router = express.Router();

// Get router
router.get('/me', requireAuth, asyncHandler(authController.getCurrentUser));

// Post router
router.post('/login', validateBody(LoginSchema), asyncHandler(authController.loginManual));
router.post('/refresh-token', requireAuth, asyncHandler(authController.handleRefreshToken));
router.post('/logout', validateBody(LogoutSchema), asyncHandler(authController.handleLogout));
router.post('/register', validateBody(RegisterSchema), asyncHandler(authController.register));
router.post(
    '/login-google',
    validateBody(LoginGoogleSchema),
    asyncHandler(authController.loginGoogle)
);

export default router;
