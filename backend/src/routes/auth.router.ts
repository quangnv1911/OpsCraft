import { authService } from './../services/index.js';
import express, { Router } from 'express';
import passport from 'passport';
import { authController } from '../controllers/index.js';
import { validateBody } from '../middleware/validation/validation.middleware.js';
import { LoginSchema, LogoutSchema, RegisterSchema } from '../schemas/index.js';
import { asyncHandler } from '../middleware/error/error.middleware.js';
import { requireAuth } from '../middleware/auth/auth.middleware.js';

const router: Router = express.Router();

// Get router
router.get('/me', requireAuth, asyncHandler(authController.getCurrentUser));
router.get('/failure', asyncHandler(authController.handleAuthFailure));
router.get(
    '/google/callback',
    passport.authenticate('google', { failureRedirect: '/api/auth/failure' }),
    asyncHandler(authController.handleGoogleCallback)
);

// Post router
router.post('/login', validateBody(LoginSchema), asyncHandler(authController.loginManual));
router.post('/refresh-token', requireAuth, asyncHandler(authController.handleRefreshToken));
router.post('/logout', validateBody(LogoutSchema), asyncHandler(authController.handleLogout));
router.post('/register', validateBody(RegisterSchema), asyncHandler(authController.register));

export default router;
