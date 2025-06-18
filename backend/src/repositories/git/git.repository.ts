import { Git } from '@prisma/client';
import prisma from '../../lib/prisma.js';
import { GitAccount } from '../../services/git/git.service.type.js';
import { AddNewGitParams } from './git.repository.type.js';

// git.repository.ts

export class GitRepository {
    async addNewGit(params: AddNewGitParams) {
        return await prisma.git.create({ data: params });
    }

    async findByUserId(user_id: string): Promise<Git[]> {
        return await prisma.git.findMany({ where: { user_id } });
    }

    async findById(id: string): Promise<Git | null> {
        return await prisma.git.findUnique({ where: { id } });
    }

    async deleteById(id: string) {
        return await prisma.git.delete({ where: { id } });
    }
}
