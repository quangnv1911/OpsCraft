import jwt, { JwtPayload } from 'jsonwebtoken';
import { AuthenticationError } from '../../middleware/error/error.middleware.js';
import { getEnvConfig } from '../../config/env/env.config.js';
import { logger } from '../../utils/helpers/logger.js';
import { JwtResponse, UserPayload } from './jwt.service.type.js';
import { RefreshTokenRepository } from '../../repositories/refresh-token/refresh-token.repository.js';
import { getCurrentUser } from '../../lib/context/context.js';

export class JwtService {
    constructor(private readonly refreshTokenRepository: RefreshTokenRepository) {}
    /* Generate access and refresh tokens */
    async generateTokens(user: UserPayload, isRememberMe: boolean = false): Promise<JwtResponse> {
        const accessToken = await this.generateAccessToken(user);
        const refreshToken = await this.generateRefreshToken(user, isRememberMe);
        return {
            accessToken,
            refreshToken,
        };
    }

    async handleRefreshToken(refreshToken: string): Promise<JwtResponse> {
        await this.verifyRefreshToken(refreshToken);
        const { userId, email } = getCurrentUser();
        const accessToken = await this.generateAccessToken({ id: userId, email });
        const tokenResponse = {
            accessToken,
            refreshToken,
        };
        return tokenResponse;
    }

    private async generateAccessToken(user: UserPayload): Promise<string> {
        const accessToken = jwt.sign(
            { id: user.id ?? '', email: user.email },
            getEnvConfig().JWT_ACCESS_SECRET,
            {
                expiresIn: getEnvConfig().JWT_ACCESS_EXPIRES_IN,
            }
        );
        return accessToken;
    }

    private async generateRefreshToken(user: UserPayload, isRememberMe: boolean): Promise<string> {
        const expiresIn = isRememberMe
            ? getEnvConfig().JWT_REFRESH_EXPIRES_IN_REMEMBER
            : getEnvConfig().JWT_REFRESH_EXPIRES_IN;
        const refreshToken = jwt.sign({ id: user.id ?? '' }, getEnvConfig().JWT_REFRESH_SECRET, {
            expiresIn,
        });
        await this.refreshTokenRepository.createRefreshToken(
            refreshToken,
            user.id,
            new Date(Date.now() + expiresIn)
        );
        return refreshToken;
    }

    verifyAccessToken(token: string): JwtPayload {
        try {
            return jwt.verify(token, getEnvConfig().JWT_ACCESS_SECRET) as JwtPayload;
        } catch (error) {
            logger.error('Invalid access token', error);
            throw new AuthenticationError('Invalid access token');
        }
    }

    private async verifyRefreshToken(token: string): Promise<void> {
        try {
            jwt.verify(token, getEnvConfig().JWT_REFRESH_SECRET) as JwtPayload;
            const storedToken = await this.refreshTokenRepository.findByToken(token);
            if (!storedToken) throw new AuthenticationError('Invalid refresh token');
            if (storedToken.expiresAt < new Date())
                throw new AuthenticationError('Expired refresh token', [
                    {
                        field: 'refreshToken',
                        message: 'Expired refresh token',
                    },
                ]);
        } catch (error) {
            logger.error('Invalid refresh token', error);
            throw new AuthenticationError('Invalid refresh token', [
                {
                    field: 'refreshToken',
                    message: 'Invalid refresh token',
                },
            ]);
        }
    }
}
