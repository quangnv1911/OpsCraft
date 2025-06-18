import { UserRepository } from './../../repositories/user/user.repository';

import { User } from '@prisma/client';
import { UserDto } from './user.service.type.js';
import _ from 'lodash';
import bcrypt from 'bcrypt';
import { ValidationError } from '../../middleware/error/error.middleware.js';
import { getCurrentUser } from '../../lib/context/context.js';
const SALT_ROUNDS = 10;

export class UserService {
    constructor(private readonly userRepository: UserRepository) {}
    async getUserByEmail(email: string): Promise<User | null> {
        const user = await this.userRepository.getUserByEmail(email);
        return user;
    }

    async getCurrentUser(): Promise<UserDto> {
        const user = await this.userRepository.findById(getCurrentUser().userId);
        return _.pick(user, ['email', 'user_name', 'first_name', 'last_name']) as UserDto;
    }

    async createUser(email: string, password: string, user_name: string): Promise<UserDto> {
        if (await this.getUserByEmail(email)) {
            throw new ValidationError(`User already exists: ${email}`, [
                { field: 'email', message: 'User already exists' },
            ]);
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        const user = await this.userRepository.createUser(email, hashedPassword, user_name);
        return _.pick(user, ['email', 'user_name', 'first_name', 'last_name']) as UserDto;
    }
}
