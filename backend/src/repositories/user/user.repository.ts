import { User } from '@prisma/client';
import prisma from '../../lib/prisma.js';
import _ from 'lodash';

export class UserRepository {
    async findById(id: string): Promise<User | null> {
        return prisma.user.findUnique({ where: { id } });
    }

    async getAllUsers(): Promise<User[]> {
        return prisma.user.findMany();
    }

    async getUserByEmail(email: string): Promise<User | null> {
        return prisma.user.findFirst({ where: { email } });
    }

    async createUser(
        email: string,
        password: string,
        user_name: string,
        first_name?: string | null | undefined,
        last_name?: string | null | undefined
    ): Promise<User> {
        const data = _.omitBy(
            { email, password, user_name, first_name, last_name },
            _.isUndefined
        ) as {
            email: string;
            password: string;
            user_name: string;
            first_name?: string | null;
            last_name?: string | null;
        };

        return prisma.user.create({ data });
    }
}
