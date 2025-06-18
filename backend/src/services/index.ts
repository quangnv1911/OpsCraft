import {
    gitRepository,
    projectRepository,
    refreshTokenRepository,
    userRepository,
} from '../repositories/index.js';
import { AuthService } from './auth/auth.service.js';
import { GitService } from './git/git.service.js';
import { JenkinsService } from './jenkins/jenkins.service.js';
import { JwtService } from './jwt/jwt.service.js';
import { PipelineService } from './pipeline/pipeline.service.js';
import { UserService } from './user/user.service.js';

export const jwtService = new JwtService(refreshTokenRepository);
export const pipelineService = new PipelineService();
export const gitService = new GitService(gitRepository, projectRepository);
export const jenkinsService = new JenkinsService();
export const userService = new UserService(userRepository);
export const authService = new AuthService(userService, jwtService);
