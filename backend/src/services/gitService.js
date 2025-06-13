import simpleGit from 'simple-git';
import path, { dirname } from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const COMMIT_MESSAGE = 'ci: update ci/cd config';

const cloneAndCheckout = async (gitUrl, branch = 'main') => {
    const tempDir = path.join(__dirname, '../tmp', uuidv4());
    fs.mkdirSync(tempDir, { recursive: true });

    const git = simpleGit();
    await git.clone(gitUrl, tempDir);
    const repo = simpleGit(tempDir);
    await repo.pull('origin');
    // Check if branch exists locally or remotely
    try {
        const branches = await repo.branch();
        console.log(" branches", branches);
        console.log(" branch", branch);
        if (branches.all.includes(`remotes/origin/${branch}`)) {
            // Branch exists on remote, checkout and track it
            await repo.checkout(['-b', branch, `origin/${branch}`]);
        } else {
            // Branch doesn't exist, create new one
            await repo.checkoutLocalBranch(branch);
        }
    } catch (error) {
        console.error(" error", error);
        // If checkout fails, try to create new branch
        await repo.checkoutLocalBranch(branch);
    }

    return tempDir;
};

const commitAndPush = async (repoPath, branch = 'main') => {
    const git = simpleGit(repoPath);

    try {
        // Check git status first
        const status = await git.status();

        // If there are untracked or modified files, add them first
        if (status.files.length > 0) {
            await git.add('.');

            // Check if there's anything to commit
            const statusAfterAdd = await git.status();
            if (statusAfterAdd.staged.length > 0) {
                await git.commit(COMMIT_MESSAGE);
            }
        }

        // Try to pull with rebase to avoid merge conflicts
        try {
            await git.pull('origin', branch, ['--rebase']);
        } catch (pullError) {
            console.warn('Pull failed, proceeding with push:', pullError.message);
            // If pull fails due to no upstream or other issues, continue with push
        }

        // Push to remote
        await git.push('origin', branch);

    } catch (error) {
        // If push fails because branch doesn't exist on remote, push with set upstream
        if (error.message.includes('no upstream branch') || error.message.includes('does not exist')) {
            await git.push('origin', branch, ['--set-upstream']);
        } else {
            throw error;
        }
    }
};

const handleUntracked = async (repoPath, branch = 'main') => {
    const git = simpleGit(repoPath);

    try {
        // Get status to see untracked files
        const status = await git.status();

        if (status.not_added.length > 0) {
            console.log('Found untracked files:', status.not_added);

            // Add untracked files to staging
            await git.add('.');

            // Commit them
            await git.commit('ci: add generated CI/CD files');
        }

        // Now safely pull
        await git.pull('origin', branch, ['--rebase']);

    } catch (error) {
        console.warn('Error handling untracked files:', error.message);

        // If still fails, try force pull
        try {
            await git.fetch('origin', branch);
            await git.reset(['--hard', `origin/${branch}`]);
        } catch (resetError) {
            console.warn('Reset also failed:', resetError.message);
            throw resetError;
        }
    }
};

export default { cloneAndCheckout, commitAndPush, handleUntracked };
