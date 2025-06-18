import { Request, Response } from 'express';
import path from 'path';
import { gitService, pipelineService } from '../../services/index.js';
import { exampleRequestBody } from '../../utils/constants/exampleRequestBody.js';
import fs from 'fs';
import { JenkinsService } from '../../services/jenkins/jenkins.service.js';
import { logger } from '../../utils/helpers/logger.js';

export class PipelineController {
    constructor(private readonly jenkinsService: JenkinsService) {}
    async generatePipelineController(req: Request, res: Response): Promise<void> {
        let repoPath: string | null = null;

        try {
            const { gitUrl, platform, branch, pipeline, isOverride = false } = req.body;

            if (!gitUrl || !platform || !pipeline) {
                res.status(400).json({
                    error: 'Missing required fields: gitUrl, platform, and pipeline are required',
                    example: exampleRequestBody,
                });
                return;
            }

            if (!pipeline.stages || !Array.isArray(pipeline.stages)) {
                res.status(400).json({
                    error: 'Pipeline must contain stages array',
                    example: exampleRequestBody,
                });
                return;
            }

            repoPath = await gitService.cloneAndCheckout(gitUrl, branch);

            const result = await pipelineService.generateFile(
                repoPath,
                platform,
                pipeline,
                isOverride
            );

            try {
                await gitService.commitAndPush(repoPath, branch || 'main');
            } catch (gitError: any) {
                if (
                    gitError.message.includes('untracked working tree files') ||
                    gitError.message.includes('would be overwritten')
                ) {
                    try {
                        await gitService.handleUntracked(repoPath, branch || 'main');
                        await gitService.commitAndPush(repoPath, branch || 'main');
                    } catch (retryError: any) {
                        throw new Error(`Failed to resolve git conflict: ${retryError.message}`);
                    }
                } else {
                    throw gitError;
                }
            }

            res.status(200).json({
                message: 'CI/CD configuration generated successfully.',
                platform,
                filePath: result.filePath,
                isOverwritten: result.isOverwritten,
                stages: pipeline.stages.map((stage: any) => ({
                    id: stage.id,
                    name: stage.name,
                    parallel: stage.parallel || false,
                    projectsCount: stage.projects ? stage.projects.length : 0,
                })),
            });
        } catch (err: any) {
            if (err.message.includes('already exists')) {
                res.status(409).json({
                    error: err.message,
                    suggestion:
                        'Set isOverride: true in your request body to overwrite the existing file',
                    example: { ...exampleRequestBody, isOverride: true },
                });
                return;
            }

            if (
                err.message.includes('git') ||
                err.message.includes('merge') ||
                err.message.includes('conflict')
            ) {
                res.status(422).json({
                    error: 'Git operation failed',
                    details: err.message,
                    suggestion:
                        'Please check if the branch exists and you have push permissions to the repository',
                });
                return;
            }

            res.status(500).json({
                error: 'Failed to generate CI/CD configuration.',
                details: err.message,
            });
        }
    }

    async validatePipelineController(req: Request, res: Response): Promise<void> {
        try {
            const { pipeline } = req.body;

            if (!pipeline) {
                res.status(400).json({ error: 'Pipeline configuration is required' });
                return;
            }

            const errors: string[] = [];

            if (!pipeline.stages || !Array.isArray(pipeline.stages)) {
                errors.push('Pipeline must contain stages array');
            } else {
                pipeline.stages.forEach((stage: any, index: number) => {
                    if (!stage.id) errors.push(`Stage ${index + 1} missing id`);
                    if (!stage.name) errors.push(`Stage ${index + 1} missing name`);

                    if (stage.projects) {
                        stage.projects.forEach((project: any, projectIndex: number) => {
                            if (!project.name)
                                errors.push(
                                    `Stage ${stage.id}, Project ${projectIndex + 1} missing name`
                                );
                            if (!project.steps || !Array.isArray(project.steps)) {
                                errors.push(
                                    `Stage ${stage.id}, Project ${project.name} missing steps array`
                                );
                            }
                            if (!project.image)
                                errors.push(
                                    `Stage ${stage.id}, Project ${project.name} missing image`
                                );
                        });
                    }
                });
            }

            if (errors.length > 0) {
                res.status(400).json({
                    valid: false,
                    errors,
                    example: exampleRequestBody,
                });
                return;
            }

            res.status(200).json({
                valid: true,
                message: 'Pipeline configuration is valid',
                stagesCount: pipeline.stages.length,
            });
        } catch (err: any) {
            res.status(500).json({
                error: 'Failed to validate pipeline configuration',
                details: err.message,
            });
        }
    }

    async createPipelineController(req: Request, res: Response): Promise<void> {
        const { jobName } = req.body;

        try {
            await this.jenkinsService.createJob(jobName);
            res.status(201).send({ message: `Job ${jobName} created` });
        } catch (err) {
            logger.error('Failed to create Jenkins job', err);
            res.status(500).send({ error: 'Failed to create Jenkins job' });
        }
    }

    async checkExistPipelineController(req: Request, res: Response): Promise<void> {
        try {
            const { gitUrl, platform, branch } = req.body;

            if (!gitUrl || !platform) {
                res.status(400).json({ error: 'gitUrl and platform are required' });
                return;
            }

            const repoPath = await gitService.cloneAndCheckout(gitUrl, branch || 'main');

            let filePath = '';
            switch (platform) {
                case 'github':
                    filePath = path.join(repoPath, '.github', 'workflows', 'ci.yml');
                    break;
                case 'gitlab':
                    filePath = path.join(repoPath, '.gitlab-ci.yml');
                    break;
                case 'jenkins':
                    filePath = path.join(repoPath, 'Jenkinsfile');
                    break;
                default:
                    res.status(400).json({ error: `Unsupported platform: ${platform}` });
                    return;
            }

            const exists = fs.existsSync(filePath);

            res.status(200).json({
                exists,
                filePath,
                platform,
                message: exists
                    ? 'CI/CD configuration file already exists. Use isOverride: true to overwrite.'
                    : 'No CI/CD configuration file found. Safe to generate new one.',
            });
        } catch (err: any) {
            res.status(500).json({
                error: 'Failed to check CI/CD file existence',
                details: err.message,
            });
        }
    }

    async examplePipelineController(req: Request, res: Response): Promise<void> {
        res.json({
            message: 'Example pipeline configuration',
            example: exampleRequestBody,
        });
    }
}
