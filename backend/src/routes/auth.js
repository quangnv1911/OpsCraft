import express from 'express';
import passport from '../services/authService.js';
import {
    generateToken,
    authenticateToken,
    getAllUsers,
    requireGoogleOAuth,
    isGoogleOAuthEnabled
} from '../services/authService.js';
import { AppError, ConfigurationError } from '../services/errorService.js';

const router = express.Router();

// Endpoint để bắt đầu quá trình đăng nhập Google
router.get('/google', requireGoogleOAuth,
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Callback endpoint sau khi Google xác thực
router.get('/google/callback', requireGoogleOAuth,
    passport.authenticate('google', { failureRedirect: '/api/auth/failure' }),
    (req, res, next) => {
        try {
            const token = generateToken(req.user);
            res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/success?token=${token}`);
        } catch (error) {
            next(error);
        }
    }
);

// Endpoint xử lý đăng nhập thất bại
router.get('/failure', (req, res) => {
    res.status(401).json({
        success: false,
        message: 'Đăng nhập thất bại',
        error: {
            type: 'AUTHENTICATION_ERROR',
            message: 'Google authentication failed'
        }
    });
});

// Endpoint đăng xuất
router.post('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(new AppError('Lỗi khi đăng xuất', 500));
        }
        res.json({
            success: true,
            message: 'Đăng xuất thành công'
        });
    });
});

// Endpoint lấy thông tin user hiện tại (cần token)
router.get('/me', authenticateToken, (req, res) => {
    res.json({
        success: true,
        user: req.user
    });
});

// Endpoint test - lấy danh sách tất cả users
router.get('/users', (req, res) => {
    res.json({
        success: true,
        users: getAllUsers()
    });
});

// Endpoint kiểm tra trạng thái đăng nhập
router.get('/status', authenticateToken, (req, res) => {
    res.json({
        success: true,
        authenticated: true,
        user: req.user
    });
});

// Route gốc - hướng dẫn sử dụng
router.get('/', (req, res) => {
    res.json({
        message: 'Authentication API',
        googleOAuthEnabled: isGoogleOAuthEnabled,
        endpoints: {
            'GET /api/auth/google': 'Bắt đầu đăng nhập với Google' + (isGoogleOAuthEnabled ? '' : ' (Chưa cấu hình)'),
            'GET /api/auth/google/callback': 'Callback sau khi đăng nhập Google',
            'POST /api/auth/logout': 'Đăng xuất',
            'GET /api/auth/me': 'Lấy thông tin user hiện tại (cần Authorization header)',
            'GET /api/auth/status': 'Kiểm tra trạng thái đăng nhập',
            'GET /api/auth/users': 'Lấy danh sách users (test only)'
        },
        configuration: {
            googleOAuth: isGoogleOAuthEnabled ? 'Configured' : 'Not configured - Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET',
            jwtSecret: process.env.JWT_SECRET ? 'Configured' : 'Using fallback (not secure)'
        }
    });
});

export default router; 