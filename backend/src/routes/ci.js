import express from 'express';
import gitService from '../services/gitService.js';
import ciGenerator from '../services/ciGenerator.js';
import path from 'path';
import fs from 'fs-extra';
import jenkinsService from '../services/jenkinsService.js';
const router = express.Router();

const exampleRequestBody = {
    "message": "Example request body for CI/CD generation",
}

router.post('/generate', async (req, res) => {
    let repoPath = null;

    try {
        const { gitUrl, platform, branch, pipeline, isOverride = false } = req.body;

        // Validate required fields
        if (!gitUrl || !platform || !pipeline) {
            return res.status(400).json({
                error: 'Missing required fields: gitUrl, platform, and pipeline are required',
                example: exampleRequestBody
            });
        }

        // Validate pipeline structure
        if (!pipeline.stages || !Array.isArray(pipeline.stages)) {
            return res.status(400).json({
                error: 'Pipeline must contain stages array',
                example: exampleRequestBody
            });
        }

        // Clone repository and checkout branch
        repoPath = await gitService.cloneAndCheckout(gitUrl, branch);
        console.log(" repoPath", repoPath);
        // Generate CI/CD configuration
        const result = await ciGenerator.generateFile(repoPath, platform, pipeline, isOverride);
        console.log(" result", result);
        // Commit and push changes with improved error handling
        try {
            await gitService.commitAndPush(repoPath, branch || 'main');
        } catch (gitError) {
            console.error('Git operation failed:', gitError.message);

            // Try to handle untracked files conflict
            if (gitError.message.includes('untracked working tree files') ||
                gitError.message.includes('would be overwritten')) {

                console.log('Attempting to resolve untracked files conflict...');
                try {
                    await gitService.handleUntracked(repoPath, branch || 'main');
                    await gitService.commitAndPush(repoPath, branch || 'main');
                } catch (retryError) {
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
            stages: pipeline.stages.map(stage => ({
                id: stage.id,
                name: stage.name,
                parallel: stage.parallel || false,
                projectsCount: stage.projects ? stage.projects.length : 0
            }))
        });
    } catch (err) {
        console.error('Error generating CI/CD configuration:', err);

        // Check if error is about file already existing
        if (err.message.includes('already exists')) {
            return res.status(409).json({
                error: err.message,
                suggestion: 'Set isOverride: true in your request body to overwrite the existing file',
                example: { ...exampleRequestBody, isOverride: true }
            });
        }

        // Check if error is git-related
        if (err.message.includes('git') || err.message.includes('merge') || err.message.includes('conflict')) {
            return res.status(422).json({
                error: 'Git operation failed',
                details: err.message,
                suggestion: 'Please check if the branch exists and you have push permissions to the repository'
            });
        }

        res.status(500).json({
            error: 'Failed to generate CI/CD configuration.',
            details: err.message
        });
    } 
    // finally {
    //     // // Cleanup temp directory if it exists
    //     // if (repoPath && fs.existsSync(repoPath)) {
    //     //     try {
    //     //         fs.rmSync(repoPath, { recursive: true, force: true });
    //     //     } catch (cleanupError) {
    //     //         console.warn('Failed to cleanup temp directory:', cleanupError.message);
    //     //     }
    //     // }
    // }
});

// GET endpoint to retrieve example configuration
router.get('/example', (req, res) => {
    res.status(200).json({
        message: 'Example pipeline configuration',
        example: exampleRequestBody
    });
});

// GET endpoint to validate pipeline configuration
router.post('/validate', (req, res) => {
    try {
        const { pipeline } = req.body;

        if (!pipeline) {
            return res.status(400).json({ error: 'Pipeline configuration is required' });
        }

        const errors = [];

        // Validate stages
        if (!pipeline.stages || !Array.isArray(pipeline.stages)) {
            errors.push('Pipeline must contain stages array');
        } else {
            pipeline.stages.forEach((stage, index) => {
                if (!stage.id) errors.push(`Stage ${index + 1} missing id`);
                if (!stage.name) errors.push(`Stage ${index + 1} missing name`);

                if (stage.projects) {
                    stage.projects.forEach((project, projectIndex) => {
                        if (!project.name) errors.push(`Stage ${stage.id}, Project ${projectIndex + 1} missing name`);
                        if (!project.steps || !Array.isArray(project.steps)) {
                            errors.push(`Stage ${stage.id}, Project ${project.name} missing steps array`);
                        }
                        if (!project.image) errors.push(`Stage ${stage.id}, Project ${project.name} missing image`);
                    });
                }
            });
        }

        if (errors.length > 0) {
            return res.status(400).json({
                valid: false,
                errors,
                example: exampleRequestBody
            });
        }

        res.status(200).json({
            valid: true,
            message: 'Pipeline configuration is valid',
            stagesCount: pipeline.stages.length
        });
    } catch (err) {
        res.status(500).json({
            error: 'Failed to validate pipeline configuration',
            details: err.message
        });
    }
});

router.post('/create-job', async (req, res) => {
    const { jobName } = req.body;

    try {
        await jenkinsService.createJenkinsJob(jobName);
        res.status(201).send({ message: `Job ${jobName} created` });
    } catch (err) {
        console.error('Error creating Jenkins job:', err);
        res.status(500).send({ error: 'Failed to create Jenkins job' });
    }
});

// GET endpoint to check if CI/CD file exists in repository
router.post('/check', async (req, res) => {
    try {
        const { gitUrl, platform, branch } = req.body;

        if (!gitUrl || !platform) {
            return res.status(400).json({
                error: 'gitUrl and platform are required'
            });
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
                return res.status(400).json({ error: `Unsupported platform: ${platform}` });
        }

        const exists = require('fs').existsSync(filePath);

        res.status(200).json({
            exists,
            filePath,
            platform,
            message: exists
                ? 'CI/CD configuration file already exists. Use isOverride: true to overwrite.'
                : 'No CI/CD configuration file found. Safe to generate new one.'
        });
    } catch (err) {
        console.error('Error checking CI/CD file:', err);
        res.status(500).json({
            error: 'Failed to check CI/CD file existence',
            details: err.message
        });
    }
});

export default router;