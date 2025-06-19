export const exampleRequestBody = {
    message: 'Example request body for CI/CD generation',
};

export const EXAMPLE_PROJECT_ANALYSIS_RESPONSE = {
    id: 'project-uuid-123',
    projectName: 'My Awesome Project',
    description: 'A full-stack application with multiple services',
    gitUrl: 'https://github.com/user/repo.git',
    repoStorage: 'https://api.example.com/download/user-id/repo-id',
    totalProjects: 3,
    mainTechnology: 'nodejs',
    technologies: ['nodejs', 'java', 'python'],
    projectPaths: [
        {
            name: 'frontend',
            path: 'frontend',
            technology: 'nodejs',
            framework: 'React',
            version: '18.x',
            buildTool: 'NPM',
            dependencies: ['react', 'react-dom', '@types/react', 'typescript', 'vite'],
        },
        {
            name: 'backend-api',
            path: 'backend/api',
            technology: 'java',
            framework: 'Spring Boot',
            version: '17',
            buildTool: 'Maven',
            dependencies: [],
        },
        {
            name: 'ml-service',
            path: 'services/ml-service',
            technology: 'python',
            framework: 'FastAPI',
            version: 'Unknown',
            buildTool: 'pip',
            dependencies: ['fastapi', 'uvicorn', 'pandas', 'numpy', 'scikit-learn'],
        },
    ],
};
