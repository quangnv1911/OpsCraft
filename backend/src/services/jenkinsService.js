import axios from 'axios';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const JENKINS_URL = 'http://152.42.186.111:8082';
const JENKINS_USER = 'quangnv1911';
const JENKINS_TOKEN = '11242c503ddb88f803385fdb9df4bc57d3';

const auth = Buffer.from(`${JENKINS_USER}:${JENKINS_TOKEN}`).toString('base64');

async function createJenkinsJob(jobName) {
    const configXml = fs.readFileSync(path.join(__dirname, '../config.xml'), 'utf8');

    try {
        const response = await axios.post(
            `${JENKINS_URL}/createItem?name=${jobName}`,
            configXml,
            {
                headers: {
                    'Content-Type': 'application/xml',
                    'Authorization': `Basic ${auth}`
                }
            }
        );

        return response.data;
    } catch (error) {
        console.error('Jenkins API error:', error.response?.data || error.message);
        throw error;
    }
}

export default { createJenkinsJob };
