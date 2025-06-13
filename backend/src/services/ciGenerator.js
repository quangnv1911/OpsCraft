import fs from 'fs';
import path from 'path';

const generateFile = async (repoPath, platform, pipelineConfig, isOverride = false) => {
    let content = '';
    let filePath = '';
    let fileExisted = false;

    console.log(" repoPath", repoPath);
    // Determine the file path based on platform
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
            throw new Error(`Unsupported platform: ${platform}`);
    }

    // Check if file already exists
    if (fs.existsSync(filePath)) {
        fileExisted = true;
        if (!isOverride) {
            throw new Error(`CI/CD configuration file already exists at ${filePath}. Set isOverride: true to overwrite.`);
        }
    }

    // Generate content based on platform
    switch (platform) {
        case 'github':
            content = generateGitHubActions(pipelineConfig);
            const dir = path.join(repoPath, '.github', 'workflows');
            fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(filePath, content);
            break;
        case 'gitlab':
            content = generateGitLabCI(pipelineConfig);
            fs.writeFileSync(filePath, content);
            break;
        case 'jenkins':
            content = generateJenkinsfile(pipelineConfig);
            fs.writeFileSync(filePath, content);
            break;
    }
    console.log(" content", content);
    return {
        filePath: filePath.replace(repoPath, ''), // Return relative path
        content,
        isOverwritten: fileExisted && isOverride
    };
};

function generateDockerfiles(repoPath, pipelineConfig) {
    const { stages } = pipelineConfig;
    const dockerfileGenerated = new Set();

    stages.forEach(stage => {
        if (stage.projects) {
            stage.projects.forEach(project => {
                const dockerfilePath = getProjectPath(project, repoPath);
                if (!dockerfileGenerated.has(dockerfilePath)) {
                    generateProjectDockerfile(dockerfilePath, project);
                    dockerfileGenerated.add(dockerfilePath);
                }
            });
        }
    });
}

function getProjectPath(project, repoPath) {
    // Extract project path from commands
    const commands = project.steps.map(step => step.command).join(' ');
    if (commands.includes('cd frontend')) return path.join(repoPath, 'frontend');
    if (commands.includes('cd backend')) return path.join(repoPath, 'backend');
    if (commands.includes('cd mobile')) return path.join(repoPath, 'mobile');
    return repoPath;
}

function generateProjectDockerfile(projectPath, project) {
    const { image } = project;
    let dockerfileContent = '';

    if (image.includes('node')) {
        dockerfileContent = `# Node.js Dockerfile
FROM ${image}
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
`;
    } else if (image.includes('maven')) {
        dockerfileContent = `# Maven Dockerfile
FROM ${image}
WORKDIR /app
COPY pom.xml ./
RUN mvn dependency:go-offline
COPY src ./src
RUN mvn clean package -DskipTests
EXPOSE 8080
CMD ["java", "-jar", "target/*.jar"]
`;
    } else {
        dockerfileContent = `# Generic Dockerfile
FROM ${image}
WORKDIR /app
COPY . .
CMD ["sh", "-c", "echo 'Container started'"]
`;
    }

    fs.writeFileSync(path.join(projectPath, 'Dockerfile'), dockerfileContent);

    // Generate .dockerignore
    const dockerignoreContent = `node_modules
target
.git
.gitignore
README.md
.env
*.log
`;

    fs.writeFileSync(path.join(projectPath, '.dockerignore'), dockerignoreContent);
}

function generateGitHubActions(pipelineConfig) {
    const { trigger, stages } = pipelineConfig;
    console.log(" pipelineConfig", pipelineConfig);
    // Extract trigger configuration
    console.log(" trigger", trigger);
    const triggerBranches = trigger.branch ? [trigger.branch] : ['main', 'develop'];

    let jobsContent = '';

    stages.forEach((stage, stageIndex) => {
        console.log(" stage", stage);
        if (stage.projects 
            // && stage.parallel
        ) {
            console.log(stage)
            // Generate parallel jobs for projects in this stage
            stage.projects.forEach((project, projectIndex) => {
                console.log(" project", project);
                const jobName = `${stage.id}-${project.name.toLowerCase()}`;

                let stepsContent = `      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup environment for ${project.name}
        uses: actions/setup-node@v4
        with:
          node-version: '18'
        if: contains('${project.image}', 'node')
      
      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '11'
        if: contains('${project.image}', 'maven')
`;

                project.steps.forEach((step, stepIndex) => {
                    stepsContent += `
      - name: ${project.name} - Step ${stepIndex + 1}
        run: ${step.command}
`;
                });

                jobsContent += `  ${jobName}:
    runs-on: ubuntu-latest
    container:
      image: ${project.image}
    steps:
${stepsContent}
      
      - name: Archive artifacts for ${project.name}
        uses: actions/upload-artifact@v4
        with:
          name: ${jobName}-artifacts
          path: |
            **/dist/
            **/build/
            **/target/
        if: success()

`;
            });
        }
//          else {
//             // Generate single job for stage
//             const jobName = stage.id;
//             let stepsContent = `      - name: Checkout code
//         uses: actions/checkout@v4
      
//       - name: Setup environment
//         uses: actions/setup-node@v4
//         with:
//           node-version: '18'
//         if: contains('${project.image}', 'node')
// `;

//             if (stage.steps) {
//                 stage.steps.forEach((step, stepIndex) => {
//                     stepsContent += `
//       - name: ${stage.name} - Step ${stepIndex + 1}
//         run: ${step.command}
// `;
//                 });
//             }

//             jobsContent += `  ${jobName}:
//     runs-on: ubuntu-latest
//     container:
//       image: ${project.image}
//     steps:
// ${stepsContent}

// `;
//         }
    });

    return `name: CI/CD Pipeline

on:
  push:
    branches: [ ${triggerBranches.join(', ')} ]
  pull_request:
    branches: [ ${triggerBranches.join(', ')} ]

env:
  NODE_ENV: production

jobs:
${jobsContent}`;
}

function generateGitLabCI(pipelineConfig) {
    const { trigger, stages } = pipelineConfig;

    // Use a default image at the pipeline level
    let content = `image: ubuntu:latest

variables:
  NODE_ENV: production

stages:
`;

    // Generate stage names
    stages.forEach(stage => {
        content += `  - ${stage.id}\n`;
    });

    content += '\n';

    // Generate jobs for each stage
    stages.forEach(stage => {
        if (stage.projects && stage.parallel) {
            // Generate parallel jobs for projects
            stage.projects.forEach(project => {
                const jobName = `${stage.id}-${project.name.toLowerCase()}`;

                content += `${jobName}:
  stage: ${stage.id}
  image: ${project.image}
  script:
`;
                project.steps.forEach(step => {
                    content += `    - ${step.command}\n`;
                });

                content += `  artifacts:
    paths:
      - "**/dist/"
      - "**/build/"
      - "**/target/"
    expire_in: 1 week
  only:
    refs:
      - ${trigger.branch || 'main'}
      - merge_requests

`;
            });
        } else {
            // Generate single job for stage - use first project's image if available
            const projectImage = stage.projects && stage.projects[0] ? stage.projects[0].image : 'ubuntu:latest';
            content += `${stage.id}:
  stage: ${stage.id}
  image: ${projectImage}
  script:
`;
            if (stage.steps) {
                stage.steps.forEach(step => {
                    content += `    - ${step.command}\n`;
                });
            }

            content += `  only:
    refs:
      - ${trigger.branch || 'main'}
      - merge_requests

`;
        }
    });

    return content;
}

function generateJenkinsfile(pipelineConfig) {
    const { trigger, stages } = pipelineConfig;

    let script = `pipeline {
        agent any
        
        environment {
            NODE_ENV = 'production'
        }
        
        triggers {
            pollSCM('H/5 * * * *') // Poll every 5 minutes
        }
        
        stages {
            stage('Checkout') {
                steps {
                    echo 'Checking out source code...'
                    checkout scm
                }
            }
`;

    stages.forEach(stage => {
        if (stage.projects && stage.parallel) {
            // Generate parallel stage
            script += `
        stage('${stage.name}') {
            parallel {
`;
            stage.projects.forEach(project => {
                script += `                '${project.name}': {
                    node {
                        docker.image('${project.image}').inside {
`;
                project.steps.forEach(step => {
                    script += `                            sh '${step.command}'\n`;
                });
                script += `                        }
                    }
                },
`;
            });
            script += `            }
        }
`;
        } else {
            // Generate sequential stage - use first project's image if available
            const projectImage = stage.projects && stage.projects[0] ? stage.projects[0].image : 'ubuntu:latest';
            script += `
        stage('${stage.name}') {
            steps {
                script {
                    docker.image('${projectImage}').inside {
`;
            if (stage.steps) {
                stage.steps.forEach(step => {
                    script += `                        sh '${step.command}'\n`;
                });
            }
            script += `                    }
                }
            }
        }
`;
        }
    });

    script += `    }
    
    post {
        always {
            echo 'Pipeline completed!'
            archiveArtifacts artifacts: '**/dist/**, **/build/**, **/target/**', allowEmptyArchive: true
            cleanWs()
        }
        success {
            echo 'Pipeline succeeded!'
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
}`;

    return script;
}

export default { generateFile };
