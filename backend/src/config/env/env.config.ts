//  env.config.ts
import { envSchema } from '../../schemas/index.js';
import { logger } from '../../utils/helpers/logger.js';
import { EnvironmentVariables } from './env.config.type.js';

let parsedEnv: EnvironmentVariables;

// Validate environment variables
const result = envSchema.safeParse(process.env);
if (!result.success) {
    const formatted = result.error.format();
    Object.entries(formatted).forEach(([key, value]) => {
        if (key === '_errors') return;
        const messages = (value as any)._errors;
        if (messages?.length) {
            logger.error(`🧨 ${key}: ${messages.join(', ')}`);
        }
    });

    // Nếu có lỗi tổng quát (hiếm)
    if (formatted._errors?.length) {
        logger.error(`🌐 General Errors: ${formatted._errors.join(', ')}`);
    }
    process.exit(1);
}
parsedEnv = result.data;

export function getEnvConfig(): EnvironmentVariables {
    return parsedEnv;
}
