import { z } from 'zod';
import { GitPlatform } from '../types/index.js';

export const AddNewGitSchema = z.object({
    name: z.string().min(1, { message: 'Repository name is required' }),
    user_name: z.string().min(1, { message: 'Username is required' }),
    token: z.string().min(1, { message: 'Access token is required' }),
    platform: z.nativeEnum(GitPlatform, {
        errorMap: () => ({
            message: `Platform must be one of: ${Object.values(GitPlatform).join(', ')}`,
        }),
    }),
});
export type AddNewGitSchemaInput = z.infer<typeof AddNewGitSchema>;
