import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import jwt from 'jsonwebtoken';
import { ConfigurationError, AuthenticationError } from './errorService.js';

// Mock user database - trong production nên sử dụng database thật
const users = [];

// Kiểm tra cấu hình Google OAuth
const validateGoogleOAuthConfig = () => {
    const clientID = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientID || !clientSecret) {
        console.warn('⚠️  Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env file');
        return false;
    }

    return true;
};

// Cấu hình Passport Google Strategy (chỉ khi có đủ config)
const initializeGoogleStrategy = () => {
    if (!validateGoogleOAuthConfig()) {
        return false;
    }

    try {
        passport.use(new GoogleStrategy({
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "/api/auth/google/callback"
        }, async (accessToken, refreshToken, profile, done) => {
            try {
                // Kiểm tra xem user đã tồn tại chưa
                let user = users.find(u => u.googleId === profile.id);

                if (user) {
                    return done(null, user);
                }

                // Tạo user mới
                const newUser = {
                    id: users.length + 1,
                    googleId: profile.id,
                    email: profile.emails[0].value,
                    name: profile.displayName,
                    avatar: profile.photos[0].value,
                    createdAt: new Date()
                };

                users.push(newUser);
                return done(null, newUser);
            } catch (error) {
                return done(error, null);
            }
        }));

        // Serialize/Deserialize user
        passport.serializeUser((user, done) => {
            done(null, user.id);
        });

        passport.deserializeUser((id, done) => {
            const user = users.find(u => u.id === id);
            done(null, user);
        });

        console.log('✅ Google OAuth strategy initialized');
        return true;
    } catch (error) {
        console.error('❌ Failed to initialize Google OAuth strategy:', error.message);
        return false;
    }
};

// Khởi tạo Google Strategy
export const isGoogleOAuthEnabled = initializeGoogleStrategy();

// Tạo JWT token
export const generateToken = (user) => {
    try {
        const secret = process.env.JWT_SECRET || 'fallback-secret-key';

        if (!process.env.JWT_SECRET) {
            console.warn('⚠️  JWT_SECRET not set, using fallback secret (not secure for production)');
        }

        return jwt.sign(
            {
                id: user.id,
                email: user.email,
                name: user.name
            },
            secret,
            { expiresIn: '7d' }
        );
    } catch (error) {
        throw new ConfigurationError('Failed to generate JWT token');
    }
};

// Middleware xác thực JWT
export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return next(new AuthenticationError('Access token required'));
    }

    const secret = process.env.JWT_SECRET || 'fallback-secret-key';

    jwt.verify(token, secret, (err, user) => {
        if (err) {
            return next(new AuthenticationError('Invalid or expired token'));
        }
        req.user = user;
        next();
    });
};

// Middleware kiểm tra Google OAuth có được cấu hình không
export const requireGoogleOAuth = (req, res, next) => {
    if (!isGoogleOAuthEnabled) {
        return next(new ConfigurationError('Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in environment variables'));
    }
    next();
};

// Lấy danh sách users (chỉ để test)
export const getAllUsers = () => {
    return users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        createdAt: user.createdAt
    }));
};

export default passport; 