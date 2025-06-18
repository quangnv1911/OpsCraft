import { gitService } from '../../services/index.js';
import { Request, Response } from 'express';
import { AnalyzeProjectRequestBody } from './project.controller.type';
import { sendError, sendSuccess } from '../../utils/helpers/response.helper.js';
import { AnalyzeProjectResult } from '../../services/git/git.service.type.js';

export class ProjectController {
    async analyzeProject(
        req: Request<{}, {}, AnalyzeProjectRequestBody>,
        res: Response<AnalyzeProjectResult>
    ): Promise<void> {
        const { gitUrl, gitAccountId, projectName, description } = req.body;

        if (!gitUrl || !gitUrl.startsWith('https://')) {
            return sendError(res, 'Invalid Git URL');
        }
        console.log('1')
        console.log(projectName)
        const result: AnalyzeProjectResult = await gitService.analyzeGitRepo(
            gitUrl,
            gitAccountId,
            projectName,
            description
        );
        return sendSuccess(res, result, 'Analyze project successfully');
    }
}
