import { UserRepository } from './user/user.repository.js';
import { GitRepository } from './git/git.repository.js';
import { RefreshTokenRepository } from './refresh-token/refresh-token.repository.js';
import { ProjectRepository } from './project/project.repository.js';

export const userRepository = new UserRepository();
export const gitRepository = new GitRepository();
export const refreshTokenRepository = new RefreshTokenRepository();
export const projectRepository = new ProjectRepository();
