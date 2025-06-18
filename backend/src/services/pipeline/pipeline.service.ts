import fs from 'fs';
import path from 'path';
import { GeneratedFileInfo, PipelineConfig } from '../jenkins/jenkins.service.type.js';
import { AppError } from '../../middleware/error/error.middleware.js';
import { ERROR_TYPES } from '../../middleware/error/error.middleware.type.js';

export class PipelineService {
    /* 
        Generate file for pipeline
        @param repoPath: string
        @param platform: string
        @param pipelineConfig: PipelineConfig
        @param isOverride: boolean
        @returns GeneratedFileInfo
    */
    generateFile = async (
        repoPath: string,
        platform: string,
        pipelineConfig: PipelineConfig,
        isOverride = false
    ): Promise<GeneratedFileInfo> => {
        let content = '';
        let filePath = '';
        let fileExisted = false;

        switch (platform) {
            case 'github':
                filePath = path.join(repoPath, '.github', 'workflows', 'ci.yml');
                break;
            case 'gitlab':
                filePath = path.join(repoPath, '.gitlab-ci.yml');
                break;
            case 'jenkins':
                filePath = path.join(repoPath, 'Jenkinsfile');
                break;
            default:
                throw new AppError(
                    `Unsupported platform: ${platform}`,
                    400,
                    ERROR_TYPES.UNSUPPORTED,
                    [
                        {
                            field: 'platform',
                            message: `Unsupported platform: ${platform}`,
                        },
                    ]
                );
        }

        if (fs.existsSync(filePath)) {
            fileExisted = true;
            if (!isOverride) {
                throw new Error(
                    `CI/CD configuration file already exists at ${filePath}. Set isOverride: true to overwrite.`
                );
            }
        }

        switch (platform) {
            case 'github':
                content = this.generateGitHubActions(pipelineConfig);
                fs.mkdirSync(path.join(repoPath, '.github', 'workflows'), { recursive: true });
                fs.writeFileSync(filePath, content);
                break;
            case 'gitlab':
                content = this.generateGitLabCI(pipelineConfig);
                fs.writeFileSync(filePath, content);
                break;
            case 'jenkins':
                content = this.generateJenkinsfile(pipelineConfig);
                fs.writeFileSync(filePath, content);
                break;
        }

        return {
            filePath: filePath.replace(repoPath, ''),
            content,
            isOverwritten: fileExisted && isOverride,
        };
    };

    /* 
        Generate GitHub Actions file
        @param config: PipelineConfig
        @returns string
     */
    generateGitHubActions = (config: PipelineConfig): string => {
        const branches = config.trigger.branch ? [config.trigger.branch] : ['main', 'develop'];
        let jobs = '';

        config.stages.forEach((stage) => {
            if (stage.projects) {
                stage.projects.forEach((project) => {
                    const jobName = `${stage.id}-${project.name.toLowerCase()}`;
                    let steps = `      - name: Checkout code\n        uses: actions/checkout@v4\n`;

                    steps += `      - name: Setup environment for ${project.name}\n        uses: actions/setup-node@v4\n        with:\n          node-version: '18'\n        if: contains('${project.image}', 'node')\n`;

                    steps += `      - name: Setup Java\n        uses: actions/setup-java@v4\n        with:\n          distribution: 'temurin'\n          java-version: '11'\n        if: contains('${project.image}', 'maven')\n`;

                    project.steps.forEach((step, idx) => {
                        steps += `      - name: ${project.name} - Step ${idx + 1}\n        run: ${step.command}\n`;
                    });

                    steps += `      - name: Archive artifacts\n        uses: actions/upload-artifact@v4\n        with:\n          name: ${jobName}-artifacts\n          path: |\n            **/dist/\n            **/build/\n            **/target/\n        if: success()\n`;

                    jobs += `  ${jobName}:\n    runs-on: ubuntu-latest\n    container:\n      image: ${project.image}\n    steps:\n${steps}\n`;
                });
            }
        });

        return `name: CI/CD Pipeline\n\non:\n  push:\n    branches: [ ${branches.join(', ')} ]\n  pull_request:\n    branches: [ ${branches.join(', ')} ]\n\nenv:\n  NODE_ENV: production\n\njobs:\n${jobs}`;
    };

    /* 
        Generate GitLab CI file
        @param config: PipelineConfig
        @returns string
    */
    generateGitLabCI = (config: PipelineConfig): string => {
        let content = `image: ubuntu:latest\n\nvariables:\n  NODE_ENV: production\n\nstages:\n`;

        config.stages.forEach((stage) => {
            content += `  - ${stage.id}\n`;
        });

        config.stages.forEach((stage) => {
            if (stage.projects && stage.parallel) {
                stage.projects.forEach((project) => {
                    content += `${stage.id}-${project.name.toLowerCase()}:\n  stage: ${stage.id}\n  image: ${project.image}\n  script:\n`;
                    project.steps.forEach((step) => {
                        content += `    - ${step.command}\n`;
                    });
                    content += `  artifacts:\n    paths:\n      - "**/dist/"\n      - "**/build/"\n      - "**/target/"\n    expire_in: 1 week\n  only:\n    refs:\n      - ${config.trigger.branch || 'main'}\n      - merge_requests\n\n`;
                });
            } else {
                const image = stage.projects?.[0]?.image || 'ubuntu:latest';
                content += `${stage.id}:\n  stage: ${stage.id}\n  image: ${image}\n  script:\n`;
                stage.steps?.forEach((step) => {
                    content += `    - ${step.command}\n`;
                });
                content += `  only:\n    refs:\n      - ${config.trigger.branch || 'main'}\n      - merge_requests\n\n`;
            }
        });

        return content;
    };

    /* 
        Generate Jenkinsfile
        @param config: PipelineConfig
        @returns string
    */
    generateJenkinsfile = (config: PipelineConfig): string => {
        let script = `pipeline {\n    agent any\n    environment {\n        NODE_ENV = 'production'\n    }\n    triggers {\n        pollSCM('H/5 * * * *')\n    }\n    stages {\n        stage('Checkout') {\n            steps {\n                echo 'Checking out source code...'\n                checkout scm\n            }\n        }\n`;

        config.stages.forEach((stage) => {
            if (stage.projects && stage.parallel) {
                script += `        stage('${stage.name}') {\n            parallel {\n`;
                stage.projects.forEach((project) => {
                    script += `                '${project.name}': {\n                    node {\n                        docker.image('${project.image}').inside {\n`;
                    project.steps.forEach((step) => {
                        script += `                            sh '${step.command}'\n`;
                    });
                    script += `                        }\n                    }\n                },\n`;
                });
                script += `            }\n        }\n`;
            } else {
                const image = stage.projects?.[0]?.image || 'ubuntu:latest';
                script += `        stage('${stage.name}') {\n            steps {\n                script {\n                    docker.image('${image}').inside {\n`;
                stage.steps?.forEach((step) => {
                    script += `                        sh '${step.command}'\n`;
                });
                script += `                    }\n                }\n            }\n        }\n`;
            }
        });

        script += `    }\n    post {\n        always {\n            echo 'Pipeline completed!'\n            archiveArtifacts artifacts: '**/dist/**, **/build/**, **/target/**', allowEmptyArchive: true\n            cleanWs()\n        }\n        success {\n            echo 'Pipeline succeeded!'\n        }\n        failure {\n            echo 'Pipeline failed!'\n        }\n    }\n}`;

        return script;
    };
}
