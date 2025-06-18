import simpleGit from 'simple-git';
import path, { dirname } from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { AnalyzeProjectResult, GitAccount } from './git.service.type.js';
import { logger } from '../../utils/helpers/logger.js';
import { AppError } from '../../middleware/error/error.middleware.js';
import { ERROR_TYPES } from '../../middleware/error/error.middleware.type.js';
import { GitRepository } from '../../repositories/git/git.repository.js';
import { getCurrentUser } from '../../lib/context/context.js';
import { Git, Project } from '@prisma/client';
import _ from 'lodash';
import { ProjectRepository } from '../../repositories/project/project.repository.js';
import { getEnvConfig } from '../../config/env/env.config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMMIT_MESSAGE = 'ci: update ci/cd config';

export class GitService {
    private static readonly TMP_ROOT = path.join(__dirname, './../../../tmp');

    constructor(
        private readonly gitRepository: GitRepository,
        private readonly projectRepository: ProjectRepository
    ) {}

    async addNewGit(
        name: string,
        user_name: string,
        token: string,
        platform: string,
        user_id: string
    ): Promise<any> {
        const git: Git = await this.gitRepository.addNewGit({
            name,
            user_name,
            token,
            platform,
            user_id,
        });
        return _.pick(git, ['id', 'name', 'user_name', 'platform']);
    }
    async getAllUserAccount(): Promise<GitAccount[]> {
        const gitAccounts: Git[] = await this.gitRepository.findByUserId(getCurrentUser().userId);
        return gitAccounts.map((git) => _.pick(git, ['id', 'name', 'user_name', 'platform']));
    }

    async cloneAndCheckout(gitUrl: string, branch: string = 'main'): Promise<string> {
        const tempDir = path.join(GitService.TMP_ROOT, uuidv4());
        fs.mkdirSync(tempDir, { recursive: true });

        const git = simpleGit();
        await git.clone(gitUrl, tempDir);
        const repo = simpleGit(tempDir);

        try {
            const branches = await repo.branch();
            if (branches.all.includes(`remotes/origin/${branch}`)) {
                await repo.checkout(['-b', branch, `origin/${branch}`]);
            } else {
                await repo.checkoutLocalBranch(branch);
            }
        } catch (error) {
            logger.error('Checkout error:', error as Error);
            await repo.checkoutLocalBranch(branch);
        }

        return tempDir;
    }

    async commitAndPush(repoPath: string, branch: string = 'main'): Promise<void> {
        const git = simpleGit(repoPath);

        try {
            const status = await git.status();
            if (status.files.length > 0) {
                await git.add('.');
                const statusAfterAdd = await git.status();
                if (statusAfterAdd.staged.length > 0) {
                    await git.commit(COMMIT_MESSAGE);
                }
            }

            try {
                await git.pull('origin', branch, ['--rebase']);
            } catch (pullError) {
                logger.error('Pull failed:', pullError);
            }

            await git.push('origin', branch);
        } catch (error) {
            if (
                (error as Error).message.includes('no upstream branch') ||
                (error as Error).message.includes('does not exist')
            ) {
                await git.push('origin', branch, ['--set-upstream']);
            } else {
                throw error;
            }
        }
    }

    async handleUntracked(repoPath: string, branch: string = 'main'): Promise<void> {
        const git = simpleGit(repoPath);
        try {
            const status = await git.status();
            if (status.not_added.length > 0) {
                await git.add('.');
                await git.commit('ci: add generated CI/CD files');
            }
            await git.pull('origin', branch, ['--rebase']);
        } catch (error) {
            logger.error('Error handling untracked files:', error);
            try {
                await git.fetch('origin', branch);
                await git.reset(['--hard', `origin/${branch}`]);
            } catch (resetError) {
                logger.error('Reset failed:', resetError);
                throw new AppError('Reset failed', 400, ERROR_TYPES.BUSINESS_LOGIC, [
                    {
                        field: 'git branch',
                        message: 'Reset failed',
                    },
                ]);
            }
        }
    }

    private isProjectFolder(folderPath: string): boolean {
        try {
            const files = fs.readdirSync(folderPath);
            const indicators = [
                'package.json',
                'pom.xml',
                'build.gradle',
                'StudentCareSystem.sln',
                'pyproject.toml',
                'setup.py',
                'requirements.txt',
                'Pipfile',
                'main.py',
                'app.py',
                'manage.py',
            ];
            return files.some(
                (file) =>
                    indicators.includes(file) || file.endsWith('.sln') || file.endsWith('.csproj')
            );
        } catch {
            return false;
        }
    }

    private async findProjects(repoPath: string): Promise<string[]> {
        const projects: string[] = [];
        const items = fs.readdirSync(repoPath, { withFileTypes: true });

        if (this.isProjectFolder(repoPath)) {
            projects.push(repoPath);
        }

        for (const item of items) {
            if (item.isDirectory()) {
                const subPath = path.join(repoPath, item.name);
                if (this.isProjectFolder(subPath)) {
                    projects.push(subPath);
                }
            }
        }

        return projects;
    }

    async analyzeGitRepo(
        gitUrl: string,
        gitAccountId: string,
        projectName: string,
        description: string
    ): Promise<AnalyzeProjectResult> {
        const existProject: Project | null = await this.projectRepository.checkProjectExist(
            gitUrl,
            getCurrentUser().userId
        );
        if (existProject) {
            throw new AppError('Project already exists', 400, ERROR_TYPES.BUSINESS_LOGIC, [
                {
                    field: 'project',
                    message: 'Project already exists',
                },
            ]);
        }
        const repoId = uuidv4();
        const publicPath = path.join(
            getEnvConfig().BACKEND_URL,
            'download',
            getCurrentUser().userId,
            repoId
        );
        const clonePath = path.join(GitService.TMP_ROOT, getCurrentUser().userId, '/', repoId);

        const git = simpleGit();
        const url = new URL(gitUrl);
        const gitAccount = await this.gitRepository.findById(gitAccountId);
        if (!gitAccount) {
            throw new AppError('Git account not found', 401, ERROR_TYPES.NOT_FOUND, [
                {
                    field: 'git account id',
                    message: 'Git account not found',
                },
            ]);
        }
        url.username = gitAccount.user_name;
        url.password = gitAccount.token;
        gitUrl = url.toString();
        await git.clone(gitUrl, clonePath).catch(async (error) => {
            throw new AppError(error.message, 401, ERROR_TYPES.AUTHENTICATION, [
                {
                    field: 'git url',
                    message:
                        'Repository not found, please check the git url or git account does not have permission',
                },
            ]);
        });

        const projects = await this.findProjects(clonePath);
        let projectPaths = projects.map((p) => {
            return {
                name: path.basename(p),
                path: path.relative(clonePath, p),
            };
        });

        if (projectPaths.length > 1) {
            projectPaths = projectPaths.filter((p) => p.path !== '');
        }

        const project = await this.projectRepository.addNewProject({
            project_name: projectName,
            description: description,
            user_id: getCurrentUser().userId,
            git_url: gitUrl,
            total_project: projectPaths.length,
            project_path: JSON.stringify(projectPaths),
            repo_storage: publicPath,
            git_account_id: gitAccountId,
        });

        return {
            id: project.id,
            gitUrl,
            repoStorage: publicPath,
            totalProjects: projectPaths.length,
            projectPaths,
        };
    }
}
