import { Project } from '@prisma/client';
import prisma from '../../lib/prisma.js';
import { AddNewProjectParams } from './project.repository.type.js';

/* 
    ProjectRepository is used to store and retrieve project data from the database.
*/
export class ProjectRepository {
    async addNewProject(params: AddNewProjectParams) {
        return await prisma.project.create({ data: params });
    }

    async checkProjectExist(gitUrl: string, userId: string): Promise<Project | null> {
        return await prisma.project.findFirst({
            where: { git_url: gitUrl, user_id: userId },
        });
    }
}
