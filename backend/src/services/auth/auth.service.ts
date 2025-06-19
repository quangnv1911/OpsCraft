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
import { OAuth2Client } from 'google-auth-library';

const users: OAuthUser[] = [];

export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService
    ) {}

    handleLoginManual = async (
        email: string,
        password: string,
        isRememberMe: boolean
    ): Promise<JwtResponse> => {
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
    };

    public async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
        return await bcrypt.compare(password, hashedPassword);
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

    loginGoogle = async (code: string) => {
        const client = new OAuth2Client({
            clientId: getEnvConfig().GOOGLE_CLIENT_ID,
            clientSecret: getEnvConfig().GOOGLE_CLIENT_SECRET,
            redirectUri: getEnvConfig().FRONTEND_URL,
        });
        const { tokens } = await client.getToken(code);
        const ticket = await client
            .verifyIdToken({
                idToken: tokens.id_token!,
                audience: getEnvConfig().GOOGLE_CLIENT_ID,
            })
            .catch((error) => {
                throw new AuthenticationError('Invalid credentials', [
                    { field: 'email', message: 'User not found' },
                ]);
            });
        const payload = ticket.getPayload();
        const user = await this.userService.getUserByEmail(payload?.email!);
        if (!user) {
            throw new AuthenticationError('Invalid credentials', [
                { field: 'email', message: 'Email account not valid' },
            ]);
        }
        return await this.jwtService.generateTokens(user, false);
    };
}
