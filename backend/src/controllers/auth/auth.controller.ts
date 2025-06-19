import { Request, Response } from 'express';
import { AuthenticationError } from '../../middleware/error/error.middleware.js';
import prisma from '../../lib/prisma.js';
import { User } from '@prisma/client';
import { sendSuccess } from '../../utils/helpers/response.helper.js';
import { AuthService } from '../../services/auth/auth.service.js';
import { JwtService } from '../../services/jwt/jwt.service.js';
import { UserService } from '../../services/user/user.service.js';
import { getEnvConfig } from '../../config/env/env.config.js';
import { UserDto } from '../../services/user/user.service.type.js';
import { GitService } from '../../services/git/git.service.js';

export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly jwtService: JwtService,
        private readonly userService: UserService,
        private readonly gitService: GitService
    ) {}

    loginManual = async (req: Request, res: Response) => {
        const { email, password, isRememberMe } = req.body;
        console.log(this.gitService);
        const tokenResponse = await this.authService.handleLoginManual(
            email,
            password,
            isRememberMe
        );

        return sendSuccess(res, tokenResponse);
    };

    handleRefreshToken = async (req: Request, res: Response) => {
        const { refreshToken } = req.body;
        const tokenResponse = await this.jwtService.handleRefreshToken(refreshToken);
        return sendSuccess(res, tokenResponse, 'Refresh token successfully');
    };

    handleLogout = async (req: Request, res: Response) => {
        const { refreshToken } = req.body;

        if (refreshToken) {
            await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
        }

        return sendSuccess(res, { message: 'Logged out successfully' });
    };

    getCurrentUser = async (req: Request, res: Response) => {
        const userData: UserDto = await this.userService.getCurrentUser();
        return sendSuccess(res, userData);
    };

    loginGoogle = async (req: Request, res: Response) => {
        const { code } = req.body;
        const tokenResponse = await this.authService.loginGoogle(code);
        return sendSuccess(res, tokenResponse);
    };
    register = async (req: Request, res: Response) => {
        const { email, password, user_name } = req.body;
        const user = await this.userService.createUser(email, password, user_name);
        return sendSuccess(res, user);
    };
}
