import prisma from '../../lib/prisma.js';

export class RefreshTokenRepository {
    async createRefreshToken(refreshToken: string, userId: string, expiresAt: Date) {
        return await prisma.refreshToken.create({
            data: { token: refreshToken, user_id: userId, expiresAt },
        });
    }

    async findByToken(token: string) {
        return await prisma.refreshToken.findFirst({ where: { token } });
    }

    async deleteByToken(token: string) {
        return await prisma.refreshToken.delete({ where: { token } });
    }
}
