import { Request, Response } from 'express';
import { getCurrentUser } from '../../lib/context/context.js';
import { sendSuccess } from '../../utils/helpers/response.helper.js';
import { GitService } from '../../services/git/git.service.js';
import { logger } from '../../utils/helpers/logger.js';
import { AppError } from '../../middleware/error/error.middleware.js';
import { ERROR_TYPES } from '../../middleware/error/error.middleware.type.js';
import { UserService } from '../../services/user/user.service.js';

export class GitController {
    constructor(
        private readonly gitService: GitService,
        private readonly userService: UserService
    ) {}

    addNewGit = async (req: Request, res: Response): Promise<void> => {
        const { name, user_name, token, platform } = req.body;

        const git = await this.gitService.addNewGit(
            name,
            user_name,
            token,
            platform,
            getCurrentUser().userId || ''
        );
        return sendSuccess(res, git);
    };

    getAllUserAccount = async (req: Request, res: Response): Promise<void> => {
        const userAccounts = await this.gitService.getAllUserAccount();
        return sendSuccess(res, userAccounts);
    };
}
