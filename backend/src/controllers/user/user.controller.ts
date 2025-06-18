import { Request, Response } from 'express';
import { UserService } from '../../services/user/user.service.js';
import { sendSuccess } from '../../utils/helpers/response.helper.js';

export class UserController {
    constructor(private readonly userService: UserService) {}

    async getUser(req: Request, res: Response): Promise<void> {
        const user = await this.userService.getUserByEmail(req.params.email);
        return sendSuccess(res, user);
    }
}
