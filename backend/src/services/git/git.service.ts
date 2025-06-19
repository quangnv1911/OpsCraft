import simpleGit from 'simple-git';
import path, { dirname } from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import {
    AnalyzeProjectResult,
    GitAccount,
    TechnologyStack,
    ProjectAnalysis,
} from './git.service.type.js';
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

    private async findProjects(
        repoPath: string
    ): Promise<{ path: string; analysis: ProjectAnalysis }[]> {
        const projects: { path: string; analysis: ProjectAnalysis }[] = [];
        const items = fs.readdirSync(repoPath, { withFileTypes: true });

        if (this.isProjectFolder(repoPath)) {
            const analysis = this.analyzeProjectTechnology(repoPath);
            projects.push({ path: repoPath, analysis });
        }

        for (const item of items) {
            if (item.isDirectory()) {
                const subPath = path.join(repoPath, item.name);
                if (this.isProjectFolder(subPath)) {
                    const analysis = this.analyzeProjectTechnology(subPath);
                    projects.push({ path: subPath, analysis });
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
                name: path.basename(p.path),
                path: path.relative(clonePath, p.path),
                technology: p.analysis.technology,
                framework: p.analysis.framework || 'Unknown',
                version: p.analysis.version || 'Unknown',
                buildTool: p.analysis.buildTool || 'Unknown',
            };
        });

        if (projectPaths.length > 1) {
            projectPaths = projectPaths.filter((p) => p.path !== '');
        }

        // Determine main technology and all technologies
        const technologies = [...new Set(projectPaths.map((p) => p.technology))];
        
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
            projectName: project.project_name,
            description: project.description,
            gitUrl,
            repoStorage: publicPath,
            totalProjects: projectPaths.length,
            projectPaths,
            technologies,
        };
    }

    private analyzeProjectTechnology(folderPath: string): ProjectAnalysis {
        try {
            const files = fs.readdirSync(folderPath);

            return (
                this.detectNodeJs(folderPath, files) ??
                this.detectJava(folderPath, files) ??
                this.detectDotNet(folderPath, files) ??
                this.detectPython(folderPath, files) ?? {
                    technology: TechnologyStack.UNKNOWN,
                    framework: 'Unknown',
                    version: 'Unknown',
                    buildTool: 'Unknown',
                }
            );
        } catch (error) {
            logger.error('Error analyzing project technology:', error);
            return {
                technology: TechnologyStack.UNKNOWN,
                framework: 'Unknown',
                version: 'Unknown',
                buildTool: 'Unknown',
            };
        }
    }
    private detectNodeJs(folderPath: string, files: string[]): ProjectAnalysis | null {
        if (!files.includes('package.json')) return null;

        try {
            const packageJsonPath = path.join(folderPath, 'package.json');
            const packageContent = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
            const dependencies = Object.keys(packageContent.dependencies || {});
            const devDependencies = Object.keys(packageContent.devDependencies || {});
            const allDeps = [...dependencies, ...devDependencies];

            let framework = 'Unknown';
            if (allDeps.some((dep) => dep.includes('next'))) framework = 'Next.js';
            else if (allDeps.some((dep) => dep.includes('react'))) framework = 'React';
            else if (allDeps.some((dep) => dep.includes('vue'))) framework = 'Vue.js';
            else if (allDeps.some((dep) => dep.includes('angular'))) framework = 'Angular';
            else if (allDeps.some((dep) => dep.includes('express'))) framework = 'Express.js';
            else if (allDeps.some((dep) => dep.includes('fastify'))) framework = 'Fastify';
            else if (allDeps.some((dep) => dep.includes('nest'))) framework = 'NestJS';

            return {
                technology: TechnologyStack.NODEJS,
                framework,
                version: packageContent.engines?.node || 'Unknown',
                buildTool: files.includes('yarn.lock')
                    ? 'Yarn'
                    : files.includes('pnpm-lock.yaml')
                      ? 'PNPM'
                      : 'NPM',
            };
        } catch (error) {
            logger.error('Error reading package.json:', error);
            return null;
        }
    }

    private detectJava(folderPath: string, files: string[]): ProjectAnalysis | null {
        try {
            if (files.includes('pom.xml')) {
                const pomContent = fs.readFileSync(path.join(folderPath, 'pom.xml'), 'utf-8');
                let framework = pomContent.includes('spring-boot')
                    ? 'Spring Boot'
                    : pomContent.includes('spring')
                      ? 'Spring Framework'
                      : 'Maven Project';
                const versionMatch = pomContent.match(/<java\.version>([^<]+)<\/java\.version>/);
                return {
                    technology: TechnologyStack.JAVA,
                    framework,
                    version: versionMatch?.[1] || 'Unknown',
                    buildTool: 'Maven',
                };
            }

            const gradleFile = files.find((f) => f.startsWith('build.gradle'));
            if (gradleFile) {
                const gradleContent = fs.readFileSync(path.join(folderPath, gradleFile), 'utf-8');
                let framework = gradleContent.includes('org.springframework.boot')
                    ? 'Spring Boot'
                    : gradleContent.includes('org.springframework')
                      ? 'Spring Framework'
                      : 'Gradle Project';

                return {
                    technology: TechnologyStack.JAVA,
                    framework,
                    version: 'Unknown',
                    buildTool: 'Gradle',
                };
            }
        } catch (error) {
            logger.error('Error reading Java build file:', error);
        }

        return null;
    }

    private detectDotNet(folderPath: string, files: string[]): ProjectAnalysis | null {
        const slnFile = files.find((file) => file.endsWith('.sln'));
        if (slnFile) {
            return {
                technology: TechnologyStack.DOTNET,
                framework: '.NET Solution',
                version: 'Unknown',
                buildTool: 'MSBuild',
            };
        }

        const csprojFile = files.find((file) => file.endsWith('.csproj'));
        if (csprojFile) {
            try {
                const csprojContent = fs.readFileSync(path.join(folderPath, csprojFile), 'utf-8');
                let framework = csprojContent.includes('Microsoft.AspNetCore')
                    ? 'ASP.NET Core'
                    : csprojContent.includes('Microsoft.NET.Sdk.Web')
                      ? 'ASP.NET Core Web'
                      : '.NET Project';

                const versionMatch = csprojContent.match(
                    /<TargetFramework>([^<]+)<\/TargetFramework>/
                );

                return {
                    technology: TechnologyStack.DOTNET,
                    framework,
                    version: versionMatch?.[1] || 'Unknown',
                    buildTool: 'MSBuild',
                };
            } catch (error) {
                logger.error('Error reading .csproj file:', error);
            }
        }

        return null;
    }
    private detectPython(folderPath: string, files: string[]): ProjectAnalysis | null {
        if (!['requirements.txt', 'Pipfile', 'pyproject.toml'].some((f) => files.includes(f)))
            return null;

        let framework = 'Python Project';
        let buildTool = 'pip';
        const dependencies: string[] = [];

        try {
            if (files.includes('requirements.txt')) {
                const reqContent = fs.readFileSync(
                    path.join(folderPath, 'requirements.txt'),
                    'utf-8'
                );
                const deps = reqContent
                    .split('\n')
                    .filter((line) => line.trim() && !line.startsWith('#'));
                dependencies.push(...deps.slice(0, 10));

                if (deps.some((dep) => dep.includes('fastapi'))) framework = 'FastAPI';
                else if (deps.some((dep) => dep.includes('django'))) framework = 'Django';
                else if (deps.some((dep) => dep.includes('flask'))) framework = 'Flask';
                
            }

            if (files.includes('Pipfile')) buildTool = 'Pipenv';
            else if (files.includes('pyproject.toml')) buildTool = 'Poetry';

            return {
                technology: TechnologyStack.PYTHON,
                framework,
                version: 'Unknown',
                buildTool,
            };
        } catch (error) {
            logger.error('Error reading Python dependencies:', error);
            return null;
        }
    }

}
