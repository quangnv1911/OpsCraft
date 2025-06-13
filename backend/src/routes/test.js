import express from 'express';
import simpleGit from 'simple-git';
import fs from 'fs-extra';
import path,{ dirname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

const router = express.Router();

// Tạo __dirname cho ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TMP_ROOT = path.join(__dirname, '../tmp'); // thư mục chứa repo tạm thời


function isProjectFolder(folderPath) {
    let files;
    try {
        files = fs.readdirSync(folderPath);
    } catch (err) {
        return false; // Nếu folder không truy cập được
    }

    const projectIndicators = [
        // Node.js
        'package.json',

        // Java
        'pom.xml',
        'build.gradle',

        // .NET
        'StudentCareSystem.sln',

        // Python
        'pyproject.toml',
        'setup.py',
        'requirements.txt',
        'Pipfile',
        'main.py',
        'app.py',
        'manage.py'
    ];

    return files.some(file =>
        projectIndicators.includes(file) ||
        file.endsWith('.sln') ||
        file.endsWith('.csproj')
    );
}


// Tìm các project trong repo
function findProjects(repoPath) {
    const projects = [];
    const items = fs.readdirSync(repoPath, { withFileTypes: true });

    if (isProjectFolder(repoPath)) {
        projects.push(repoPath);
    }

    for (const item of items) {
        console.log(item);
        if (item.isDirectory()) {
            const subPath = path.join(repoPath, item.name);
            if (isProjectFolder(subPath)) {
                projects.push(subPath);
            }
        }
    }

    return projects;
}

// Hàm xử lý chính
async function analyzeGitRepo(gitUrl) {
    const repoId = uuidv4();
    const clonePath = path.join(TMP_ROOT, repoId);
    const git = simpleGit();

    await git.clone(gitUrl, clonePath);

    const projects = findProjects(clonePath);

    console.log(projects);

    let projectPaths = projects.map(p => path.relative(clonePath, p));

    // Nếu có nhiều hơn 1 project thì loại bỏ các giá trị rỗng
    if (projectPaths.length > 1) {
        projectPaths = projectPaths.filter(path => path !== "");
    }

    console.log({
        totalProjects: projectPaths.length,
        projectPaths: projectPaths,
    });

    return {
        totalProjects: projectPaths.length,
        projectPaths: projectPaths,
    };
}


router.post('/check-git', async (req, res) => {
    console.log('check-git');
    const { gitUrl } = req.body;

    if (!gitUrl || !gitUrl.startsWith('https://')) {
        return res.status(400).json({ error: 'Invalid Git URL' });
    }

    try {
        const result = await analyzeGitRepo(gitUrl);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to analyze repository' });
    }
});

export default router; 