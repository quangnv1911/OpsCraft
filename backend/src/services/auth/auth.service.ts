import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { getEnvConfig } from '../../config/env/env.config.js';
import {
    AuthenticationError,
    ConfigurationError,
    ValidationError,
} from '../../middleware/error/error.middleware.js';
import { LoginResponse, OAuthUser } from './auth.service.type.js';
import { logger } from '../../utils/helpers/logger.js';
import bcrypt from 'bcrypt';
import { UserService } from '../user/user.service.js';
import { UserDto } from '../user/user.service.type.js';
import _ from 'lodash';
import { JwtService } from '../jwt/jwt.service.js';
import { JwtResponse } from '../jwt/jwt.service.type.js';

const users: OAuthUser[] = [];

export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService
    ) {}

    async handleLoginManual(
        email: string,
        password: string,
        isRememberMe: boolean
    ): Promise<JwtResponse> {
        const user = await this.userService.getUserByEmail(email);
        if (!user) {
            throw new ValidationError('User not found', [
                { field: 'email', message: 'User not found' },
            ]);
        }
        const isPasswordValid = await this.comparePassword(password, user.password);
        if (!isPasswordValid) {
            throw new ValidationError('Invalid password', [
                { field: 'password', message: 'Invalid password' },
            ]);
        }

        return await this.jwtService.generateTokens(user, isRememberMe);
    }

    public async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
        return await bcrypt.compare(password, hashedPassword);
    }

    private initializeGoogleStrategy(): boolean {
        try {
            passport.use(
                new GoogleStrategy(
                    {
                        clientID: getEnvConfig().GOOGLE_CLIENT_ID!,
                        clientSecret: getEnvConfig().GOOGLE_CLIENT_SECRET!,
                        callbackURL: '/api/auth/google/callback',
                    },
                    async (_accessToken, _refreshToken, profile: Profile, done) => {
                        try {
                            let user = users.find((u) => u.googleId === profile.id);
                            if (user) return done(null, user);

                            const newUser: OAuthUser = {
                                id: users.length + 1,
                                googleId: profile.id,
                                email: profile.emails?.[0].value || '',
                                name: profile.displayName,
                                avatar: profile.photos?.[0].value || '',
                                createdAt: new Date(),
                            };

                            users.push(newUser);
                            return done(null, newUser);
                        } catch (err) {
                            return done(err as Error, undefined);
                        }
                    }
                )
            );

            passport.serializeUser((user: any, done) => done(null, user.id));
            passport.deserializeUser((id: number, done) => {
                const user = users.find((u) => u.id === id);
                done(null, user || null);
            });

            logger.info('✅ Google OAuth strategy initialized');
            return true;
        } catch (error) {
            logger.error(
                '❌ Failed to initialize Google OAuth strategy:',
                (error as Error).message
            );
            return false;
        }
    }

    public generateToken(user: { id: number; email: string; name: string }): string {
        try {
            return jwt.sign(
                {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                },
                getEnvConfig().JWT_ACCESS_SECRET,
                { expiresIn: Number(getEnvConfig().JWT_ACCESS_EXPIRES_IN) }
            );
        } catch (error) {
            logger.error('Failed to generate JWT token', error);
            throw new ConfigurationError('Failed to generate JWT token');
        }
    }

    public authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
        const authHeader = req.headers['authorization'];
        const token = authHeader?.split(' ')[1];

        if (!token) {
            return next(new AuthenticationError('Access token required'));
        }

        jwt.verify(token, getEnvConfig().JWT_ACCESS_SECRET, (err, user) => {
            if (err) return next(new AuthenticationError('Invalid or expired token'));
            req.user = user;
            next();
        });
    };

    public getAllUsers(): Omit<OAuthUser, 'googleId'>[] {
        return users.map(({ googleId, ...rest }) => rest);
    }
}
