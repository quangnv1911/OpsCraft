import axios from 'axios';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../../utils/helpers/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class JenkinsService {
    private readonly baseUrl: string = 'http://152.42.186.111:8082';
    private readonly username: string = 'admin';
    private readonly token: string = '123456';
    private readonly authHeader: string = `Basic ${Buffer.from(`${this.username}:${this.token}`).toString('base64')}`;

    async createJob(
        jobName: string,
        configPath: string = path.join(__dirname, '../config.xml')
    ): Promise<string> {
        const configXml = fs.readFileSync(configPath, 'utf8');

        try {
            const response = await axios.post(
                `${this.baseUrl}/createItem?name=${encodeURIComponent(jobName)}`,
                configXml,
                {
                    headers: {
                        'Content-Type': 'application/xml',
                        Authorization: this.authHeader,
                    },
                }
            );
            return response.data;
        } catch (error: any) {
            logger.error('Jenkins API error:', error);
            throw error;
        }
    }
}
