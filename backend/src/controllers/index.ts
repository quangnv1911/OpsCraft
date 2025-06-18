import { ProjectController } from './project/project.controller.js';
import { AuthController } from './auth/auth.controller.js';
import { PipelineController } from './pipeline/pipeline.controller.js';

import {
    authService,
    gitService,
    jenkinsService,
    jwtService,
    userService,
} from '../services/index.js';
import { UserController } from './user/user.controller.js';
import { RootController } from './root/root.controller.js';
import { GitController } from './git/git.controller.js';

export const projectController = new ProjectController();
export const authController = new AuthController(authService, jwtService, userService, gitService);
export const pipelineController = new PipelineController(jenkinsService);
export const gitController = new GitController(gitService, userService);
export const userController = new UserController(userService);
export const rootController = new RootController();
